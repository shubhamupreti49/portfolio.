# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static personal portfolio website (Shubham Upreti — Economics & Data Science) deployed via GitHub Pages at the custom domain in `CNAME` (shubhamupreti.com.np). Plain HTML/CSS/JS — no build step, no package manager, no framework, no bundler.

## Development workflow

There is no build/lint/test tooling. To preview changes, just open the HTML files directly in a browser or serve the directory statically, e.g.:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/index.html`. Changes to `.html`/`.css`/`.js` are live on refresh — no compilation step. Deployment is automatic via GitHub Pages on push to `main`.

## Architecture

- **`index.html`** — the single-page main site. All primary sections (Home, About, Skills, Experience, Projects, Publications, Education, Contact) live here as `<section id="...">` anchors linked from the nav bar. Experience and Project cards on this page are short summaries that link out to standalone detail pages.
- **`experience-*.html`** — one standalone detail page per job/experience entry (e.g. `experience-central-bank.html`, `experience-lumiere.html`, `experience-unicef.html`), expanding on the corresponding summary card in `index.html#experience`.
- **`project-*.html`** — one standalone detail page per project (e.g. `project-bank-branching.html`, `project-nhs-analysis.html`, `project-monetary-policy.html`, `project-oil-forex.html`), expanding on the corresponding card in `index.html#projects`. These pages render math via MathJax (loaded per-page, not globally) for econometric formulas, and embed figures from `images/<project-name>/`.
- **`contact.html`** — standalone contact form page (posts to Formspree), separate from the in-page `#contact` section on `index.html`.
- **`styles.css`** — single global stylesheet shared by every page (~1800 lines). Defines CSS custom properties under `:root` (`--primary-color`, `--accent-color`, `--dark-bg`, `--gradient`, etc.) used throughout. Reuses shared component classes across pages: `.detail-page` / `.detail-header` / `.detail-meta` (experience & project detail pages), `.project-card`, `.experience-item`, `.btn` / `.btn-primary` / `.btn-link`, `.fade-in` (scroll reveal), `.lightbox` (image zoom).
- **`script.js`** — shared, vanilla JS, loaded by every page. Handles: mobile hamburger menu toggle, scroll progress bar, `IntersectionObserver`-based fade-in reveals for `.fade-in` sections, smooth-scroll for in-page anchor links, active-nav-link highlighting on scroll, and image lightbox (click-to-zoom) for `.project-image` elements.

## Conventions when adding content

- **New experience/project entry**: add a summary card to the relevant section in `index.html`, then create a new `experience-*.html` or `project-*.html` file following the structure of an existing one (same `<nav>`, `.detail-page` / `.detail-header` / `.detail-meta` wrapper, "Back to Portfolio" link, footer, and `<script src="script.js">` include). Link the two together (card → detail page, detail page's back-button → `index.html#section`).
- **Project images** live under `images/<project-slug>/`, referenced with `class="project-image"` so the lightbox JS and lazy-loading in `script.js` pick them up automatically; pair each with a `.image-caption` element to populate the lightbox caption.
- **Math-heavy project pages** include the MathJax `<script>` config block in `<head>` (see `project-bank-branching.html`) and use `\( ... \)` / `\[ ... \]` delimiters inline.
- Font Awesome is loaded via CDN per-page (`cdnjs.cloudflare.com/.../font-awesome`) — include it in `<head>` on any new page that uses `<i class="fas fa-...">` icons.
- Keep the nav `<ul>` link list consistent across all top-level pages (`index.html`, `contact.html`, and detail pages) when adding/removing a section.
