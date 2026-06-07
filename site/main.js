import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    // ── CMS HYDRATION ENGINE ─────────────────────────────
    // Reads saved config from localStorage and overwrites matching data-cms elements
    (function hydrateCMSData() {
        const raw = localStorage.getItem('albumStudiesCMSData');
        if (!raw) return;
        try {
            const data = JSON.parse(raw);
            const getVal = (obj, path) =>
                path.split('.').reduce((acc, key) => {
                    if (acc == null) return undefined;
                    // Support array-index notation like "items.0.title"
                    return acc[isNaN(key) ? key : Number(key)];
                }, obj);

            document.querySelectorAll('[data-cms]').forEach(el => {
                const val = getVal(data, el.getAttribute('data-cms'));
                if (val !== undefined && val !== null && val !== '') {
                    el.innerHTML = val;
                }
            });

            document.querySelectorAll('[data-cms-href]').forEach(el => {
                const val = getVal(data, el.getAttribute('data-cms-href'));
                if (val !== undefined && val !== null && val !== '') {
                    el.setAttribute('href', val);
                }
            });

            // ── LOGO HEADER IMAGE HYDRATION ──
            if (data.branding && data.branding.logoImage) {
                const placeholder = document.querySelector('[data-cms-logo-placeholder]');
                const wrapper = document.querySelector('[data-cms-logo-img-wrapper]');
                const img = document.querySelector('[data-cms-logo-img]');
                const container = document.querySelector('[data-cms-logo-container]');
                if (placeholder && wrapper && img) {
                    placeholder.classList.add('hidden');
                    wrapper.classList.remove('hidden');
                    img.src = data.branding.logoImage;
                }
                if (container && data.branding.logoSize) {
                    container.style.width = data.branding.logoSize + 'px';
                    container.style.height = data.branding.logoSize + 'px';
                }
            }

            // ── FLIPBOOK SLIDE & CARD REBUILDER ──
            if (data.gallery && data.gallery.cards) {
                const cardsContainer = document.getElementById('gallery-cards-container');
                if (cardsContainer) {
                    // Clear all existing cards
                    cardsContainer.innerHTML = '';
                    
                    data.gallery.cards.forEach((cardData, idx) => {
                        const cardEl = document.createElement('div');
                        cardEl.className = `gallery-card group cursor-default reveal`;
                        cardEl.setAttribute('data-study', idx + 1);
                        cardEl.style.transitionDelay = `${idx * 0.1}s`;
                        
                        cardEl.innerHTML = `
                            <div class="gallery-image-container aspect-[4/5] bg-graphite/5 rounded-2xl overflow-hidden relative shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-graphite/[0.06] transition-all duration-500 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] group-hover:scale-[1.01]">
                                <!-- Slides will be inserted dynamically -->
                            </div>
                        `;
                        
                        const slidesContainer = cardEl.querySelector('.gallery-image-container');
                        const customSlides = cardData.slides;
                        
                        if (customSlides && Array.isArray(customSlides) && customSlides.length > 0) {
                            customSlides.forEach((slide, sIdx) => {
                                const activeClass = sIdx === 0 ? 'active' : 'opacity-0';
                                const slideEl = document.createElement('div');
                                slideEl.className = `slide ${activeClass} absolute inset-0 transition-opacity duration-200`;
                                
                                // Use card-level labels
                                const cardIndexTag = cardData.indexTag || `STUDY // 00${idx + 1}`;
                                const cardSubTitle = cardData.subTitle || '';
                                const cardHeadline = cardData.headline || '';
                                
                                if (slide.image) {
                                    // Dynamic Image Frame slide (mirrors fallback layout: index tag at top, subtitle + divider + headline at bottom)
                                    slideEl.innerHTML = `
                                        <div class="w-full h-full relative text-offwhite bg-graphite flex flex-col justify-between p-8">
                                            <img src="${slide.image}" class="absolute inset-0 w-full h-full object-cover opacity-60 z-0">
                                            <div class="relative z-10 flex flex-col justify-between h-full w-full pointer-events-none">
                                                <span class="text-[10px] tracking-[0.3rem] uppercase text-white/80 font-mono font-bold">${cardIndexTag}</span>
                                                <div class="text-left">
                                                    <span class="text-[10px] tracking-widest font-mono text-white/40">${cardSubTitle}</span>
                                                    <div class="h-px bg-white opacity-10 my-2"></div>
                                                    <div class="text-xs tracking-wider uppercase font-medium">${cardHeadline}</div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                } else {
                                    // fallback text frame slide
                                    const themes = [
                                        { bg: 'bg-gradient-to-br from-[#EAE4D9] to-[#D8D2C4]', text: 'text-graphite', border: 'border-graphite/10', circleBorder: 'border-graphite/20', sub: 'text-graphite/40' },
                                        { bg: 'bg-graphite', text: 'text-offwhite', border: 'border-offwhite/10', circleBorder: 'border-offwhite/20', sub: 'text-offwhite/40' },
                                        { bg: 'bg-gradient-to-br from-[#5247A0] to-[#3A3275]', text: 'text-offwhite', border: 'border-offwhite/10', circleBorder: 'border-offwhite/20', sub: 'text-offwhite/40' },
                                        { bg: 'bg-gradient-to-br from-[#C8A03E] to-[#A07D2C]', text: 'text-graphite', border: 'border-graphite/20', circleBorder: 'border-graphite/30', sub: 'text-graphite/60' }
                                    ];
                                    const theme = themes[sIdx % themes.length];
                                    slideEl.innerHTML = `
                                        <div class="w-full h-full flex flex-col justify-between p-8 ${theme.bg} ${theme.text}">
                                            <span class="text-[10px] tracking-[0.3rem] uppercase font-mono ${theme.sub}">${cardIndexTag}</span>
                                            <div class="w-20 h-20 rounded-full border ${theme.circleBorder} mx-auto flex items-center justify-center relative">
                                                <div class="w-10 h-10 rounded-full border ${theme.circleBorder} flex items-center justify-center">
                                                    <div class="w-2 h-2 rounded-full bg-current opacity-60"></div>
                                                </div>
                                            </div>
                                            <div class="text-left">
                                                <span class="text-[10px] tracking-widest font-mono ${theme.sub}">${cardSubTitle}</span>
                                                <div class="h-px bg-current opacity-10 my-2"></div>
                                                <div class="text-xs tracking-wider uppercase font-medium">${cardHeadline}</div>
                                            </div>
                                        </div>
                                    `;
                                }
                                slidesContainer.appendChild(slideEl);
                            });
                        }
                        
                        cardsContainer.appendChild(cardEl);
                    });
                }
            }
        } catch (e) {
            console.warn('[CMS] Hydration parse error:', e);
        }
    })();

    // Scroll reveal intersections observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal, .line-reveal').forEach(el => observer.observe(el));

    // Reveal elements in the first section immediately
    setTimeout(() => {
        document.querySelectorAll('section:first-of-type .reveal, section:first-of-type .line-reveal')
            .forEach(el => el.classList.add('visible'));
    }, 250);

    // Signup form submit handler
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const toast = document.getElementById('toast');
            const emailInput = this.querySelector('input[type="email"]');
            
            if (emailInput) {
                emailInput.value = '';
            }
            
            if (toast) {
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3500);
            }
        });
    }

    // Slideshow control for Flipbook Archive gallery cards
    const galleryCards = document.querySelectorAll('.gallery-card');
    
    galleryCards.forEach(card => {
        const slides = card.querySelectorAll('.slide');
        if (slides.length <= 1) return;
        
        let intervalId = null;
        let currentIndex = 0;
        const SLIDE_DURATION = 180; // Fast slideshow (180ms per frame)
        
        function showSlide(index) {
            slides.forEach((slide, idx) => {
                if (idx === index) {
                    slide.classList.add('active');
                    slide.classList.remove('opacity-0');
                } else {
                    slide.classList.remove('active');
                    slide.classList.add('opacity-0');
                }
            });
            currentIndex = index;
        }
        
        function startSlideshow() {
            if (intervalId) return; // Already running
            
            intervalId = setInterval(() => {
                const nextIndex = (currentIndex + 1) % slides.length;
                showSlide(nextIndex);
            }, SLIDE_DURATION);
        }
        
        function stopAndResetSlideshow() {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            
            // Temporarily disable transition during reset for instantaneous revert
            slides.forEach(slide => {
                slide.style.transition = 'none';
            });
            
            // Revert to first slide
            showSlide(0);
            
            // Force repaint to apply "none" style before resetting transition
            void card.offsetHeight;
            
            // Restore transition after repaint
            setTimeout(() => {
                slides.forEach(slide => {
                    slide.style.transition = '';
                });
            }, 50);
        }
        
        // PC / Desktop hover interactions
        card.addEventListener('mouseenter', () => {
            // Only activate via hover if it is a desktop screen
            if (window.innerWidth >= 768) {
                startSlideshow();
            }
        });
        
        card.addEventListener('mouseleave', () => {
            if (window.innerWidth >= 768) {
                stopAndResetSlideshow();
            }
        });
        
        // Mobile scroll interactions using IntersectionObserver
        const mobileObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Only activate via scroll if it is mobile/tablet screen size
                if (window.innerWidth < 768) {
                    if (entry.isIntersecting) {
                        startSlideshow();
                    } else {
                        stopAndResetSlideshow();
                    }
                }
            });
        }, {
            threshold: 0.5, // Trigger when 50% of the card is visible
            rootMargin: '-10% 0px -10% 0px' // Tighter margin so it triggers when more centered
        });
        
        mobileObserver.observe(card);
        
        // Clean up or handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                stopAndResetSlideshow();
            } else {
                stopAndResetSlideshow();
            }
        });
    });
});
