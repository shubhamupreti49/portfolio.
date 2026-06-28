// State (hoisted so panel switching, which runs early, can reference these safely)
let trajectoryChart = null, skillsRadar = null;
let countersDone = false, profDone = false;

// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('nav ul');
const body = document.body;

if (menuToggle) {
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        body.classList.toggle('menu-open');
    });
    
    // Close menu when clicking nav links
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
            body.classList.remove('menu-open');
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
            body.classList.remove('menu-open');
        }
    });
}

// Scroll Progress Bar
window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    document.getElementById('progressBar').style.width = scrolled + '%';
});

// Fade-in Animation on Scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Tab-panel navigation: each top-level section is a "tab" shown one at a time.
// Only active on the index page (body.tabbed); detail/contact pages scroll normally.
const isTabbed = document.body.classList.contains('tabbed');
const panels = document.querySelectorAll('body > section');
const tabLinks = document.querySelectorAll('.tab-link');

function activatePanel(id) {
    let matched = false;
    panels.forEach(panel => {
        const isMatch = panel.id === id;
        panel.classList.toggle('active-panel', isMatch);
        if (isMatch) {
            matched = true;
            panel.classList.add('visible'); // skip fade-in scroll animation, show immediately
        }
    });
    if (!matched && panels.length) {
        panels[0].classList.add('active-panel', 'visible');
        id = panels[0].id;
    }
    tabLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href').slice(1) === id);
    });
    window.scrollTo(0, 0);

    // trigger panel-specific animations
    if (id === 'home') { runCounters(); if (trajectoryChart) trajectoryChart.resize(); }
    if (id === 'skills') { runProf(); if (skillsRadar) skillsRadar.resize(); }
}

if (isTabbed) {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const id = this.getAttribute('href').slice(1);
            if (!document.getElementById(id)) return;
            e.preventDefault();
            activatePanel(id);
            history.pushState(null, '', '#' + id);
        });
    });

    window.addEventListener('popstate', () => {
        activatePanel(location.hash.slice(1) || 'home');
    });

    activatePanel(location.hash.slice(1) || 'home');
}

// ============================================================
//  THE UPRETI INDEX — interactive dashboard widgets
// ============================================================

// --- Indicator ticker tape ---
function buildTicker() {
    const track = document.getElementById('tickerTrack');
    if (!track) return;
    const items = [
        ['GPA', '3.9', 'up'],
        ['PUBLICATIONS', '2', 'up'],
        ['RESEARCH ROLES', '3', 'up'],
        ['DATA SPAN', '43 YRS', 'up'],
        ['ROWS MODELED', '70K+', 'up'],
        ['LANGUAGES', 'PY·R·SQL', ''],
        ['MODELS', 'SVAR · VAR(4)', ''],
        ['RESEARCH GRANT', '$3,000', 'up'],
        ['SYMPOSIUM', '200+ SCHOLARS', 'up'],
        ['FOCUS', 'MONETARY POLICY', ''],
        ['STATUS', 'OPEN TO PhD', 'up']
    ];
    const one = items.map(([k, v, d]) =>
        `<span class="ticker-item"><span class="tk">${k}</span>` +
        `<span class="tv ${d}">${d === 'up' ? '▲ ' : ''}${v}</span></span>` +
        `<span class="ticker-sep">•</span>`
    ).join('');
    // duplicate for seamless -50% loop
    track.innerHTML = one + one;
}
buildTicker();

// --- Animated KPI counters (run when hero is shown) ---
function runCounters() {
    if (countersDone) return;
    countersDone = true;
    document.querySelectorAll('.kpi-val[data-count]').forEach(el => {
        const target = parseFloat(el.getAttribute('data-count'));
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        const numSpan = el.querySelector('span');
        const duration = 1300;
        const start = performance.now();
        function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            numSpan.textContent = (target * eased).toFixed(decimals);
            if (p < 1) requestAnimationFrame(tick);
            else numSpan.textContent = target.toFixed(decimals);
        }
        requestAnimationFrame(tick);
        // fallback: guarantee the final value even if rAF is throttled (background tab)
        setTimeout(() => { numSpan.textContent = target.toFixed(decimals); }, duration + 250);
    });
}

// --- Proficiency bars (run when skills tab is shown) ---
function runProf() {
    if (profDone) return;
    profDone = true;
    document.querySelectorAll('#profList .prof').forEach((row, i) => {
        const val = row.getAttribute('data-val');
        setTimeout(() => {
            const fill = row.querySelector('.prof-fill');
            if (fill) fill.style.width = val + '%';
        }, 120 * i);
    });
}

