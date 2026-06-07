# Codebase Analysis: Quaestor Favillae

## Overview
Static marketing site + browser-based CMS for "Quaestor Favillae" (a music/culture community concept). Vanilla JS + Vite + Tailwind.

## Structure
- `index.html:1` — Public site (6 sections: hero w/ 3D orbit, mission, vision, gallery, values, CTA, footer)
- `cms.html:1` — Admin panel at `/cms.html`
- `main.js:1` — CMS hydration, scroll reveal, signup form, gallery slideshow
- `cms.js:1` — Full CMS engine: schema, renderers, image compression, import/export
- `style.css:1` — Custom font, 3D orbit, reveal/line-reveal animations, flipbook styles
- `vite.config.js:1` — Multi-page build (index + cms)

## Architecture
- **No backend.** All CMS data persists via `localStorage['albumStudiesCMSData']` (`cms.js:175`, `main.js:7`).
- **Data model** (`cms.js:3`): `branding`, `hero`, `mission`, `vision`, `gallery.cards[]`, `values.items[]`, `newsletter`, `footer`. Gallery cards each have `slides[]` with optional `image` (base64).
- **Hydration** (`main.js:18`): elements with `data-cms="path.to.field"` get `innerHTML` overwritten from saved config.
- **Image pipeline** (`cms.js:134`): Canvas-based compression (300px logo, 600px slides @ 0.75 quality JPEG) to dodge localStorage limits.

## Notable Issues

### Security
- `main.js:21` sets `innerHTML` from localStorage without sanitization. XSS risk if CMS data is ever shared/imported. Vision/newsletter text fields intentionally allow HTML (`<span>`, `<br>`), so sanitization would break them.
- `cms.js:1029` import validator only checks for root keys — accepts any nested garbage.

### Build / Config
- `postcss.config.js:1` only has `autoprefixer`; `@tailwindcss/postcss` is in `package.json:13` but unused. Both HTML files use Tailwind via CDN script, so the build never tree-shakes Tailwind classes.
- `main.js:1` imports `./style.css` for build, but HTMLs also link Tailwind CDN — the CDN classes are the source of truth at runtime.

### UX / Bugs
- `cms.js:908` uses `change` event on inputs — values only stage on blur. Typing then switching tabs without blurring loses keystrokes. `input` would be safer.
- `main.js:133` `setTimeout(250)` then `classList.add('visible')` on first section — fine, but reveals inside an already-scrolled second section may never fire if observer `rootMargin` doesn't catch them.
- `main.js:169` — 180ms slide interval is aggressive; not pausable for `prefers-reduced-motion`.
- `style.css:103` — `orbit-revolve` runs infinitely; no reduced-motion media query anywhere.
- Gallery mobile observer (`main.js:233`) only checks `window.innerWidth < 768` at event time — resizing mid-session leaves state stale.
- `cms.js:636` uses `confirm()` for destructive ops — works but unstyled.

### Code Quality
- `cms.js` is a 1047-line monolith. Schema, renderers, IO all mixed. Would benefit from splitting.
- `main.js:259` — `resize` handler calls `stopAndResetSlideshow` in both branches identically; dead conditional.
- Path helpers `getVal`/`setVal` are duplicated across `main.js:11` and `cms.js:106`.
- `style.css:289` redefines `@keyframes pulse` that Tailwind CDN also defines (last-loaded wins).

### Functionality Gaps
- Email signup (`main.js:144`) is cosmetic — no backend, no validation beyond `required`.
- Logo upload only stores base64; no fallback if compression fails for non-image MIME.
- Export (`cms.js:994`) doesn't include the version/DEFAULTS fingerprint — re-imports can't warn about schema drift.

## Tech Notes
- Tailwind v4 in deps but loaded via CDN at runtime.
- Custom font `Aicon` (otf/ttf/otf-bold) loaded via `@font-face` in `style.css:2`.
- 3D orbit uses pure CSS `transform-style: preserve-3d` with 4 counter-rotating keyframe sets — no WebGL.
- Slideshow uses `IntersectionObserver` for mobile, `mouseenter/mouseleave` for desktop.
