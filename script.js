/* ============================================================
   Shubham Upreti — site interactions (shared by every page)
   ============================================================ */
(() => {
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const isHome = document.body.classList.contains('home');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
}

// ============================================================
//  THEME
// ============================================================
function syncThemeButtons() {
    const dark = document.documentElement.dataset.theme === 'dark';
    $$('[data-theme-toggle]').forEach(btn => {
        btn.innerHTML = dark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    });
}
if (!document.documentElement.dataset.theme) {
    document.documentElement.dataset.theme = store('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
document.addEventListener('click', e => {
    const btn = e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store('theme', next);
    syncThemeButtons();
});
syncThemeButtons();

// ============================================================
//  TOAST
// ============================================================
let toastTimer;
function toast(msg) {
    let el = $('#toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status');
        document.body.appendChild(el);
    }
    el.innerHTML = '<i class="fas fa-circle-check"></i><span></span>';
    el.querySelector('span').textContent = msg;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ============================================================
//  RIPPLE FEEDBACK on buttons and pills
// ============================================================
document.addEventListener('pointerdown', e => {
    const host = e.target.closest('.btn, .pill');
    if (!host || reduceMotion) return;
    const r = host.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const dot = document.createElement('span');
    dot.className = 'ripple';
    dot.style.width = dot.style.height = size + 'px';
    dot.style.left = (e.clientX - r.left - size / 2) + 'px';
    dot.style.top = (e.clientY - r.top - size / 2) + 'px';
    host.appendChild(dot);
    setTimeout(() => dot.remove(), 600);
});

// ============================================================
//  HEADER: shadow on scroll, progress bar, mobile menu
// ============================================================
const header = $('#siteHeader');
const progress = $('#progressBar');
function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 8);
    if (progress) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
    if (backTop) backTop.classList.toggle('show', y > 600);
}

const nav = $('#mainNav');
const menuBtn = $('.menu-toggle');
let scrim;
function setMenu(open) {
    if (!nav || !menuBtn) return;
    if (!scrim) {
        scrim = document.createElement('div');
        scrim.className = 'nav-scrim';
        scrim.addEventListener('click', () => setMenu(false));
        document.body.appendChild(scrim);
    }
    nav.classList.toggle('open', open);
    scrim.classList.toggle('show', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.innerHTML = open ? '<i class="fas fa-xmark"></i>' : '<i class="fas fa-bars"></i>';
    document.body.classList.toggle('no-scroll', open);
}
if (menuBtn) {
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    $$('a', nav).forEach(a => a.addEventListener('click', e => {
        const wasOpen = nav.classList.contains('open');
        setMenu(false);
        // The open drawer locks body scroll, so the browser's own jump to the anchor
        // would be swallowed; scroll manually once the lock is released.
        const hash = a.getAttribute('href');
        const target = wasOpen && hash.startsWith('#') ? $(hash) : null;
        if (!target) return;
        e.preventDefault();
        history.pushState(null, '', hash);
        setTimeout(() => target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }), 20);
    }));
}

// Back-to-top button (every page)
const fabs = document.createElement('div');
fabs.className = 'fab-stack';
fabs.innerHTML = '<button class="fab-btn" id="backToTop" type="button" aria-label="Back to top"><i class="fas fa-arrow-up"></i></button>';
document.body.appendChild(fabs);
const backTop = $('#backToTop');
backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Scrollspy (home page only)
if (isHome && nav) {
    const links = $$('a[href^="#"]', nav);
    const targets = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
    const spy = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(t => spy.observe(t));
}

// ============================================================
//  REVEAL ON SCROLL, COUNTERS, METERS
// ============================================================
function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const fmt = v => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    if (reduceMotion) { el.textContent = fmt(target); return; }
    const start = performance.now(), dur = 1400;
    const tick = now => {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(() => { el.textContent = fmt(target); }, dur + 300);
}

