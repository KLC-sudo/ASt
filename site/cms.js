// ── CMS CONTROL DECK CORE LOGIC ─────────────────────────

import './style.css';

const DEFAULTS = {
    branding: {
        logoHoverText: "Insert Logo",
        logoImage: "",
        logoSize: 48
    },
    header: {
        ctaText: "Get Tickets",
        ctaUrl: "https://your-api.example.com/events"
    },
    hero: {
        titleLine1: "QUAESTOR",
        titleLine2: "FAVILLAE",
        subtitle: "Music as a living, breathing art form",
        scrollText: "Scroll"
    },
    mission: {
        eyebrow: "Mission",
        text: "We create intentional spaces where artists break down their albums, track by track&nbsp;— discussing the artistry, themes, production, and the vision behind the work. It's about cultivating thoughtful dialogue and building community."
    },
    vision: {
        eyebrow: "Vision",
        text: "We envision a world where music is not merely consumed but genuinely experienced&nbsp;— where artists are known not just for what they make, but for <span class=\"text-mustard font-normal\">why</span> they make it. Quaestor Favillae is building a cultural movement that centers the creative process, elevates local artistry, and grows audiences who engage with music the way it was always meant to be received: with presence, curiosity, and care. We see a future where every city has a room where the music goes deeper."
    },
    gallery: {
        eyebrow: "Visual Studies",
        title: "FLIPBOOK ARCHIVE",
        cards: [
            {
                title: "Studio Session 01",
                description: "Acoustic resonance mapping and waveforms.",
                indexTag: "STUDY // 001",
                subTitle: "INDEX // 25.1a",
                headline: "ACOUSTIC RESONANCE",
                slides: [
                    { image: "" },
                    { image: "" },
                    { image: "" },
                    { image: "" }
                ]
            },
            {
                title: "Studio Session 02",
                description: "Morphological and spatial audio sectoring studies.",
                indexTag: "STUDY // 002",
                subTitle: "MORPH // LOG",
                headline: "ORGANIC GEOMETRICS",
                slides: [
                    { image: "" },
                    { image: "" },
                    { image: "" },
                    { image: "" }
                ]
            },
            {
                title: "Studio Session 03",
                description: "Temporal beat compression and rhythm synthesis.",
                indexTag: "STUDY // 003",
                subTitle: "IMPULSE // BEAT",
                headline: "TEMPORAL RHYTHMS",
                slides: [
                    { image: "" },
                    { image: "" },
                    { image: "" },
                    { image: "" }
                ]
            }
        ]
    },
    values: {
        eyebrow: "Core Values",
        items: [
            {
                title: "Culture",
                description: "Centering the creative process and the communities that sustain it."
            },
            {
                title: "Authenticity",
                description: "Honoring the truth of the artist's vision without dilution."
            },
            {
                title: "Integrity",
                description: "Upholding intentionality and care in every space we create."
            },
            {
                title: "Curiosity",
                description: "Approaching music with presence, openness, and the desire to go deeper."
            }
        ]
    },
    newsletter: {
        eyebrow: "Every city needs a room",
        title: "WHERE THE MUSIC<br>GOES DEEPER",
        buttonText: "Join",
        successToast: "Thank you — you're part of the movement now."
    },
    ticketing: {
        currencyCode: "UGX",
        currencySymbol: "UGX",
        merchantCode: "XXXX",
        altNumber: "+0000000000",
        supportPhone: "+0000000000",
        whatsappTemplate: "Hello, I have paid for my Quaestor Favillae ticket. Order ref: {ref}. Amount: {amount}.",
        nextEventTitle: "",
        nextEventDate: "",
        nextEventVenue: "",
        nextEventDescription: "",
        nextEventCtaText: "Get Tickets"
    },
    footer: {
        copyright: "© 2026 Quaestor Favillae. All rights reserved."
    }
};

// Global staged state
let stagedConfig = {};
let activeTab = 'branding';
let selectedCardIdx = 0; // selected flipbook card for slideshow vertical timeline editing

// Path helpers
function getVal(obj, path) {
    return path.split('.').reduce((acc, key) => {
        if (acc == null) return undefined;
        return acc[isNaN(key) ? key : Number(key)];
    }, obj);
}

function setVal(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = isNaN(keys[i]) ? keys[i] : Number(keys[i]);
        const nextKey = isNaN(keys[i+1]) ? keys[i+1] : Number(keys[i+1]);
        if (current[key] == null) {
            current[key] = typeof nextKey === 'number' ? [] : {};
        }
        current = current[key];
    }
    const finalKey = isNaN(keys[keys.length - 1]) ? keys[keys.length - 1] : Number(keys[keys.length - 1]);
    current[finalKey] = value;
}

// Deep clone helper
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Deep merge helper (source overrides target)
function merge(target, source) {
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            merge(target[key], source[key]);
        } else if (Array.isArray(source[key])) {
            target[key] = source[key].map((item, idx) => {
                if (item && typeof item === 'object') {
                    return merge(deepClone(target[key]?.[idx] || {}), item);
                }
                return item;
            });
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

// Canvas-based image resizer and compressor to prevent LocalStorage overflows
function compressAndConvertImage(file, maxDimension = 600, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error("Failed to load image file."));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsDataURL(file);
    });
}

// Load initial config from local storage or merge with default structure
function initConfig() {
    const raw = localStorage.getItem('albumStudiesCMSData');
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            stagedConfig = deepClone(DEFAULTS);
            merge(stagedConfig, parsed);
        } catch (e) {
            console.error('[CMS] Failed to parse existing local configuration, resetting to defaults.', e);
            stagedConfig = deepClone(DEFAULTS);
        }
    } else {
        stagedConfig = deepClone(DEFAULTS);
    }
}

