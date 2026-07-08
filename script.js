// State (hoisted so panel switching, which runs early, can reference these safely)
let trajectoryChart = null, skillsRadar = null;
let countersDone = false, profDone = false;
const chartPrimary = '#0E7C66', chartAccent = '#C2410C', chartTooltipBg = '#15223B';

// ============================================================
//  THEME (light / dark) — applied immediately to avoid flash
// ============================================================
const savedTheme = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.dataset.theme = savedTheme;

function themeColors() {
    const dark = document.documentElement.dataset.theme === 'dark';
    return {
        ink:  dark ? '#E8EDF6' : '#15223B',
        soft: dark ? '#7E8A9C' : '#8A93A3',
        grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(21,34,59,0.07)'
    };
}

function restyleCharts() {
    const t = themeColors();
    if (trajectoryChart) {
        const s = trajectoryChart.options.scales;
        s.x.grid.color = t.grid; s.y.grid.color = t.grid;
        s.x.ticks.color = t.soft; s.y.ticks.color = t.soft;
        trajectoryChart.update('none');
    }
    if (skillsRadar) {
        const r = skillsRadar.options.scales.r;
        r.angleLines.color = t.grid; r.grid.color = t.grid;
        r.pointLabels.color = t.ink;
        skillsRadar.update('none');
    }
}

function applyTheme(mode) {
    document.documentElement.dataset.theme = mode;
    localStorage.setItem('theme', mode);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = mode === 'dark' ? '☀' : '☾';
    restyleCharts();
}

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

    // trigger panel-specific animations (charts are lazy-initialized on first view
    // so Chart.js never measures a display:none canvas as 0x0)
    if (id === 'home') {
        runCounters();
        if (!trajectoryChart && typeof initTrajectoryChart === 'function') initTrajectoryChart();
        else if (trajectoryChart) trajectoryChart.resize();
    }
    if (id === 'skills') {
        runProf();
        if (!skillsRadar && typeof initSkillsRadar === 'function') initSkillsRadar();
        else if (skillsRadar) skillsRadar.resize();
    }
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
        ['GPA', '3.92 / 4.0', 'up'],
        ['RESEARCH ROLES', '8', 'up'],
        ['PAPERS', '5', 'up'],
        ['PUBLISHED', '1 PEER-REVIEWED', 'up'],
        ['GRANT FACILITATED', '$3.8M', 'up'],
        ['DATA SPAN', '52 YRS', 'up'],
        ['LANGUAGES', '5', ''],
        ['METHODS', 'SVAR · VAR · DiD', ''],
        ['FIELDS', 'MONETARY · DEV · LABOR', ''],
        ['MAJOR', 'ECON · MATH', ''],
        ['STATUS', 'OPEN TO PhD / PREDOC', 'up']
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
        const numSpan = el.querySelector('span:not(.suffix)');
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
function initTrajectoryChart() {
    const ctx = document.getElementById('trajectoryChart');
    if (!ctx || trajectoryChart || typeof Chart === 'undefined') return;
    const t = themeColors();
    const chartInk = t.ink, chartSoft = t.soft, chartGrid = t.grid;
    const grad = ctx.getContext('2d').createLinearGradient(0, 0, 0, 170);
    grad.addColorStop(0, 'rgba(14,124,102,0.28)');
    grad.addColorStop(1, 'rgba(14,124,102,0.0)');
    trajectoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['2024', 'H1 \'25', 'H2 \'25', 'H1 \'26', 'H2 \'26'],
            datasets: [{
                label: 'Research milestones',
                data: [0, 3, 6, 9, 13],
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
                tooltip: { backgroundColor: chartTooltipBg, titleFont: { family: 'JetBrains Mono' }, bodyFont: { family: 'JetBrains Mono' } } },
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
    const t = themeColors();
    const chartInk = t.ink, chartGrid = t.grid;
    skillsRadar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Econometrics', 'Programming', 'Data Viz', 'Development Econ', 'Time-Series', 'Policy Research'],
            datasets: [{
                label: 'Proficiency',
                data: [88, 84, 84, 82, 86, 85],
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
                tooltip: { backgroundColor: chartTooltipBg } },
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
    // only initialize charts whose canvas is actually visible; hidden panels
    // lazy-init on first activation (Chart.js measures display:none as 0x0)
    const trajCanvas = document.getElementById('trajectoryChart');
    const radarCanvas = document.getElementById('skillsRadar');
    if (trajCanvas && trajCanvas.offsetParent !== null) initTrajectoryChart();
    if (radarCanvas && radarCanvas.offsetParent !== null) initSkillsRadar();
    // if home is the active panel on load, animate counters
    if (document.getElementById('home') && document.getElementById('home').classList.contains('active-panel')) {
        runCounters();
    }

    // --- Floating action buttons (injected on every page) ---
    const stack = document.createElement('div');
    stack.className = 'fab-stack';
    const themeBtn = document.createElement('button');
    themeBtn.className = 'fab';
    themeBtn.id = 'themeToggle';
    themeBtn.setAttribute('aria-label', 'Toggle dark mode');
    themeBtn.textContent = document.documentElement.dataset.theme === 'dark' ? '☀' : '☾';
    const topBtn = document.createElement('button');
    topBtn.className = 'fab';
    topBtn.id = 'backToTop';
    topBtn.setAttribute('aria-label', 'Back to top');
    topBtn.textContent = '↑';
    stack.appendChild(themeBtn);
    stack.appendChild(topBtn);
    document.body.appendChild(stack);

    themeBtn.addEventListener('click', () => {
        applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    });
    topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => {
        topBtn.classList.toggle('show', window.scrollY > 400);
    }, { passive: true });

    // charts were initialized with load-time theme; re-sync in case it was dark
    restyleCharts();
});

// ============================================================
//  TAB NAVIGATION EXTRAS — swipe (touch) + arrow keys (index only)
// ============================================================
function stepTab(dir) {
    if (!isTabbed || !tabLinks.length) return;
    const links = Array.from(tabLinks);
    const current = links.findIndex(l => l.classList.contains('active'));
    const next = current + dir;
    if (next < 0 || next >= links.length) return;
    links[next].click();
}

if (isTabbed) {
    // Arrow-key navigation (skipped while typing in a form field)
    document.addEventListener('keydown', (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
        if (e.key === 'ArrowRight') stepTab(1);
        if (e.key === 'ArrowLeft') stepTab(-1);
    });

    // Swipe navigation on touch devices
    let touchX = null, touchY = null;
    document.addEventListener('touchstart', (e) => {
        // ignore swipes that start on horizontally scrollable UI
        if (e.target.closest('nav, .ticker, .results-table, .code-block, canvas, .fab-stack')) { touchX = null; return; }
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchend', (e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        const dy = e.changedTouches[0].clientY - touchY;
        touchX = null;
        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) {
            stepTab(dx < 0 ? 1 : -1);
        }
    }, { passive: true });
}

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
