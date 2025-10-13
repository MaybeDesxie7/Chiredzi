/* =========================================================
   script.js — Interaction and accessibility behaviors
   - nav toggle
   - slide-down header
   - hero slideshow
   - intersection observer reveals
   - video click-to-play with keyboard access
   - gallery lightbox
   ========================================================= */

/* ----------------------------------------------------------------
   Helper utilities
   ---------------------------------------------------------------- */
function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); }
function on(el, evt, fn, opts) { if (!el) return; el.addEventListener(evt, fn, opts); }

/* ----------------------------------------------------------------
   DOM references
   ---------------------------------------------------------------- */
const header = qs('#site-header');
const navToggle = qs('#nav-toggle');
const navList = qs('#nav-list');
const heroSlides = qsa('.hero-slide');
const galleryThumbs = qsa('.gallery-thumb');
const lightbox = qs('#lightbox');
const lbImg = qs('#lightbox-img');
const lbClose = qs('.lb-close');

/* ----------------------------------------------------------------
   NAV TOGGLE (mobile)
   - shows/hides mobile nav and updates aria attributes
   - allows closing by Escape
   ---------------------------------------------------------------- */
if (navToggle && navList) {
  navToggle.addEventListener('click', () => {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isExpanded));
    navList.classList.toggle('show');
    navList.setAttribute('aria-hidden', String(isExpanded));
    navToggle.classList.toggle('open');

    // move focus into nav for keyboard users when opening
    if (!isExpanded) {
      // focus first link
      const first = navList.querySelector('a');
      if (first) first.focus();
    }
  });

  // Close nav on Escape
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && navList.classList.contains('show')) {
      navList.classList.remove('show');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navList.setAttribute('aria-hidden', 'true');
      navToggle.focus();
    }
  });

  // Close mobile nav when a menu link is clicked (smooth scroll handled separately)
  qsa('#nav-list a').forEach(a => {
    a.addEventListener('click', () => {
      if (navList.classList.contains('show')) {
        navList.classList.remove('show');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navList.setAttribute('aria-hidden', 'true');
      }
    });
  });
}

/* ----------------------------------------------------------------
   SLIDE-DOWN HEADER
   - header starts off-screen (translateY(-100%))
   - on initial page load, we show it if user has scrolled or after small delay
   - on scroll we add/remove .scrolled for background change and toggle visibility
   ---------------------------------------------------------------- */
let lastScrollY = window.scrollY || 0;
let headerVisible = false;
const SHOW_AT = 60; // px

function updateHeaderOnScroll() {
  const currentY = window.scrollY || 0;

  // Add scrolled class when we pass threshold
  if (currentY > SHOW_AT) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }

  // Reveal header when user scrolls down (and hide when at very top)
  if (currentY > 10 && !headerVisible) {
    header.classList.add('visible');
    headerVisible = true;
  } else if (currentY <= 10 && headerVisible) {
    // hide when at top to give hero full-screen view
    header.classList.remove('visible');
    headerVisible = false;
  }

  lastScrollY = currentY;
}

on(window, 'scroll', updateHeaderOnScroll);
on(window, 'load', () => {
  // show header if user loaded the page already scrolled down
  if ((window.scrollY || 0) > 10) {
    header.classList.add('visible');
    headerVisible = true;
  } else {
    // small timeout to slide-in header for first-time viewers
    setTimeout(() => {
      header.classList.add('visible');
      headerVisible = true;
    }, 550);
  }
  updateHeaderOnScroll();
});

/* ----------------------------------------------------------------
   SMOOTH SCROLL FOR IN-PAGE LINKS
   - intercept anchor clicks for same-page sections
   ---------------------------------------------------------------- */
qsa('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function (ev) {
    const href = this.getAttribute('href');
    if (!href || href === '#' || href === '#!' ) return;
    const target = document.querySelector(href);
    if (!target) return;
    ev.preventDefault();

    // smooth scroll then update focus for accessibility
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.setAttribute('tabindex', '-1'); // allow focus if not normally focusable
    setTimeout(() => {
      target.focus({ preventScroll: true });
      target.removeAttribute('tabindex');
    }, 700);
  });
});

/* ----------------------------------------------------------------
   HERO SLIDESHOW (fade dissolve)
   - respects prefers-reduced-motion
   ---------------------------------------------------------------- */