// Form layout definition for simple textareas and fields (branding and gallery have custom visual editors)
const TABS_SCHEMA = {
    hero: {
        title: "Hero & Orbit Showcase",
        description: "Modify the large 3D wordmark, typography labels, and indicator actions.",
        groups: [
            {
                name: "Header Call-to-Action",
                fields: [
                    { path: "header.ctaText", label: "Header Button Text (e.g. 'Get Tickets')", type: "text" },
                    { path: "header.ctaUrl", label: "Header Button URL (link to your API/events service)", type: "text" }
                ]
            },
            {
                name: "3D Wordmark Typography",
                fields: [
                    { path: "hero.titleLine1", label: "Hero Title Line 1 (Main Wordmark)", type: "text" },
                    { path: "hero.titleLine2", label: "Hero Title Line 2 (Main Wordmark)", type: "text" }
                ]
            },
            {
                name: "Secondary Typography",
                fields: [
                    { path: "hero.subtitle", label: "Hero Subtitle (Creative Concept tagline)", type: "textarea", rows: 3 },
                    { path: "hero.scrollText", label: "Scroll Down Call-to-action text", type: "text" }
                ]
            }
        ]
    },
    mission: {
        title: "Mission Statement",
        description: "Modify the primary conceptual layout statements introducing the project.",
        groups: [
            {
                name: "Section Overview",
                fields: [
                    { path: "mission.eyebrow", label: "Section Eyebrow Label", type: "text" },
                    { path: "mission.text", label: "Primary Narrative Content (Supports HTML formatting)", type: "textarea", rows: 6 }
                ]
            }
        ]
    },
    vision: {
        title: "Vision Manifesto",
        description: "Customize the overarching vision and cultural movement declarations.",
        groups: [
            {
                name: "Section Overview",
                fields: [
                    { path: "vision.eyebrow", label: "Section Eyebrow Label", type: "text" },
                    { path: "vision.text", label: "Manifesto Core Paragraph (Supports HTML tags like <span> or <br>)", type: "textarea", rows: 8 }
                ]
            }
        ]
    },
    values: {
        title: "Core Philosophies",
        description: "Modify the four core value pillars presented inside the lower grid.",
        groups: [
            {
                name: "Section Overview",
                fields: [
                    { path: "values.eyebrow", label: "Section Eyebrow Label", type: "text" }
                ]
            },
            {
                name: "Value Pillars",
                fields: [
                    { path: "values.items.0.title", label: "Pillar 1: Title", type: "text" },
                    { path: "values.items.0.description", label: "Pillar 1: Narrative", type: "textarea", rows: 2 },
                    { path: "values.items.1.title", label: "Pillar 2: Title", type: "text" },
                    { path: "values.items.1.description", label: "Pillar 2: Narrative", type: "textarea", rows: 2 },
                    { path: "values.items.2.title", label: "Pillar 3: Title", type: "text" },
                    { path: "values.items.2.description", label: "Pillar 3: Narrative", type: "textarea", rows: 2 },
                    { path: "values.items.3.title", label: "Pillar 4: Title", type: "text" },
                    { path: "values.items.3.description", label: "Pillar 4: Narrative", type: "textarea", rows: 2 }
                ]
            }
        ]
    },
    newsletter: {
        title: "Newsletter Call-To-Action",
        description: "Update the subscription headlines, interactive button labels, and system status toasts.",
        groups: [
            {
                name: "Action Callout Section",
                fields: [
                    { path: "newsletter.eyebrow", label: "Newsletter Section Eyebrow", type: "text" },
                    { path: "newsletter.title", label: "Interactive Headline Wordmark (Supports HTML)", type: "textarea", rows: 3 }
                ]
            },
            {
                name: "Forms & Interactions",
                fields: [
                    { path: "newsletter.buttonText", label: "Submission Button Text", type: "text" },
                    { path: "newsletter.successToast", label: "Subscription Success Toast Caption", type: "text" }
                ]
            }
        ]
    },
    ticketing: {
        title: "Ticketing Integration",
        description: "Connect the marketing site to the ticketing API and customize the payment instructions shown to customers.",
        groups: [
            {
                name: "Currency",
                fields: [
                    { path: "ticketing.currencyCode", label: "Currency Code (e.g. UGX, USD, KES)", type: "text" },
                    { path: "ticketing.currencySymbol", label: "Currency Symbol or Prefix (e.g. UGX, $)", type: "text" }
                ]
            },
            {
                name: "Payment Providers",
                fields: [
                    { path: "ticketing.merchantCode", label: "Primary Provider Merchant Code (dial *XXXX#)", type: "text" },
                    { path: "ticketing.altNumber", label: "Alternative Provider Number (e.g. Airtel)", type: "text" }
                ]
            },
            {
                name: "Customer Support",
                fields: [
                    { path: "ticketing.supportPhone", label: "WhatsApp Support Phone (with country code, e.g. +256700000000)", type: "text" },
                    { path: "ticketing.whatsappTemplate", label: "WhatsApp 'I have paid' Message Template. Use {ref} and {amount} as placeholders.", type: "textarea", rows: 3 }
                ]
            },
            {
                name: "Next Event Showcase (optional — appears above the CTA section)",
                fields: [
                    { path: "ticketing.nextEventTitle", label: "Event Title", type: "text" },
                    { path: "ticketing.nextEventDate", label: "Event Date & Time (e.g. Fri 14 Nov · 8:00 PM)", type: "text" },
                    { path: "ticketing.nextEventVenue", label: "Event Venue", type: "text" },
                    { path: "ticketing.nextEventDescription", label: "Event Description (1–2 sentences)", type: "textarea", rows: 2 },
                    { path: "ticketing.nextEventCtaText", label: "CTA Button Text", type: "text" }
                ]
            }
        ]
    }
};