const revealer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('visible');
        $$('[data-count]', el).forEach(countUp);
        if (el.id === 'meters') {
            $$('.meter', el).forEach((m, i) => setTimeout(() => { $('.meter-fill', m).style.width = m.dataset.val + '%'; }, i * 110));
        }
        revealer.unobserve(el);
    });
}, { threshold: 0.15 });
$$('.reveal, .fade-in, #meters').forEach(el => revealer.observe(el));

// ============================================================
//  LIGHTBOX (gallery, quick-view figures, detail-page images)
// ============================================================
let lb = null;
function openLightbox(items, index = 0) {
    if (!items.length) return;
    closeLightbox(true);
    let i = index;
    const lastFocus = document.activeElement;
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = `
        <span class="lb-count" aria-live="polite"></span>
        <button class="lb-btn lb-close" type="button" aria-label="Close"><i class="fas fa-xmark"></i></button>
        ${items.length > 1 ? '<button class="lb-btn lb-prev" type="button" aria-label="Previous image"><i class="fas fa-chevron-left"></i></button><button class="lb-btn lb-next" type="button" aria-label="Next image"><i class="fas fa-chevron-right"></i></button>' : ''}
        <figure><img alt=""><figcaption class="lightbox-caption"></figcaption></figure>`;
    document.body.appendChild(lb);
    document.body.classList.add('no-scroll');
    const img = $('img', lb), cap = $('.lightbox-caption', lb), count = $('.lb-count', lb);
    const show = n => {
        i = (n + items.length) % items.length;
        const it = items[i];
        img.src = it.src; img.alt = it.alt || '';
        img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
        cap.innerHTML = '';
        cap.append(document.createTextNode(it.caption || it.alt || ''));
        if (it.sub) { const s = document.createElement('span'); s.textContent = it.sub; cap.appendChild(s); }
        count.textContent = items.length > 1 ? `${i + 1} / ${items.length}` : '';
    };
    show(i);
    lb._key = e => {
        if (e.key === 'Escape') { e.stopPropagation(); closeLightbox(); }
        if (e.key === 'ArrowRight') show(i + 1);
        if (e.key === 'ArrowLeft') show(i - 1);
    };
    document.addEventListener('keydown', lb._key, true);
    lb.addEventListener('click', e => {
        if (e.target === lb || e.target.closest('.lb-close')) closeLightbox();
        else if (e.target.closest('.lb-next')) show(i + 1);
        else if (e.target.closest('.lb-prev')) show(i - 1);
    });
    let sx = null;
    lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => {
        if (sx === null) return;
        const dx = e.changedTouches[0].clientX - sx; sx = null;
        if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1));
    }, { passive: true });
    lb._lastFocus = lastFocus;
    $('.lb-close', lb).focus();
}
function closeLightbox(immediate) {
    if (!lb) return;
    const el = lb; lb = null;
    document.removeEventListener('keydown', el._key, true);
    if (!$('.modal.open')) document.body.classList.remove('no-scroll');
    if (el._lastFocus) el._lastFocus.focus({ preventScroll: true });
    if (immediate) { el.remove(); return; }
    el.classList.add('fade-out');
    setTimeout(() => el.remove(), 200);
}

// Detail-page figures
const pageImages = $$('.project-image');
pageImages.forEach((img, idx) => {
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    const open = () => openLightbox(pageImages.map(im => {
        const capEl = im.nextElementSibling && im.nextElementSibling.classList.contains('image-caption') ? im.nextElementSibling : null;
        return { src: im.currentSrc || im.src, alt: im.alt, caption: capEl ? capEl.textContent : im.alt };
    }), idx);
    img.addEventListener('click', open);
    img.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
});

