/* =========================================================
   script.js — interactions & animations for
   Chiredzi Government High School
   =========================================================
   Features:
   - Mobile nav toggle (vertical)
   - Hamburger animation
   - Smooth scrolling
   - Gallery lightbox
   - Contact & application forms
   - Floating CTA
   - Scroll reveal animations
   - Basic a11y helpers
========================================================= */

(function () {
  'use strict';

  // Helpers
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const on = (el, event, fn) => el && el.addEventListener(event, fn);

  /* =========================
     Mobile Nav Toggle
     ========================= */
  const navToggle = $('.nav-toggle');
  const hamburger = $('.hamburger');
  const navList = $('.nav-list');

  if (navToggle && hamburger && navList) {
    on(navToggle, 'click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navList.classList.toggle('show', !expanded);
      hamburger.classList.toggle('active', !expanded);
    });

    // Close menu on link click (for smoother UX)
    navList.querySelectorAll('a').forEach(link =>
      link.addEventListener('click', () => {
        navList.classList.remove('show');
        hamburger.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      })
    );

    // Reset on resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        navList.classList.remove('show');
        hamburger.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* =========================
     Smooth Scrolling
     ========================= */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  /* =========================
     Gallery Lightbox
     ========================= */
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightbox-img');
  const lightboxCaption = $('#lightbox-caption');
  const thumbs = $$('.gallery-thumb');

  thumbs.forEach((img) => {
    img.addEventListener('click', () => {
      const full = img.dataset.full || img.src;
      lightboxImg.src = full;
      lightboxImg.alt = img.alt || 'Gallery image';
      lightboxCaption.textContent = img.alt || '';
      lightbox.style.display = 'flex';
      lightbox.setAttribute('aria-hidden', 'false');
      $('.lightbox-close').focus();
    });
  });

  on($('.lightbox-close'), 'click', () => {
    lightbox.style.display = 'none';
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
      lightbox.style.display = 'none';
      lightbox.setAttribute('aria-hidden', 'true');
      lightboxImg.src = '';
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.style.display === 'flex') {
      lightbox.style.display = 'none';
      lightbox.setAttribute('aria-hidden', 'true');
    }
  });

  /* =========================
     Contact & Application Forms
     ========================= */
  const contactForm = $('#contact-form');
  const contactStatus = $('#contact-status');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      contactStatus.textContent = 'Sending...';
      setTimeout(() => {
        contactStatus.textContent = 'Message sent. We will reply within 2 working days.';
        contactForm.reset();
      }, 900);
    });
  }

  const applyForm = $('#apply-form');
  const appStatus = $('#app-status');
  if (applyForm) {
    applyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      appStatus.textContent = 'Submitting application...';
      setTimeout(() => {
        appStatus.textContent = 'Application submitted. Please print your reference number: REF-' + Date.now().toString().slice(-6);
        applyForm.reset();
      }, 1200);
    });
  }

  /* =========================
     Download Form Simulation
     ========================= */
  on($('#download-form'), 'click', () => {
    const a = document.createElement('a');
    a.href = 'data:application/pdf;base64,JVBERi0xLjQKJc...';
    a.download = 'admission-form.pdf';
    a.click();
  });

  /* =========================
     Subscribe Form
     ========================= */
  const subscribeForm = $('#subscribe-form');
  if (subscribeForm) {
    subscribeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Thank you! You are subscribed (demo).');
      subscribeForm.reset();
    });
  }

  /* =========================
     Floating CTA subtle animation
     ========================= */
  const fabs = $$('.fab');
  let floatPhase = 0;
  setInterval(() => {
    floatPhase = (floatPhase + 1) % 360;
    const y = Math.sin(floatPhase * Math.PI / 180) * 3;
    fabs.forEach(f => f.style.transform = `translateY(${y}px)`);
  }, 2000);

  /* =========================
     Reveal Animations
     ========================= */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('fade-in');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  $$('.card').forEach(el => observer.observe(el));

  /* =========================
     Accessibility / Reduced Motion
     ========================= */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    fabs.forEach(f => f.style.transition = 'none');
  }

  /* =========================
     Hero Video Auto-Pause
     ========================= */
  const heroVideo = $('.hero-video');
  if (heroVideo && 'IntersectionObserver' in window) {
    const vidObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (heroVideo.paused && !heroVideo.getAttribute('data-manual')) {
            heroVideo.play().catch(() => {});
          }
        } else {
          if (!heroVideo.paused) heroVideo.pause();
        }
      });
    }, { threshold: 0.2 });
    vidObserver.observe(heroVideo);
  }

  /* =========================
     Basic Form Validation
     ========================= */
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', () => {
      form.querySelectorAll('[required]').forEach(input => {
        if (!input.value) {
          input.classList.add('invalid');
          input.addEventListener('input', () => input.classList.remove('invalid'), { once: true });
        }
      });
    });
  });

})();
