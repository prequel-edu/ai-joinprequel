// main.js — LP2 (AI Builders) interactions
// Responsibilities:
//   1. A/B hero variant swap from ?v=A|B|C query string
//   2. Hero ticker auto-scroll (capped at 3 cycles, pause on hover)
//   3. Sticky CTA reveal after 15% scroll
//   4. Exit-intent modal (top-of-viewport mouse leave, dismissable per session)
//
// Plain JS, no framework. Production code.

(function () {
  'use strict';

  // ============================================
  // 1. A/B hero variant swap
  // ============================================
  function applyHeroVariant() {
    var hero = document.getElementById('hero');
    if (!hero) return;

    var params = new URLSearchParams(window.location.search);
    var raw = (params.get('v') || 'A').toUpperCase();
    var variant = ['A', 'B', 'C'].indexOf(raw) >= 0 ? raw : 'A';

    var line1Attr = 'data-variant-' + variant.toLowerCase() + '-h1-line1';
    var line2Attr = 'data-variant-' + variant.toLowerCase() + '-h1-line2';
    var subAttr = 'data-variant-' + variant.toLowerCase() + '-sub';

    var line1 = hero.getAttribute(line1Attr);
    var line2 = hero.getAttribute(line2Attr);
    var sub = hero.getAttribute(subAttr);

    var line1El = hero.querySelector('[data-hero-line1]');
    var line2El = hero.querySelector('[data-hero-line2]');
    var subEl = hero.querySelector('[data-hero-sub]');

    if (line1 && line1El) line1El.textContent = line1;
    if (line2 && line2El) line2El.textContent = line2;
    if (sub && subEl) subEl.textContent = sub;

    // Stamp variant on body for analytics + CSS hooks
    document.body.setAttribute('data-hero-variant', variant);
  }

  // ============================================
  // 2. Hero ticker auto-scroll
  // ============================================
  function initTicker() {
    var ticker = document.querySelector('[data-ticker]');
    if (!ticker) return;
    var track = ticker.querySelector('[data-ticker-track]');
    if (!track) return;

    // Skip auto-scroll on mobile (handled via horizontal swipe CSS)
    if (window.matchMedia('(max-width: 991px)').matches) return;

    var cards = Array.from(track.children);
    if (cards.length === 0) return;

    // Duplicate cards once for seamless loop
    cards.forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    var cardHeight = cards[0].offsetHeight + 16; // includes gap
    var totalCards = cards.length; // original count
    var position = 0;
    var cyclesCompleted = 0;
    var MAX_CYCLES = 3;
    var ADVANCE_MS = 4000;
    var paused = false;

    ticker.addEventListener('mouseenter', function () {
      paused = true;
    });
    ticker.addEventListener('mouseleave', function () {
      paused = false;
    });

    var interval = setInterval(function () {
      if (paused) return;
      if (cyclesCompleted >= MAX_CYCLES) {
        clearInterval(interval);
        return;
      }

      position += 1;
      track.style.transition = 'transform 0.6s ease';
      track.style.transform = 'translateY(' + -position * cardHeight + 'px)';

      // When we've advanced through one full original set, reset silently
      if (position >= totalCards) {
        cyclesCompleted += 1;
        if (cyclesCompleted < MAX_CYCLES) {
          setTimeout(function () {
            track.style.transition = 'none';
            position = 0;
            track.style.transform = 'translateY(0)';
          }, 650);
        }
      }
    }, ADVANCE_MS);
  }

  // ============================================
  // 3. Sticky CTA reveal
  // ============================================
  function initStickyCTA() {
    var sticky = document.querySelector('[data-sticky-cta]');
    if (!sticky) return;

    function onScroll() {
      var scrolled = window.scrollY;
      var pageHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = pageHeight > 0 ? scrolled / pageHeight : 0;
      if (pct >= 0.15) {
        sticky.classList.add('is-visible');
      } else {
        sticky.classList.remove('is-visible');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ============================================
  // 4. Exit-intent modal
  // ============================================
  function initExitIntent() {
    var modal = document.querySelector('[data-exit-modal]');
    if (!modal) return;

    var SESSION_KEY = 'prequel_lp2_exit_dismissed';
    var dismissed = false;
    try {
      dismissed = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch (e) {
      // Some browsers (private mode) throw on sessionStorage access
      dismissed = false;
    }
    if (dismissed) return;

    var shown = false;

    function show() {
      if (shown || dismissed) return;
      shown = true;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    }

    function hide() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      dismissed = true;
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch (e) {
        // ignore
      }
    }

    // Trigger: cursor leaves top of viewport
    document.addEventListener('mouseleave', function (e) {
      if (e.clientY <= 0) show();
    });

    // Trigger fallback for touch: after 45s of activity with no scroll-bottom, show once
    var fallbackTimer = setTimeout(function () {
      // Only fire on mobile-ish viewports where mouseleave doesn't fire
      if (window.matchMedia('(max-width: 991px)').matches) show();
    }, 45000);

    // Close handlers
    modal.querySelectorAll('[data-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        hide();
        clearTimeout(fallbackTimer);
      });
    });

    // Click outside box dismisses
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        hide();
        clearTimeout(fallbackTimer);
      }
    });

    // ESC dismisses
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        hide();
        clearTimeout(fallbackTimer);
      }
    });
  }

  // ============================================
  // Bootstrap
  // ============================================
  function init() {
    applyHeroVariant();
    initTicker();
    initStickyCTA();
    // Exit-intent modal removed in iteration 4 per Roberta — no "shipped" popup.
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