// ============================================================
//  GENERIC PILL FILTER (gallery, experience, publications)
// ============================================================
function pillFilter(groupSel, itemSel, attr) {
    const group = $(groupSel);
    if (!group) return null;
    const pills = $$('.pill', group);
    const items = $$(itemSel);
    pills.forEach(p => {
        const key = p.dataset[attr];
        const n = key === 'all' ? items.length : items.filter(it => it.dataset[attr] === key).length;
        const c = $('.count', p); if (c) c.textContent = n;
    });
    const apply = key => {
        pills.forEach(p => p.setAttribute('aria-pressed', String(p.dataset[attr] === key)));
        items.forEach(it => {
            const show = key === 'all' || it.dataset[attr] === key;
            const wasHidden = it.classList.contains('is-hidden');
            it.classList.toggle('is-hidden', !show);
            if (show && wasHidden) { it.classList.remove('entering'); void it.offsetWidth; it.classList.add('entering'); }
        });
    };
    group.addEventListener('click', e => {
        const p = e.target.closest('.pill');
        if (p) apply(p.dataset[attr]);
    });
    return apply;
}

// ---- Gallery ----
pillFilter('#galleryFilters', '#gallery .g-item', 'cat');
const gallery = $('#gallery');
if (gallery) {
    gallery.addEventListener('click', e => {
        const btn = e.target.closest('.g-open');
        if (!btn) return;
        const visible = $$('.g-item', gallery).filter(g => !g.classList.contains('is-hidden'));
        const items = visible.map(g => {
            const im = $('img', g);
            return { src: im.src, alt: im.alt, caption: $('figcaption strong', g).textContent, sub: $('figcaption span', g).textContent };
        });
        openLightbox(items, visible.indexOf(btn.closest('.g-item')));
    });
}

// ---- Experience accordion ----
const timeline = $('#timeline');
if (timeline) {
    pillFilter('#expFilters', '#timeline .tl-item', 'kind');
    const setOpen = (item, open) => {
        item.classList.toggle('open', open);
        $('.tl-head', item).setAttribute('aria-expanded', String(open));
    };
    timeline.addEventListener('click', e => {
        const head = e.target.closest('.tl-head');
        if (!head) return;
        const item = head.closest('.tl-item');
        setOpen(item, !item.classList.contains('open'));
    });
    const expandBtn = $('#expandAll');
    if (expandBtn) {
        expandBtn.addEventListener('click', () => {
            const items = $$('.tl-item', timeline);
            const allOpen = items.every(it => it.classList.contains('open'));
            items.forEach(it => setOpen(it, !allOpen));
            expandBtn.textContent = allOpen ? 'Expand all' : 'Collapse all';
        });
    }
}

// ---- Publications ----
const pubList = $('#pubList');
if (pubList) {
    pillFilter('#pubFilters', '#pubList .pub', 'status');
    pubList.addEventListener('click', async e => {
        const abs = e.target.closest('[data-abstract]');
        if (abs) {
            const pub = abs.closest('.pub');
            const open = pub.classList.toggle('show-abstract');
            abs.innerHTML = open ? 'Hide abstract <i class="fas fa-chevron-up"></i>' : 'Read abstract <i class="fas fa-chevron-down"></i>';
            return;
        }
        const cite = e.target.closest('[data-cite]');
        if (cite) {
            const text = cite.dataset.cite;
            try { await navigator.clipboard.writeText(text); }
            catch (err) {
                const ta = document.createElement('textarea');
                ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
                document.body.appendChild(ta); ta.select();
                try { document.execCommand('copy'); } catch (e2) { /* ignore */ }
                ta.remove();
            }
            toast('Citation copied to clipboard');
        }
    });
}

// ============================================================
//  RESEARCH EXPLORER — faceted filters, search, sort, views
// ============================================================
const LABELS = {
    topic:  { monetary: 'Monetary & Macro', development: 'Development & Labor', political: 'Political Economy', health: 'Health & Environment', finance: 'Banking & Finance' },
    region: { nepal: 'Nepal', usa: 'United States', uk: 'United Kingdom' },
    type:   { faculty: 'Faculty research', publication: 'Peer-reviewed', working: 'Working paper', dashboard: 'Dashboard & tool', data: 'Open data & archive', analysis: 'Data analysis' },
    method: { svar: 'SVAR', var: 'VAR / Granger', timeseries: 'Time series', logistic: 'Logistic regression', geospatial: 'Geospatial / GIS', spatial: 'Spatial econometrics', shiny: 'R Shiny', dataviz: 'Data visualization', web: 'Web development', python: 'Python' },
    year:   { 2026: '2026', 2025: '2025' }
};
const FACETS = Object.keys(LABELS);
const grid = $('#cardGrid');
let cards = [];
let openQuickView = () => {};