// --- Charts (Chart.js) ---
const chartInk = '#15223B', chartSoft = '#8A93A3', chartGrid = 'rgba(21,34,59,0.07)';
const chartPrimary = '#0E7C66', chartAccent = '#C2410C';

function initTrajectoryChart() {
    const ctx = document.getElementById('trajectoryChart');
    if (!ctx || trajectoryChart || typeof Chart === 'undefined') return;
    const grad = ctx.getContext('2d').createLinearGradient(0, 0, 0, 170);
    grad.addColorStop(0, 'rgba(14,124,102,0.28)');
    grad.addColorStop(1, 'rgba(14,124,102,0.0)');
    trajectoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['2023', 'Q1 \'24', 'Q3 \'24', 'Q1 \'25', 'Q2 \'25', 'Q3 \'25'],
            datasets: [{
                label: 'Research milestones',
                data: [0, 1, 2, 4, 6, 9],
                borderColor: chartPrimary,
                backgroundColor: grad,
                fill: true,
                tension: 0.4,
                borderWidth: 2.5,
                pointBackgroundColor: chartAccent,
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false },
                tooltip: { backgroundColor: chartInk, titleFont: { family: 'JetBrains Mono' }, bodyFont: { family: 'JetBrains Mono' } } },
            scales: {
                x: { grid: { color: chartGrid }, ticks: { color: chartSoft, font: { family: 'JetBrains Mono', size: 9 } } },
                y: { grid: { color: chartGrid }, ticks: { color: chartSoft, font: { family: 'JetBrains Mono', size: 9 }, stepSize: 3 }, beginAtZero: true }
            }
        }
    });
}

function initSkillsRadar() {
    const ctx = document.getElementById('skillsRadar');
    if (!ctx || skillsRadar || typeof Chart === 'undefined') return;
    skillsRadar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Econometrics', 'Programming', 'Data Viz', 'Policy Research', 'Statistics', 'Data Engineering'],
            datasets: [{
                label: 'Proficiency',
                data: [88, 90, 80, 86, 84, 76],
                borderColor: chartPrimary,
                backgroundColor: 'rgba(14,124,102,0.15)',
                borderWidth: 2,
                pointBackgroundColor: chartAccent,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { display: false },
                tooltip: { backgroundColor: chartInk } },
            scales: {
                r: {
                    angleLines: { color: chartGrid },
                    grid: { color: chartGrid },
                    suggestedMin: 0, suggestedMax: 100,
                    ticks: { display: false, stepSize: 25 },
                    pointLabels: { color: chartInk, font: { family: 'JetBrains Mono', size: 10 } }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initTrajectoryChart();
    initSkillsRadar();
    // if home is the active panel on load, animate counters
    if (document.getElementById('home') && document.getElementById('home').classList.contains('active-panel')) {
        runCounters();
    }
});

// Image lightbox functionality
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('.project-image');
    
    images.forEach(img => {
        // Add click handler for lightbox
        img.addEventListener('click', function() {
            openLightbox(this);
        });
        
        // Lazy loading
        if ('loading' in HTMLImageElement.prototype) {
            img.loading = 'lazy';
        }
    });
});

function openLightbox(imgElement) {
    // Create lightbox overlay
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    
    // Create close button
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-lightbox';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close lightbox');
    
    // Create enlarged image
    const img = document.createElement('img');
    img.src = imgElement.src;
    img.alt = imgElement.alt;
    
    // Create caption from figure caption if exists
    const caption = document.createElement('p');
    caption.className = 'lightbox-caption';
    const figCaption = imgElement.nextElementSibling;
    caption.textContent = figCaption && figCaption.classList.contains('image-caption') 
        ? figCaption.textContent 
        : imgElement.alt;
    
    // Assemble lightbox
    lightbox.appendChild(closeBtn);
    lightbox.appendChild(img);
    lightbox.appendChild(caption);
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';
    
    // Close handlers
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Keyboard escape
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeLightbox();
            document.removeEventListener('keydown', escHandler);
        }
    });
    
    function closeLightbox() {
        lightbox.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(lightbox);
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

// Add fade out animation
const style = document.createElement('style');
style.textContent = `
    .lightbox.fade-out {
        animation: fadeOut 0.3s ease;
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);