// ── RENDERER: TICKETING TAB ──
function renderTicketingTab() {
    renderGenericTab();
    appendPublishPanel();
}

// Shared publish panel injected at the bottom of the ticketing tab
function appendPublishPanel() {
    const container = document.getElementById('fields-container');
    if (!container) return;
    const existing = document.getElementById('publish-panel');
    if (existing) existing.remove();

    const pubCfg = (() => {
        try { return JSON.parse(localStorage.getItem('quaestorPublishConfig') || 'null') || {}; }
        catch { return {}; }
    })();

    const panel = document.createElement('div');
    panel.id = 'publish-panel';
    panel.className = 'glass-card rounded-xl p-5 mb-6 border border-dashed border-white/10';
    panel.innerHTML = `
        <h3 class="text-xs font-semibold tracking-[0.2em] uppercase text-mustard/80 mb-3 border-b border-white/5 pb-2">
            Publish Globally
        </h3>
        <p class="text-[11px] text-white/45 mb-4 leading-relaxed">
            Changes are staged locally until published. Use the API for instant global sync, or export a JSON file as a fallback.
        </p>

        <div class="mb-5">
            <h4 class="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-2">API Publish</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-semibold tracking-wider text-white/40 uppercase">API Base URL</label>
                    <input type="url" id="publish-api-url" value="${(pubCfg.apiUrl || 'https://a-st-production.up.railway.app').replace(/"/g, '&quot;')}" class="custom-input rounded-lg px-3 py-2.5 text-xs" placeholder="https://api.your-domain.com">
                </div>
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Publish Key</label>
                    <input type="password" id="publish-key" value="${(pubCfg.publishKey || '').replace(/"/g, '&quot;')}" class="custom-input rounded-lg px-3 py-2.5 text-xs" placeholder="CMS_PUBLISH_SECRET value">
                </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
                <button type="button" id="btn-publish" class="px-4 py-2.5 rounded-lg bg-mustard text-graphite text-[10px] font-bold uppercase tracking-wider hover:bg-mustard/80 transition-all flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                    Publish to API
                </button>
                <button type="button" id="btn-fetch-remote" class="px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white/70 text-[10px] font-semibold uppercase tracking-wider hover:bg-white/10 transition-all flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
                    Fetch from API
                </button>
                <span id="publish-status" class="text-[10px] text-white/40"></span>
            </div>
        </div>

        <div class="border-t border-white/5 pt-4">
            <h4 class="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-2">Fallback Export</h4>
            <p class="text-[10px] text-white/30 mb-3">Download cms-config.json and drop it into the static site's public/ folder as a backup when the API is unreachable.</p>
            <button type="button" id="btn-export-json" class="px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white/70 text-[10px] font-semibold uppercase tracking-wider hover:bg-white/10 transition-all flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                Download cms-config.json
            </button>
        </div>
    `;
    container.appendChild(panel);

    document.getElementById('btn-publish').addEventListener('click', async () => {
        const apiUrl = document.getElementById('publish-api-url').value.trim();
        const publishKey = document.getElementById('publish-key').value;
        const status = document.getElementById('publish-status');
        if (!apiUrl || !publishKey) {
            status.textContent = 'Both URL and key required.';
            status.className = 'text-[10px] text-red-400';
            return;
        }
        localStorage.setItem('quaestorPublishConfig', JSON.stringify({ apiUrl, publishKey }));
        status.textContent = 'Publishing…';
        status.className = 'text-[10px] text-white/40';
        try {
            const res = await fetch(apiUrl.replace(/\/$/, '') + '/api/site-config/publish', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-publish-key': publishKey },
                body: JSON.stringify({ config: stagedConfig }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Publish failed');
            status.textContent = `Published ${data.count} fields successfully.`;
            status.className = 'text-[10px] text-green-400';
        } catch (err) {
            status.textContent = err.message;
            status.className = 'text-[10px] text-red-400';
        }
    });

    document.getElementById('btn-fetch-remote').addEventListener('click', async () => {
        const apiUrl = document.getElementById('publish-api-url').value.trim();
        const status = document.getElementById('publish-status');
        if (!apiUrl) { status.textContent = 'API URL required.'; status.className = 'text-[10px] text-red-400'; return; }
        status.textContent = 'Fetching…';
        status.className = 'text-[10px] text-white/40';
        try {
            const res = await fetch(apiUrl.replace(/\/$/, '') + '/api/site-config', { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok || !data.config) throw new Error('No config found');
            for (const key in data.config) {
                const path = key.split('.');
                let cursor = stagedConfig;
                for (let i = 0; i < path.length - 1; i++) {
                    if (cursor[path[i]] == null) cursor[path[i]] = {};
                    cursor = cursor[path[i]];
                }
                cursor[path[path.length - 1]] = data.config[key];
            }
            renderTabFields();
            status.textContent = 'Fetched. Click "Save & Apply" to keep locally.';
            status.className = 'text-[10px] text-green-400';
        } catch (err) {
            status.textContent = err.message || 'API unreachable.';
            status.className = 'text-[10px] text-red-400';
        }
    });

    document.getElementById('btn-export-json').addEventListener('click', () => {
        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ config: stagedConfig }, null, 4));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "cms-config.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showToast("cms-config.json exported! Drop into public/ and redeploy.", "📤");
        } catch (err) {
            showToast("Failed to export.", "⚠️");
        }
    });
}

