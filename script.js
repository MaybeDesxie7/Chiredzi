// --------------------- NAV TOGGLE & SCROLL HEADER ---------------------
const navToggle = document.getElementById('nav-toggle');
const navList = document.getElementById('nav-list');
const header = document.getElementById('site-header');

if (navToggle && navList) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navList.classList.toggle('show');
    navToggle.classList.toggle('open');
  });
}

// Close mobile nav on link click & smooth scroll
document.querySelectorAll('#nav-list a[href^="#"]').forEach(a => {
  a.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href.length > 1 && document.querySelector(href)) {
      e.preventDefault();
      document.querySelector(href).scrollIntoView({ behavior: 'smooth', block: 'start' });
      navList.classList.remove('show');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
});

// header color toggle on scroll
window.addEventListener('scroll', () => {
  if (window.scrollY > 80) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
});


// --------------------- HERO SLIDESHOW (fade dissolve) ---------------------
(function heroSlideshow() {
  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  if (!slides.length) return;

  let idx = 0;
  const interval = 5000; // 5s per slide
  slides.forEach(s => s.classList.remove('active'));
  slides[0].classList.add('active');

  setInterval(() => {
    slides[idx].classList.remove('active');
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add('active');
  }, interval);
})();


// --------------------- INTERSECTION OBSERVER FOR REVEALS ---------------------
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

document.querySelectorAll('.fade-in').forEach(el => io.observe(el));
document.querySelectorAll('.fade-up').forEach(el => io.observe(el));


// --------------------- STUDENT LIFE: click-to-play video blocks (play/pause + double-click rewind) ---------------------
document.querySelectorAll('.life-media').forEach(media => {
  // poster image present in markup
  let videoEl = null;
  let isPlaying = false;

  function createVideo() {
    if (videoEl) return videoEl;
    const src = media.dataset.video;
    if (!src) return null;
    videoEl = document.createElement('video');
    videoEl.src = src;
    videoEl.controls = true;
    videoEl.loop = false;
    videoEl.muted = false;
    videoEl.playsInline = true;
    videoEl.style.width = '100%';
    videoEl.style.height = '100%';
    videoEl.style.objectFit = 'cover';
    return videoEl;
  }

  function togglePlay() {
    if (!videoEl) videoEl = createVideo();
    if (!videoEl) return;
    if (videoEl.paused) {
      videoEl.play().catch(()=>{});
      isPlaying = true;
    } else {
      videoEl.pause();
      isPlaying = false;
    }
  }

  function loadAndPlayOnce() {
    // replace poster with video element and play
    if (!videoEl) videoEl = createVideo();
    if (!videoEl) return;
    media.innerHTML = '';
    media.appendChild(videoEl);
    videoEl.currentTime = 0;
    videoEl.play().catch(()=>{});
    isPlaying = true;

    // allow toggle by clicking on the media container
    media.addEventListener('click', () => {
      if (!videoEl) return;
      if (videoEl.paused) videoEl.play().catch(()=>{});
      else videoEl.pause();
    });
  }

  // double-click rewinds (simple 'reverse' UX)
  media.addEventListener('dblclick', () => {
    if (!videoEl) videoEl = createVideo();
    if (!videoEl) return;
    videoEl.currentTime = 0;
    if (videoEl.paused) videoEl.play().catch(()=>{});
  });

  // click/keyboard to create+play (first interaction)
  media.addEventListener('click', (e) => {
    const hasVideo = !!media.querySelector('video');
    if (!hasVideo) {
      // create and play
      loadAndPlayOnce();
    }
  });

  media.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const hasVideo = !!media.querySelector('video');
      if (!hasVideo) loadAndPlayOnce();
      else togglePlay();
    }
  });
});


// --------------------- GALLERY LIGHTBOX ---------------------
const galleryThumbs = document.querySelectorAll('.gallery-thumb');
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lightbox-img');
const lbClose = document.querySelector('.lb-close');

galleryThumbs.forEach(thumb => {
  thumb.addEventListener('click', () => {
    const full = thumb.dataset.full || thumb.src;
    lbImg.src = full;
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
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


// --------------------- Accessibility: prefer-reduced-motion support ---------------------
const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
if (mediaQuery.matches) {
  // stop slide changes by removing active toggling (optional tweak)
  // We won't change code here; user can tweak if needed.
}