if (grid) {
    cards = $$('.r-card', grid).map(el => ({
        el,
        id: el.dataset.id,
        title: $('.r-card-title', el).textContent.trim(),
        date: el.dataset.date || '',
        values: Object.fromEntries(FACETS.map(f => [f, (el.dataset[f] || '').split(/\s+/).filter(Boolean)])),
        text: el.textContent.toLowerCase().replace(/\s+/g, ' ')
    }));
    const state = { q: '', sort: 'newest', sel: Object.fromEntries(FACETS.map(f => [f, new Set()])) };
    const searchInput = $('#exploreSearch');
    const sortSelect = $('#sortSelect');
    const chips = $('#activeChips');
    const clearBtn = $('#clearFilters');
    const filtersEl = $('#filters');
    const fscrim = $('#filterScrim');

    // Read state from URL (?topic=a,b&q=...)
    const params = new URLSearchParams(location.search);
    FACETS.forEach(f => (params.get(f) || '').split(',').filter(Boolean).forEach(v => state.sel[f].add(v)));
    state.q = params.get('q') || '';
    state.sort = params.get('sort') || 'newest';
    if (searchInput) searchInput.value = state.q;
    if (sortSelect) sortSelect.value = state.sort;

    // Build facet checkboxes
    FACETS.forEach(f => {
        const body = $(`.facet[data-facet="${f}"] .facet-body`);
        if (!body) return;
        const present = new Set(cards.flatMap(c => c.values[f]));
        Object.keys(LABELS[f]).filter(v => present.has(v)).sort((a, b) => f === 'year' ? b - a : 0).forEach(v => {
            const label = document.createElement('label');
            label.className = 'check';
            label.innerHTML = `<input type="checkbox" value="${v}"><span class="box" aria-hidden="true"></span><span class="label"></span><span class="num">0</span>`;
            const lab = $('.label', label);
            if (f === 'topic') lab.innerHTML = `<span class="topic-dot" data-topic="${v}"></span>`;
            lab.append(document.createTextNode(LABELS[f][v]));
            const input = $('input', label);
            input.dataset.facet = f;
            input.checked = state.sel[f].has(v);
            body.appendChild(label);
        });
    });

    const matches = (c, skipFacet) => {
        if (state.q && !state.q.toLowerCase().split(/\s+/).every(w => c.text.includes(w))) return false;
        return FACETS.every(f => f === skipFacet || !state.sel[f].size || c.values[f].some(v => state.sel[f].has(v)));
    };

    function syncURL() {
        const p = new URLSearchParams();
        FACETS.forEach(f => { if (state.sel[f].size) p.set(f, [...state.sel[f]].join(',')); });
        if (state.q) p.set('q', state.q);
        if (state.sort !== 'newest') p.set('sort', state.sort);
        const qs = p.toString();
        history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    }

    function render(animate = true) {
        // facet counts: how many cards would match if this option were (also) selected
        $$('.check input', filtersEl).forEach(input => {
            const f = input.dataset.facet, v = input.value;
            const n = cards.filter(c => matches(c, f) && c.values[f].includes(v)).length;
            $('.num', input.closest('.check')).textContent = n;
            input.closest('.check').classList.toggle('is-zero', n === 0 && !input.checked);
        });
        $$('.facet', filtersEl).forEach(d => {
            const f = d.dataset.facet;
            let badge = $('.facet-active', d);
            if (state.sel[f].size) {
                if (!badge) { badge = document.createElement('span'); badge.className = 'facet-active'; $('summary', d).insertBefore(badge, $('.chev', d)); }
                badge.textContent = state.sel[f].size;
            } else if (badge) badge.remove();
        });

        const sorted = [...cards].sort((a, b) =>
            state.sort === 'az' ? a.title.localeCompare(b.title) :
            state.sort === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
        let shown = 0;
        sorted.forEach(c => {
            grid.appendChild(c.el);
            const ok = matches(c);
            const wasHidden = c.el.classList.contains('is-hidden');
            c.el.classList.toggle('is-hidden', !ok);
            if (ok) {
                shown++;
                if (animate && !reduceMotion) { c.el.classList.remove('entering'); void c.el.offsetWidth; c.el.classList.add('entering'); c.el.style.animationDelay = Math.min(shown - 1, 6) * 40 + 'ms'; }
                else if (wasHidden) c.el.classList.remove('entering');
            }
        });
        $('#shownCount').textContent = shown;
        $('#totalCount').textContent = cards.length;
        $('#emptyState').hidden = shown !== 0;

        // active chips
        chips.innerHTML = '';
        let active = 0;
        FACETS.forEach(f => state.sel[f].forEach(v => {
            active++;
            const chip = document.createElement('span');
            chip.className = 'chip';
            chip.innerHTML = `<span><span class="chip-kind">${f[0].toUpperCase() + f.slice(1)}:</span> </span><button type="button" aria-label="Remove filter"><i class="fas fa-xmark"></i></button>`;
            chip.firstChild.append(document.createTextNode(LABELS[f][v] || v));
            $('button', chip).addEventListener('click', () => { state.sel[f].delete(v); const cb = $(`.check input[data-facet="${f}"][value="${v}"]`); if (cb) cb.checked = false; render(); syncURL(); });
            chips.appendChild(chip);
        }));
        if (state.q) {
            active++;
            const chip = document.createElement('span');
            chip.className = 'chip';
            chip.innerHTML = '<span><span class="chip-kind">Search:</span> </span><button type="button" aria-label="Clear search"><i class="fas fa-xmark"></i></button>';
            chip.firstChild.append(document.createTextNode('“' + state.q + '”'));
            $('button', chip).addEventListener('click', () => { state.q = ''; searchInput.value = ''; render(); syncURL(); });
            chips.appendChild(chip);
        }
        clearBtn.disabled = active === 0;
        $('#filterCount').textContent = active ? `(${active})` : '';
    }

    filtersEl.addEventListener('change', e => {
        const input = e.target.closest('.check input');
        if (!input) return;
        const set = state.sel[input.dataset.facet];
        input.checked ? set.add(input.value) : set.delete(input.value);
        render(); syncURL();
    });
    const clearAll = () => {
        FACETS.forEach(f => state.sel[f].clear());
        state.q = ''; if (searchInput) searchInput.value = '';
        $$('.check input', filtersEl).forEach(i => { i.checked = false; });
        render(); syncURL();
    };
    clearBtn.addEventListener('click', clearAll);
    $$('[data-clear-filters]').forEach(b => b.addEventListener('click', clearAll));
    let qTimer;
    if (searchInput) searchInput.addEventListener('input', () => {
        clearTimeout(qTimer);
        qTimer = setTimeout(() => { state.q = searchInput.value.trim(); render(); syncURL(); }, 160);
    });
    if (sortSelect) sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; render(); syncURL(); });

    // Grid / list view
    const setView = v => {
        grid.classList.toggle('list-view', v === 'list');
        $$('.view-toggle button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
        store('view', v);
    };
    $$('.view-toggle button').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
    setView(store('view') || 'grid');

    // Mobile filter drawer
    const setDrawer = open => {
        filtersEl.classList.toggle('open', open);
        fscrim.classList.toggle('show', open);
        document.body.classList.toggle('no-scroll', open);
        if (open) $('summary', filtersEl).focus();
    };
    $('#openFilters').addEventListener('click', () => setDrawer(true));
    $('#closeFilters').addEventListener('click', () => setDrawer(false));
    fscrim.addEventListener('click', () => setDrawer(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && filtersEl.classList.contains('open')) setDrawer(false); });

    render(false);

    // ---------- Quick-view modal ----------
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'qvTitle');
    modal.innerHTML = `<div class="modal-dialog" tabindex="-1">
        <button class="modal-close" type="button" aria-label="Close"><i class="fas fa-xmark"></i></button>
        <div class="modal-hero"><img alt=""></div>
        <div class="modal-body"></div>
        <div class="modal-pager">
            <button type="button" data-step="-1"><i class="fas fa-arrow-left"></i> <span>Previous</span></button>
            <button type="button" data-step="1"><span>Next</span> <i class="fas fa-arrow-right"></i></button>
        </div></div>`;
    document.body.appendChild(modal);
    const mDialog = $('.modal-dialog', modal), mBody = $('.modal-body', modal), mImg = $('.modal-hero img', modal);
    let current = null, lastFocus = null;

    const visibleCards = () => $$('.r-card', grid).filter(el => !el.classList.contains('is-hidden'));

    openQuickView = id => {
        const el = $(`.r-card[data-id="${id}"]`, grid);
        if (!el) return;
        if (!modal.classList.contains('open')) lastFocus = document.activeElement;
        current = el;
        const tpl = $('template.qv', el);
        mBody.innerHTML = '';
        mBody.appendChild(tpl.content.cloneNode(true));
        const h = $('h3', mBody); if (h) h.id = 'qvTitle';
        const first = $('.modal-strip img', mBody) || $('.r-card-media img', el);
        mImg.src = first.getAttribute('src'); mImg.alt = first.alt;
        const list = visibleCards();
        const idx = list.indexOf(el);
        const prev = list[idx - 1], next = list[idx + 1];
        const [pb, nb] = $$('.modal-pager button', modal);
        pb.disabled = !prev; nb.disabled = !next;
        $('span', pb).textContent = prev ? $('.r-card-title', prev).textContent.trim() : 'Previous';
        $('span', nb).textContent = next ? $('.r-card-title', next).textContent.trim() : 'Next';
        modal.classList.add('open');
        document.body.classList.add('no-scroll');
        mDialog.scrollTop = 0;
        mDialog.focus({ preventScroll: true });
    };
    const closeQuickView = () => {
        modal.classList.remove('open');
        document.body.classList.remove('no-scroll');
        if (lastFocus) lastFocus.focus({ preventScroll: true });
    };
    const step = d => {
        const list = visibleCards();
        const next = list[list.indexOf(current) + d];
        if (next) openQuickView(next.dataset.id);
    };

    grid.addEventListener('click', e => {
        const btn = e.target.closest('[data-quickview]');
        if (btn) openQuickView(btn.closest('.r-card').dataset.id);
    });
    modal.addEventListener('click', e => {
        if (e.target === modal || e.target.closest('.modal-close')) return closeQuickView();
        const pager = e.target.closest('.modal-pager button');
        if (pager && !pager.disabled) return step(parseInt(pager.dataset.step, 10));
        const thumb = e.target.closest('.modal-strip button');
        if (thumb) {
            const imgs = $$('.modal-strip img', mBody);
            openLightbox(imgs.map(im => ({ src: im.getAttribute('src'), alt: im.alt, caption: im.alt })), imgs.indexOf($('img', thumb)));
        }
    });
    modal.addEventListener('keydown', e => {
        if (lb) return;
        if (e.key === 'Escape') closeQuickView();
        if (e.key === 'ArrowRight' && !e.target.closest('input, textarea')) step(1);
        if (e.key === 'ArrowLeft' && !e.target.closest('input, textarea')) step(-1);
        if (e.key === 'Tab') {
            const f = $$('a[href], button:not([disabled])', mDialog).filter(x => x.offsetParent !== null);
            if (!f.length) return;
            if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
            else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        }
    });

    // Hero "latest work" stories open the matching quick view
    $$('[data-open-card]').forEach(a => a.addEventListener('click', e => {
        e.preventDefault();
        openQuickView(a.dataset.openCard);
    }));
}