// Render tab fields (routing between custom rich editors and generic inputs)
function renderTabFields() {
    if (activeTab === 'branding') {
        renderBrandingTab();
    } else if (activeTab === 'gallery') {
        renderGalleryTab();
    } else if (activeTab === 'ticketing') {
        renderTicketingTab();
    } else {
        renderGenericTab();
    }
}

// ── CUSTOM RENDERER: GLOBAL BRANDING & LOGO UPLOAD ──
function renderBrandingTab() {
    const container = document.getElementById('fields-container');
    if (!container) return;

    const logoImgVal = stagedConfig.branding.logoImage || '';
    const logoHoverText = stagedConfig.branding.logoHoverText || '';
    const copyrightText = stagedConfig.footer.copyright || '';

    let logoPreviewHtml = '';
    if (logoImgVal) {
        logoPreviewHtml = `
            <div class="relative w-16 h-16 rounded-full overflow-hidden border border-white/20 bg-white/5 flex items-center justify-center shadow-lg">
                <img src="${logoImgVal}" class="w-full h-full object-cover">
            </div>
            <div>
                <button type="button" id="btn-remove-logo" class="px-3.5 py-1.5 text-[10px] tracking-widest font-semibold uppercase rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all">
                    Remove Custom Logo
                </button>
                <p class="text-[10px] text-white/30 mt-1">Logo image active in local stage. Empty placeholder removed.</p>
            </div>
        `;
    } else {
        // default vector mock turntable layout
        logoPreviewHtml = `
            <div class="w-16 h-16 rounded-full border border-dashed border-white/20 bg-white/5 flex items-center justify-center relative shadow-lg">
                <div class="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center">
                    <div class="w-2.5 h-2.5 rounded-full bg-white/60"></div>
                </div>
            </div>
            <div>
                <span class="text-xs text-white/60 font-medium">Turntable Vector Placeholder</span>
                <p class="text-[10px] text-white/30 mt-1">No custom image uploaded yet. Static placeholder defaults active.</p>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="mb-8 border-b border-white/5 pb-5">
            <h2 class="text-xl font-medium tracking-wide text-offwhite">Global & Branding</h2>
            <p class="text-xs text-white/40 mt-1 leading-relaxed">Customize overarching corporate identity components, footer copyright statements, and logo imagery.</p>
        </div>

        <!-- Dynamic Logo Upload Card -->
        <div class="glass-card rounded-xl p-6 mb-6">
            <h3 class="text-xs font-semibold tracking-[0.2em] uppercase text-mustard/80 mb-5 border-b border-white/5 pb-2">Header Brand Logo</h3>
            <div class="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-white/5 bg-black/10">
                ${logoPreviewHtml}
            </div>

            <div class="mt-5 flex flex-col gap-2">
                <label class="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Upload Brand Logo (Replaces static turntable SVG)</label>
                <div class="flex items-center gap-4">
                    <label class="flex items-center justify-center px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-xs text-white/80 hover:bg-white/10 hover:text-offwhite cursor-pointer transition-all font-medium uppercase tracking-wider gap-2">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
                        </svg>
                        Upload Image
                        <input type="file" id="logo-image-file" class="hidden" accept="image/*">
                    </label>
                </div>
            </div>

            <div class="mt-5 flex flex-col gap-2">
                <label class="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Logo Size (${stagedConfig.branding.logoSize || 48}px)</label>
                <input type="range" id="logo-size-slider" min="24" max="96" step="4" value="${stagedConfig.branding.logoSize || 48}" class="w-full h-1.5 rounded-full appearance-none cursor-pointer" style="background: rgba(255,255,255,0.08);">
            </div>
        </div>

        <!-- Standard Branding Fields -->
        <div class="glass-card rounded-xl p-5 mb-6">
            <h3 class="text-xs font-semibold tracking-[0.2em] uppercase text-mustard/80 mb-5 border-b border-white/5 pb-2">Branding & Layout Parameters</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="flex flex-col gap-2">
                    <label class="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Logo Caption (Text visible on hover)</label>
                    <input type="text" data-path="branding.logoHoverText" value="${logoHoverText.replace(/"/g, '&quot;')}" class="custom-input rounded-xl px-4 py-3.5 text-sm" placeholder="e.g., Insert Logo">
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Footer Copyright Note</label>
                    <input type="text" data-path="footer.copyright" value="${copyrightText.replace(/"/g, '&quot;')}" class="custom-input rounded-xl px-4 py-3.5 text-sm" placeholder="e.g., © 2026 Quaestor Favillae...">
                </div>
            </div>
        </div>
    `;

    // Attach logo image file upload handler
    const logoFileInput = document.getElementById('logo-image-file');
    if (logoFileInput) {
        logoFileInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const dataUrl = await compressAndConvertImage(file, 300, 0.8);
                stagedConfig.branding.logoImage = dataUrl;
                renderBrandingTab();
                showToast("Logo image staged successfully! Save to activate.", "✨");
            } catch (err) {
                console.error('[CMS] Logo compress error:', err);
                showToast("Failed to load uploaded logo image.", "⚠️");
            }
        });
    }

    // Attach logo remove handler
    const btnRemoveLogo = document.getElementById('btn-remove-logo');
    if (btnRemoveLogo) {
        btnRemoveLogo.addEventListener('click', function(e) {
            e.preventDefault();
            stagedConfig.branding.logoImage = '';
            renderBrandingTab();
            showToast("Custom logo image removed. Reverted to turntable placeholder.", "🔄");
        });
    }

    // Attach logo size slider handler
    const logoSizeSlider = document.getElementById('logo-size-slider');
    if (logoSizeSlider) {
        logoSizeSlider.addEventListener('input', function() {
            const val = Number(this.value);
            stagedConfig.branding.logoSize = val;
            const label = this.previousElementSibling;
            if (label) label.textContent = `Logo Size (${val}px)`;
        });
    }

    // Bind other standard input fields
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            setVal(stagedConfig, this.getAttribute('data-path'), this.value);
        });
    });
}

