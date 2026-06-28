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

// Tab-panel navigation: each top-level section is a "tab" shown one at a time
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
}

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

// Hero terminal typewriter effect
function runTerminal() {
    const body = document.getElementById('terminalBody');
    if (!body) return;

    const lines = [
        { prompt: '$ ', text: 'whoami' },
        { prompt: '> ', text: 'Shubham Upreti — Economics & Data Science' },
        { prompt: '$ ', text: 'cat research_interests.txt' },
        { prompt: '> ', text: 'Monetary policy transmission, time-series econometrics, macro-financial linkages' },
        { prompt: '$ ', text: './status --check' },
        { prompt: '> ', text: '2 publications · 3 research positions · GPA 3.9' },
        { prompt: '$ ', text: './seeking --positions' },
        { prompt: '> ', text: 'PhD pre-doc / RA roles in empirical macro & econometrics' }
    ];

    let lineIndex = 0;
    let charIndex = 0;
    body.innerHTML = '';

    function typeNextChar() {
        if (lineIndex >= lines.length) {
            const cursor = document.createElement('span');
            cursor.className = 'term-cursor';
            body.appendChild(cursor);
            return;
        }

        const current = lines[lineIndex];

        if (charIndex === 0) {
            const promptSpan = document.createElement('span');
            promptSpan.className = 'term-prompt';
            promptSpan.textContent = current.prompt;
            body.appendChild(promptSpan);
            body.appendChild(document.createTextNode(''));
        }

        const lastNode = body.lastChild;
        lastNode.textContent += current.text[charIndex];
        charIndex++;

        if (charIndex < current.text.length) {
            setTimeout(typeNextChar, 18);
        } else {
            body.appendChild(document.createElement('br'));
            lineIndex++;
            charIndex = 0;
            setTimeout(typeNextChar, 450);
        }
    }

    typeNextChar();
}

document.addEventListener('DOMContentLoaded', runTerminal);

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