// ============================================================
//  SITE SEARCH ( / or Ctrl/Cmd+K )
// ============================================================
const PAGES = [
    ['Project', 'Pennsylvania Well Setbacks & Lung Health', 'project-pa-well-setbacks.html', 'Prof. Meyer Hackman oil gas asthma logistic geospatial'],
    ['Project', 'US Profit Realization Dashboard, 1964–2024', 'project-marxian-profits.html', 'Prof. Brennan Marx Kalecki Shiny profits'],
    ['Project', 'Unbonded Archive', 'project-unbonded-archive.html', 'bonded labour Nepal Kamaiya Haliya archive open data'],
    ['Project', 'Monetary Policy Transmission in Nepal', 'project-monetary-policy.html', 'SVAR NRB central bank peer-reviewed'],
    ['Project', 'Oil Price Shocks & Foreign Exchange Reserves', 'project-oil-forex.html', 'VAR Granger Lumiere SSRN'],
    ['Project', 'NHS England Wait Time Analysis', 'project-nhs-analysis.html', 'healthcare efficiency paradox London'],
    ['Project', 'Bank Branching Strategy Analysis', 'project-bank-branching.html', 'Federal Reserve deposits spatial'],
    ['Role', 'Political Economy Research Assistant — Prof. Danish Khan', 'experience-political-economy.html', 'debt bondage difference-in-differences'],
    ['Role', 'Institutional Economics Research Assistant — Prof. David Brennan', 'experience-institutional-economics.html', 'Cambridge Journal Shiny'],
    ['Role', 'Monetary Policy Summer Analyst — Nepal Rastra Bank', 'experience-central-bank.html', 'central bank SVAR Kathmandu'],
    ['Role', 'International Economics Researcher — Lumiere Education', 'experience-lumiere.html', 'oil forex VAR'],
    ['Role', 'Research Mentor — Uunchai Summer Program', 'experience-uunchai.html', 'mentoring bottled water high school'],
    ['Page', 'Contact form', 'contact.html', 'email message'],
    ['Page', 'Resume (PDF)', 'shubham_resume.pdf', 'CV']
];
const homeHref = isHome ? '' : 'index.html';
const SECTIONS = [
    ['Section', 'Research & Projects explorer', homeHref + '#research', 'filters topic region'],
    ['Section', 'In the Field — photos & work', homeHref + '#field', 'gallery photos faculty'],
    ['Section', 'Experience', homeHref + '#experience', 'roles timeline'],
    ['Section', 'Publications', homeHref + '#publications', 'papers cite'],
    ['Section', 'About & skills', homeHref + '#about', 'bio skills languages'],
    ['Section', 'Education', homeHref + '#education', 'Franklin Marshall Bath England'],
    ['Section', 'Contact', homeHref + '#contact', 'email phone LinkedIn']
];
function buildIndex() {
    const idx = [...PAGES, ...SECTIONS].map(([kind, title, href, extra]) => ({ kind, title, href, hay: (title + ' ' + extra).toLowerCase() }));
    if (isHome) {
        $$('.pub').forEach((p, i) => {
            if (!p.id) p.id = 'pub-' + (i + 1);
            idx.push({ kind: 'Publication', title: $('h3', p).textContent.trim(), href: '#' + p.id, el: p, hay: p.textContent.toLowerCase() });
        });
        $$('.g-item').forEach((g, i) => {
            if (!g.id) g.id = 'photo-' + (i + 1);
            idx.push({ kind: 'Photo', title: $('figcaption strong', g).textContent.trim(), href: '#' + g.id, el: g, hay: g.textContent.toLowerCase() });
        });
        cards.forEach(c => { const p = idx.find(x => x.kind === 'Project' && c.el.querySelector(`a[href="${x.href}"]`)); if (p) { p.card = c.id; p.hay += ' ' + c.text; } });
    }
    return idx;
}
let searchIndex = null;
const overlay = document.createElement('div');
overlay.className = 'search-overlay';
overlay.innerHTML = `<div class="search-panel" role="dialog" aria-modal="true" aria-label="Search the site">
    <label class="search-field"><i class="fas fa-magnifying-glass" aria-hidden="true"></i><span class="sr-only">Search</span>
        <input type="search" placeholder="Search projects, roles, papers, photos…" autocomplete="off"><kbd>Esc</kbd></label>
    <ul class="search-results" role="listbox"></ul>
    <div class="search-hint"><span><span class="kbd">↑</span> <span class="kbd">↓</span> to move</span><span><span class="kbd">Enter</span> to open</span><span><span class="kbd">/</span> to search anytime</span></div>
</div>`;
document.body.appendChild(overlay);
const sInput = $('input', overlay), sList = $('.search-results', overlay);
let sFocus = 0, sResults = [];