// ── CUSTOM RENDERER: GALLERY CARDS & VERTICAL TIMELINE EDITOR ──
function renderGalleryTab() {
    const container = document.getElementById('fields-container');
    if (!container) return;

    const cards = stagedConfig.gallery.cards || [];
    const currentCard = cards[selectedCardIdx] || { title: '', description: '', indexTag: '', subTitle: '', headline: '', slides: [] };
    const slides = currentCard.slides || [];

    // Construct showcase selector tabs with delete buttons
    let cardButtons = '';
    cards.forEach((card, idx) => {
        const activeClass = idx === selectedCardIdx ? 'bg-mustard/20 text-mustard border-mustard/30' : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white';
        const deleteBtn = cards.length > 1
            ? `<button type="button" class="btn-delete-card ml-1 px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] font-bold transition-all leading-none" data-card-idx="${idx}" title="Delete this card">✕</button>`
            : '';
        cardButtons += `
            <div class="flex items-center gap-0">
                <button type="button" data-card-idx="${idx}" class="card-sel-btn px-4 py-2.5 rounded-l-xl rounded-r-none border text-xs font-semibold uppercase tracking-wider transition-all ${activeClass}">
                    ${card.title || `Session 0${idx + 1}`}
                </button>
                ${deleteBtn}
            </div>
        `;
    });

    let timelineNodes = '';
    if (slides.length === 0) {
        timelineNodes = `
            <div class="text-center py-10 border border-dashed border-white/5 rounded-xl bg-black/10 text-white/30 text-xs">
                No frames added to this slideshow timeline yet. Click "Add Frame" below to start.
            </div>
        `;
    } else {
        slides.forEach((slide, idx) => {
            const hasImg = slide.image ? true : false;
            
            // Image Preview Thumbnail HTML
            const imgPreview = hasImg 
                ? `<div class="relative w-16 h-20 rounded-lg overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center shadow-md">
                       <img src="${slide.image}" class="w-full h-full object-cover">
                       <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer trigger-slide-file" data-slide-idx="${idx}">
                           <span class="text-[8px] font-bold text-white uppercase tracking-widest">Replace</span>
                       </div>
                   </div>`
                : `<div class="w-16 h-20 rounded-lg border border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center gap-1.5 shadow-md cursor-pointer trigger-slide-file hover:border-mustard/40 transition-colors" data-slide-idx="${idx}">
                       <span class="text-lg text-white/20">+</span>
                       <span class="text-[8px] text-white/30 uppercase tracking-widest font-medium">Upload</span>
                   </div>`;

            timelineNodes += `
                <!-- Timeline Node Item -->
                <div class="flex-shrink-0 w-44 group/item">
                    <!-- Slide Editor Card -->
                    <div class="glass-card rounded-xl p-3 flex flex-col gap-3 border border-white/5 hover:border-white/10 transition-colors h-full">
                        
                        <!-- Frame Number & Delete -->
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-bold text-white/50 uppercase tracking-wider">Frame 0${idx + 1}</span>
                            <button type="button" class="btn-delete-slide px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-[10px] font-bold transition-all" data-slide-idx="${idx}" title="Delete Slide">
                                ✕
                            </button>
                        </div>

                        <!-- Thumbnail -->
                        <div class="flex flex-col items-center gap-2">
                            ${imgPreview}
                            <input type="file" class="hidden slide-img-file" data-slide-idx="${idx}" accept="image/*">
                            ${hasImg ? `<button type="button" class="btn-remove-slide-img text-[8px] font-semibold text-red-400 uppercase tracking-widest border border-red-500/10 rounded px-1.5 py-0.5 bg-red-500/5 hover:bg-red-500/15 transition-colors" data-slide-idx="${idx}">Clear</button>` : ''}
                        </div>

                        <!-- Reorder Controls -->
                        <div class="flex items-center justify-center gap-1">
                            <button type="button" class="btn-move-up p-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 hover:text-mustard text-xs transition-colors" data-slide-idx="${idx}" title="Move Left" ${idx === 0 ? 'disabled style="opacity:0.2;cursor:not-allowed;"' : ''}>
                                ←
                            </button>
                            <button type="button" class="btn-move-down p-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 hover:text-mustard text-xs transition-colors" data-slide-idx="${idx}" title="Move Right" ${idx === slides.length - 1 ? 'disabled style="opacity:0.2;cursor:not-allowed;"' : ''}>
                                →
                            </button>
                        </div>

                    </div>
                </div>
            `;
        });
    }

    container.innerHTML = `
        <div class="mb-8 border-b border-white/5 pb-5">
            <h2 class="text-xl font-medium tracking-wide text-offwhite">Flipbook Slideshow Archive</h2>
            <p class="text-xs text-white/40 mt-1 leading-relaxed">Set overarching gallery texts and manage the individual quick flipbook slide items inside each showcase card.</p>
        </div>

        <!-- Section Branding Card -->
        <div class="glass-card rounded-xl p-5 mb-6">
            <h3 class="text-xs font-semibold tracking-[0.2em] uppercase text-mustard/80 mb-5 border-b border-white/5 pb-2">Gallery Overview Header</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="flex flex-col gap-2">
                    <label class="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Section Eyebrow Text</label>
                    <input type="text" data-path="gallery.eyebrow" value="${stagedConfig.gallery.eyebrow.replace(/"/g, '&quot;')}" class="custom-input rounded-xl px-4 py-3.5 text-sm" placeholder="e.g., Visual Studies">
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Gallery Header Title</label>
                    <input type="text" data-path="gallery.title" value="${stagedConfig.gallery.title.replace(/"/g, '&quot;')}" class="custom-input rounded-xl px-4 py-3.5 text-sm" placeholder="e.g., FLIPBOOK ARCHIVE">
                </div>
            </div>
        </div>

        <!-- Card Selectors Grid -->
        <div class="flex flex-wrap items-center gap-3 mb-6">
            ${cardButtons}
            <button type="button" id="btn-add-card" class="px-4 py-2.5 rounded-xl border border-dashed border-white/15 text-xs font-semibold uppercase tracking-wider text-white/40 hover:border-mustard/40 hover:text-mustard hover:bg-mustard/5 transition-all flex items-center gap-1.5">
                + Add Card
            </button>
        </div>

        <!-- Selected Card Metadata Card -->
        <div class="glass-card rounded-xl p-5 mb-6">
            <h3 class="text-xs font-semibold tracking-[0.2em] uppercase text-mustard/80 mb-5 border-b border-white/5 pb-2">Showcase Card Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                <div class="flex flex-col gap-2">
                    <label class="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Card Display Title</label>
                    <input type="text" id="card-title-field" value="${currentCard.title.replace(/"/g, '&quot;')}" class="custom-input rounded-xl px-4 py-3.5 text-sm" placeholder="e.g., Studio Session 01">
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Index Tag (Eyebrow)</label>
                    <input type="text" id="card-indexTag-field" value="${(currentCard.indexTag || '').replace(/"/g, '&quot;')}" class="custom-input rounded-xl px-4 py-3.5 text-sm" placeholder="e.g., STUDY // 001">
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Headline (Title)</label>
                    <input type="text" id="card-headline-field" value="${(currentCard.headline || '').replace(/"/g, '&quot;')}" class="custom-input rounded-xl px-4 py-3.5 text-sm" placeholder="e.g., ACOUSTIC RESONANCE">
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="flex flex-col gap-2">
                    <label class="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Waveform Label (Subtitle)</label>
                    <input type="text" id="card-subTitle-field" value="${(currentCard.subTitle || '').replace(/"/g, '&quot;')}" class="custom-input rounded-xl px-4 py-3.5 text-sm" placeholder="e.g., INDEX // 25.1a">
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Card Display Narrative Summary</label>
                    <textarea id="card-desc-field" class="custom-input rounded-xl px-4 py-3 text-sm resize-y" rows="2" placeholder="e.g., Acoustic resonance mapping...">${currentCard.description}</textarea>
                </div>
            </div>
        </div>

        <!-- Horizontal Scrollable Slideshow Editor -->
        <div class="glass-panel rounded-2xl p-6 border border-white/5 bg-black/10 relative">
            <div class="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h3 class="text-sm font-semibold tracking-wide text-offwhite flex items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full bg-mustard"></span>
                        Slideshow Frame Editor
                    </h3>
                    <p class="text-[11px] text-white/40 mt-0.5">Scroll horizontally to browse frames. Frame scans cycle at 180ms intervals.</p>
                </div>
                <button type="button" id="btn-add-slide" class="py-2 px-4 rounded-xl bg-mustard/15 border border-mustard/20 hover:bg-mustard/30 text-xs font-bold text-mustard transition-all flex items-center gap-1.5 uppercase tracking-wider">
                    + Add Frame
                </button>
            </div>

            <!-- Horizontal Scroll Container -->
            <div class="overflow-x-auto pb-3 -mx-2 px-2">
                <div class="flex gap-3 min-w-max">
                    ${timelineNodes}
                </div>
            </div>
        </div>
    `;

    // ── EVENT BINDINGS FOR GALLERY AND TIMELINE DECK ──

    // 1. Selector Tab buttons
    container.querySelectorAll('.card-sel-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            selectedCardIdx = Number(this.getAttribute('data-card-idx'));
            renderGalleryTab();
        });
    });

    // 1b. Delete Card buttons
    container.querySelectorAll('.btn-delete-card').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const cardIdx = Number(this.getAttribute('data-card-idx'));
            const cardName = stagedConfig.gallery.cards[cardIdx].title || `Session 0${cardIdx + 1}`;
            if (!confirm(`Delete "${cardName}"? This will remove the card and all its slides.`)) return;

            stagedConfig.gallery.cards.splice(cardIdx, 1);
            if (selectedCardIdx >= stagedConfig.gallery.cards.length) {
                selectedCardIdx = stagedConfig.gallery.cards.length - 1;
            }
            renderGalleryTab();
            showToast(`Card deleted successfully.`, "🗑️");
        });
    });

    // 1c. Add Card button
    const btnAddCard = document.getElementById('btn-add-card');
    if (btnAddCard) {
        btnAddCard.addEventListener('click', function(e) {
            e.preventDefault();
            const newIdx = stagedConfig.gallery.cards.length + 1;
            const newCard = {
                title: `Studio Session ${String(newIdx).padStart(2, '0')}`,
                description: "",
                indexTag: `STUDY // ${String(newIdx).padStart(3, '0')}`,
                subTitle: "SIGNAL // NEW",
                headline: `FRAME ${newIdx}`,
                slides: [
                    { image: "" },
                    { image: "" }
                ]
            };
            stagedConfig.gallery.cards.push(newCard);
            selectedCardIdx = stagedConfig.gallery.cards.length - 1;
            renderGalleryTab();
            showToast(`New card added to the gallery!`, "✨");
        });
    }

    // 2. Global Section fields update
    container.querySelectorAll('[data-path]').forEach(input => {
        input.addEventListener('change', function() {
            setVal(stagedConfig, this.getAttribute('data-path'), this.value);
        });
    });

    // 3. Card Information fields update
    const cardTitleField = document.getElementById('card-title-field');
    if (cardTitleField) {
        cardTitleField.addEventListener('change', function() {
            stagedConfig.gallery.cards[selectedCardIdx].title = this.value;
        });
    }
    const cardDescField = document.getElementById('card-desc-field');
    if (cardDescField) {
        cardDescField.addEventListener('change', function() {
            stagedConfig.gallery.cards[selectedCardIdx].description = this.value;
        });
    }
    const cardIndexTagField = document.getElementById('card-indexTag-field');
    if (cardIndexTagField) {
        cardIndexTagField.addEventListener('change', function() {
            stagedConfig.gallery.cards[selectedCardIdx].indexTag = this.value;
        });
    }
    const cardSubTitleField = document.getElementById('card-subTitle-field');
    if (cardSubTitleField) {
        cardSubTitleField.addEventListener('change', function() {
            stagedConfig.gallery.cards[selectedCardIdx].subTitle = this.value;
        });
    }
    const cardHeadlineField = document.getElementById('card-headline-field');
    if (cardHeadlineField) {
        cardHeadlineField.addEventListener('change', function() {
            stagedConfig.gallery.cards[selectedCardIdx].headline = this.value;
        });
    }

    // 4. Trigger slide image input file selection
    container.querySelectorAll('.trigger-slide-file').forEach(el => {
        el.addEventListener('click', function() {
            const slideIdx = this.getAttribute('data-slide-idx');
            const fileInput = container.querySelector(`input.slide-img-file[data-slide-idx="${slideIdx}"]`);
            if (fileInput) fileInput.click();
        });
    });

    // 6. Handle Slide Image uploaded file conversion & stage write
    container.querySelectorAll('.slide-img-file').forEach(input => {
        input.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            const slideIdx = Number(this.getAttribute('data-slide-idx'));
            if (!file) return;

            // Save card fields before re-render
            const titleField = document.getElementById('card-title-field');
            const descField = document.getElementById('card-desc-field');
            const indexTagField = document.getElementById('card-indexTag-field');
            const subTitleField = document.getElementById('card-subTitle-field');
            const headlineField = document.getElementById('card-headline-field');
            if (titleField) stagedConfig.gallery.cards[selectedCardIdx].title = titleField.value;
            if (descField) stagedConfig.gallery.cards[selectedCardIdx].description = descField.value;
            if (indexTagField) stagedConfig.gallery.cards[selectedCardIdx].indexTag = indexTagField.value;
            if (subTitleField) stagedConfig.gallery.cards[selectedCardIdx].subTitle = subTitleField.value;
            if (headlineField) stagedConfig.gallery.cards[selectedCardIdx].headline = headlineField.value;

            try {
                const dataUrl = await compressAndConvertImage(file, 600, 0.75);
                stagedConfig.gallery.cards[selectedCardIdx].slides[slideIdx].image = dataUrl;
                renderGalleryTab();
                showToast(`Frame 0${slideIdx + 1} image updated successfully!`, "🖼️");
            } catch (err) {
                console.error('[CMS] Slide compress error:', err);
                showToast("Failed to process slide frame image.", "⚠️");
            }
        });
    });

    // 7. Clear custom image frame fallback re-enable
    container.querySelectorAll('.btn-remove-slide-img').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const slideIdx = Number(this.getAttribute('data-slide-idx'));
            stagedConfig.gallery.cards[selectedCardIdx].slides[slideIdx].image = '';
            renderGalleryTab();
            showToast(`Frame 0${slideIdx + 1} image removed. Fallback rendering re-enabled.`, "🔄");
        });
    });

    // 8. Delete node frame CRUD
    container.querySelectorAll('.btn-delete-slide').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const slideIdx = Number(this.getAttribute('data-slide-idx'));
            stagedConfig.gallery.cards[selectedCardIdx].slides.splice(slideIdx, 1);
            renderGalleryTab();
            showToast(`Frame 0${slideIdx + 1} deleted successfully!`, "🗑️");
        });
    });

    // 9. Timeline Sorting: Move Up
    container.querySelectorAll('.btn-move-up').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const slideIdx = Number(this.getAttribute('data-slide-idx'));
            if (slideIdx <= 0) return;

            // Swap entries
            const list = stagedConfig.gallery.cards[selectedCardIdx].slides;
            const temp = list[slideIdx];
            list[slideIdx] = list[slideIdx - 1];
            list[slideIdx - 1] = temp;

            renderGalleryTab();
            showToast(`Frame 0${slideIdx + 1} shifted LEFT.`, "←");
        });
    });

    // 10. Timeline Sorting: Move Down
    container.querySelectorAll('.btn-move-down').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const slideIdx = Number(this.getAttribute('data-slide-idx'));
            const list = stagedConfig.gallery.cards[selectedCardIdx].slides;
            if (slideIdx >= list.length - 1) return;

            // Swap entries
            const temp = list[slideIdx];
            list[slideIdx] = list[slideIdx + 1];
            list[slideIdx + 1] = temp;

            renderGalleryTab();
            showToast(`Frame 0${slideIdx + 1} shifted RIGHT.`, "→");
        });
    });

    // 11. Add new slide node CRUD
    const btnAddSlide = document.getElementById('btn-add-slide');
    if (btnAddSlide) {
        btnAddSlide.addEventListener('click', function(e) {
            e.preventDefault();
            const list = stagedConfig.gallery.cards[selectedCardIdx].slides;
            
            // Generate standard indexes default values
            const defaultIndex = `STUDY // 00${selectedCardIdx + 1}`;
            const defaultSub = `SIGNAL // NEW`;
            const defaultTitle = `FRAME AT ${list.length + 1}`;

            list.push({ indexTag: defaultIndex, subTitle: defaultSub, title: defaultTitle, image: "" });
            renderGalleryTab();
            showToast(`New frame successfully added to the timeline!`, "✨");
        });
    }
}