(function heroSlideshow() {
  if (!heroSlides || heroSlides.length === 0) return;
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mediaQuery.matches) {
    // keep first slide only
    heroSlides.forEach((s, i) => { s.classList.toggle('active', i === 0); });
    return;
  }

  let idx = 0;
  const interval = 4800;

  // ensure first visible
  heroSlides.forEach(s => s.classList.remove('active'));
  heroSlides[0].classList.add('active');

  setInterval(() => {
    heroSlides[idx].classList.remove('active');
    idx = (idx + 1) % heroSlides.length;
    heroSlides[idx].classList.add('active');
  }, interval);
})();

/* ----------------------------------------------------------------
   INTERSECTION OBSERVER: reveal animations for .fade-in and .fade-up
   ---------------------------------------------------------------- */
(function revealOnScroll() {
  const ioOptions = { threshold: 0.12, rootMargin: '0px 0px -60px 0px' };
  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.classList.contains('fade-in')) el.classList.add('visible');
      if (el.classList.contains('fade-up')) {
        const delay = parseFloat(getComputedStyle(el).getPropertyValue('--delay')) || 0;
        setTimeout(() => el.classList.add('in-view'), delay * 1000);
      }
      observer.unobserve(el);
    });
  }, ioOptions);

  qsa('.fade-in').forEach(el => io.observe(el));
  qsa('.fade-up').forEach(el => io.observe(el));
})();

/* ----------------------------------------------------------------
   VIDEO PLAYBACK: click-to-create video element (for Student Life)
   - posters are present as img tags
   - keyboard accessible (Enter / Space)
   - double-click rewinds
   ---------------------------------------------------------------- */
(function videosInteraction() {
  const medias = qsa('.life-media');
  medias.forEach(media => {
    let videoEl = null;
    let created = false;

    function createVideo() {
      if (created) return videoEl;
      const src = media.dataset.video;
      if (!src) return null;
      videoEl = document.createElement('video');
      videoEl.src = src;
      videoEl.controls = true;
      videoEl.playsInline = true;
      videoEl.muted = false;
      videoEl.style.width = '100%';
      videoEl.style.height = '100%';
      videoEl.style.objectFit = 'cover';
      created = true;
      return videoEl;
    }

    function loadAndPlay() {
      if (!created) createVideo();
      if (!videoEl) return;
      // remove children (poster image + overlay)
      media.innerHTML = '';
      media.appendChild(videoEl);
      videoEl.currentTime = 0;
      videoEl.play().catch(()=>{});
      videoEl.focus();
    }

    // first click creates video and plays
    media.addEventListener('click', (e) => {
      const hasVideo = !!media.querySelector('video');
      if (!hasVideo) loadAndPlay();
      else {
        if (videoEl.paused) videoEl.play().catch(()=>{});
        else videoEl.pause();
      }
    });

    // keyboard controls
    media.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const hasVideo = !!media.querySelector('video');
        if (!hasVideo) loadAndPlay();
        else {
          if (videoEl.paused) videoEl.play().catch(()=>{});
          else videoEl.pause();
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        if (videoEl) videoEl.currentTime = 0;
      }
    });

    // double click rewinds and plays
    media.addEventListener('dblclick', () => {
      if (!created) createVideo();
      if (!videoEl) return;
      videoEl.currentTime = 0;
      videoEl.play().catch(()=>{});
    });

    // ensure role/button has keyboard focus
    media.setAttribute('tabindex', '0');
    media.setAttribute('role', 'button');
  });
})();

/* ----------------------------------------------------------------
   GALLERY LIGHTBOX - accessible
   ---------------------------------------------------------------- */
(function galleryLightbox() {
  if (!lightbox || !lbImg) return;

  galleryThumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const full = thumb.dataset.full || thumb.src;
      lbImg.src = full;
      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    });

    // allow keyboard open (Enter)
    thumb.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        thumb.click();
      }
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    lbImg.src = '';
    document.body.style.overflow = '';
  }

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox(); });
})();

/* ----------------------------------------------------------------
   Small helpers & diagnostics (runs on load)
   - check that expected assets exist (non-blocking)
   ---------------------------------------------------------------- */
on(window, 'load', () => {
  // sanity checks (non-blocking)
  try {
    // ensure header exists
    if (!header) console.warn('Header element not found (expected #site-header).');
    if (!navToggle) console.warn('Nav toggle not found (#nav-toggle).');
    if (!navList) console.warn('Nav list not found (#nav-list).');
  } catch (err) {
    console.error('Startup checks failed', err);
  }

  // make sure header initially visible for users who load scrolled down
  if ((window.scrollY || 0) > 10) {
    header.classList.add('visible');
  }

  // mark images with no src
  qsa('img').forEach(img => {
    if (!img.getAttribute('src') || img.getAttribute('src').trim() === '') {
      img.classList.add('missing-src');
    }
  });
});

/* End of script.js */