function runSearch() {
    const q = sInput.value.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    sResults = (words.length ? searchIndex.filter(x => words.every(w => x.hay.includes(w))) : searchIndex.filter(x => x.kind === 'Section' || x.kind === 'Project')).slice(0, 12);
    sFocus = 0;
    sList.innerHTML = '';
    if (!sResults.length) { sList.innerHTML = '<li class="sr-empty">No matches. Try a method (SVAR), a place (Nepal) or a name (Brennan).</li>'; return; }
    sResults.forEach((r, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${r.href}" role="option"><span class="sr-kind"></span><span class="sr-title"></span></a>`;
        $('.sr-kind', li).textContent = r.kind;
        $('.sr-title', li).textContent = r.title;
        $('a', li).addEventListener('click', e => goResult(e, i));
        sList.appendChild(li);
    });
    paintFocus();
}
function paintFocus() { $$('a', sList).forEach((a, i) => a.classList.toggle('focused', i === sFocus)); const f = $$('a', sList)[sFocus]; if (f) f.scrollIntoView({ block: 'nearest' }); }
function goResult(e, i) {
    const r = sResults[i];
    if (!r) return;
    if (r.card && isHome) { e.preventDefault(); closeSearch(); openQuickView(r.card); return; }
    if (r.el) {
        e.preventDefault(); closeSearch();
        const pill = r.el.classList.contains('g-item') ? $('#galleryFilters .pill[data-cat="all"]') : r.el.classList.contains('pub') ? $('#pubFilters .pill[data-status="all"]') : null;
        if (pill) pill.click();
        r.el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        r.el.classList.remove('flash'); void r.el.offsetWidth; r.el.classList.add('flash');
        return;
    }
    closeSearch();
}
function openSearch() {
    if (!searchIndex) searchIndex = buildIndex();
    overlay.classList.add('open');
    document.body.classList.add('no-scroll');
    sInput.value = '';
    runSearch();
    setTimeout(() => sInput.focus(), 20);
}
function closeSearch() {
    overlay.classList.remove('open');
    if (!$('.modal.open')) document.body.classList.remove('no-scroll');
}
sInput.addEventListener('input', runSearch);
sInput.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sFocus = Math.min(sFocus + 1, sResults.length - 1); paintFocus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); sFocus = Math.max(sFocus - 1, 0); paintFocus(); }
    if (e.key === 'Enter') { const a = $$('a', sList)[sFocus]; if (a) a.click(); }
});
overlay.addEventListener('click', e => { if (e.target === overlay) closeSearch(); });
$$('[data-search-open]').forEach(b => b.addEventListener('click', openSearch));
document.addEventListener('keydown', e => {
    const typing = e.target.closest && e.target.closest('input, textarea, select, [contenteditable]');
    if (e.key === 'Escape' && overlay.classList.contains('open')) { closeSearch(); return; }
    if (e.key === 'Escape' && nav && nav.classList.contains('open')) { setMenu(false); return; }
    if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        overlay.classList.contains('open') ? closeSearch() : openSearch();
    }
});

})();