// ── GENERIC RENDERER FOR TEXT/TEXTAREA TABS ──
function renderGenericTab() {
    const container = document.getElementById('fields-container');
    if (!container) return;

    const schema = TABS_SCHEMA[activeTab];
    if (!schema) return;

    let html = `
        <div class="mb-8 border-b border-white/5 pb-5">
            <h2 class="text-xl font-medium tracking-wide text-offwhite">${schema.title}</h2>
            <p class="text-xs text-white/40 mt-1 leading-relaxed">${schema.description}</p>
        </div>
    `;

    schema.groups.forEach((group, groupIdx) => {
        html += `
            <div class="glass-card rounded-xl p-5 mb-6">
                <h3 class="text-xs font-semibold tracking-[0.2em] uppercase text-mustard/80 mb-5 border-b border-white/5 pb-2">${group.name}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        `;

        group.fields.forEach(field => {
            const currentVal = getVal(stagedConfig, field.path) || '';
            const isFullWidth = field.type === 'textarea';
            const colClass = isFullWidth ? 'md:col-span-2' : '';
            const rowsAttr = field.rows ? `rows="${field.rows}"` : 'rows="4"';

            html += `
                <div class="flex flex-col gap-2 ${colClass}">
                    <label class="text-[11px] font-semibold tracking-wider text-white/50 uppercase">${field.label}</label>
            `;

            if (field.type === 'textarea') {
                html += `
                    <textarea 
                        data-path="${field.path}" 
                        class="custom-input rounded-xl px-4 py-3 text-sm resize-y" 
                        placeholder="${field.placeholder || ''}" 
                        ${rowsAttr}
                    >${currentVal}</textarea>
                `;
            } else {
                html += `
                    <input 
                        type="text" 
                        data-path="${field.path}" 
                        value="${currentVal.replace(/"/g, '&quot;')}" 
                        class="custom-input rounded-xl px-4 py-3.5 text-sm" 
                        placeholder="${field.placeholder || ''}"
                    >
                `;
            }

            html += `
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Auto-resizing textareas
    const textareas = container.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight + 2) + 'px';
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight + 2) + 'px';
        });
    });

    // Staged variable update
    const inputs = container.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            setVal(stagedConfig, this.getAttribute('data-path'), this.value);
        });
    });
}

// Global floating toast utility
function showToast(message, icon = '✨') {
    const toast = document.getElementById('cms-toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    if (toastIcon) toastIcon.textContent = icon;

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// Attach event bindings on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initConfig();
    renderTabFields();

    // Tab switcher links
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Switch tabs
            tabButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            activeTab = this.getAttribute('data-tab');
            renderTabFields();
        });
    });

    // Stage Form submit and save state to localstorage
    const form = document.getElementById('cms-editor-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Re-bind all values from form just in case 'change' events missed active keystrokes
            const fields = this.querySelectorAll('[data-path]');
            fields.forEach(f => {
                setVal(stagedConfig, f.getAttribute('data-path'), f.value);
            });

            try {
                localStorage.setItem('albumStudiesCMSData', JSON.stringify(stagedConfig));
                showToast("Configuration saved and live updates applied!", "💾");
            } catch (err) {
                console.error('[CMS] Failed to save state to localStorage:', err);
                showToast("Staging failed. Localstorage limit exceeded.", "⚠️");
            }
        });
    }

    // Reset Defaults Action
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm("Are you sure you want to revert all content to defaults? This will erase all localized CMS staging details.")) {
                localStorage.removeItem('albumStudiesCMSData');
                stagedConfig = deepClone(DEFAULTS);
                renderTabFields();
                showToast("Content reverted to hardcoded defaults successfully.", "🔄");
            }
        });
    }

    // Export Config Action — downloads cms-config.json for global deployment
    const btnExport = document.getElementById('btn-export');
    if (btnExport) {
        btnExport.addEventListener('click', function(e) {
            e.preventDefault();
            
            try {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ config: stagedConfig }, null, 4));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", "cms-config.json");
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
                showToast("cms-config.json exported! Drop into public/ and redeploy.", "📤");
            } catch (err) {
                console.error('[CMS] Export failed:', err);
                showToast("Failed to compile export file.", "⚠️");
            }
        });
    }

    // Trigger Hidden Import Field
    const btnImportTrigger = document.getElementById('btn-import-trigger');
    const fileImport = document.getElementById('file-import');
    if (btnImportTrigger && fileImport) {
        btnImportTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            fileImport.click();
        });

        fileImport.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const parsed = JSON.parse(evt.target.result);
                    
                    // Basic schema validation: check for core layout keys
                    if (!parsed.branding || !parsed.hero || !parsed.mission || !parsed.vision) {
                        throw new Error("Missing essential root keys in schema.");
                    }

                    stagedConfig = parsed;
                    localStorage.setItem('albumStudiesCMSData', JSON.stringify(stagedConfig));
                    renderTabFields();
                    showToast("Configuration JSON imported and activated!", "📥");
                } catch (err) {
                    console.error('[CMS] Import parse error:', err);
                    showToast("Invalid config schema format uploaded.", "⚠️");
                }
            };
            reader.readAsText(file);
            // Reset files so input change can trigger again on same file name
            this.value = '';
        });
    }
});
