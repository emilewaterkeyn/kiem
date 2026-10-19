/* Kiem Studio: header, menu, photo credit and project filter. The site works without this file. */
(function () {
  'use strict';
  var header = document.querySelector('.site-header');

  // Homepage: the header sits on the photo until you scroll past it, then turns white with a rule
  var hero = document.querySelector('.hero');
  if (header && hero) {
    var update = function () {
      var over = window.scrollY < hero.offsetHeight - header.offsetHeight;
      header.classList.toggle('over', over);
      header.classList.toggle('solid', !over);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  // Menu on narrow screens
  var toggle = document.querySelector('.menu-toggle');
  if (header && toggle) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  // Homepage slideshow: a new project photo every 15 seconds, with a slow crossfade and a pause button
  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero .slide'));
  if (hero && slides.length > 1) {
    hero.classList.add('has-slides');
    var current = 0, timer = null, userPaused = false;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var creditText = document.querySelector('[data-credit-text]');
    var creditLink = document.querySelector('[data-credit-link]');
    var pauseBtn = document.querySelector('.pause');
    var show = function (n) {
      // the outgoing photo stays fully visible underneath while the next one fades in on top
      slides.forEach(function (s) { s.classList.remove('is-prev'); });
      slides[current].classList.remove('is-active');
      slides[current].classList.add('is-prev');
      slides[current].setAttribute('aria-hidden', 'true');
      current = (n + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      slides[current].removeAttribute('aria-hidden');
      if (creditText) creditText.textContent = slides[current].getAttribute('data-credit');
      if (creditLink) creditLink.setAttribute('href', slides[current].getAttribute('data-href'));
    };
    var next = function () {
      var img = slides[(current + 1) % slides.length];
      var ready = img.decode ? img.decode() : Promise.resolve();
      ready.catch(function () {}).then(function () { show(current + 1); });
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    var start = function () { stop(); if (!userPaused && !document.hidden) timer = setInterval(next, 15000); };
    var label = function () {
      if (!pauseBtn) return;
      pauseBtn.setAttribute('aria-pressed', String(userPaused));
      pauseBtn.setAttribute('aria-label', userPaused ? 'Play the slideshow' : 'Pause the slideshow');
    };
    if (reduce) userPaused = true;
    label();
    if (pauseBtn) pauseBtn.addEventListener('click', function () { userPaused = !userPaused; label(); if (userPaused) stop(); else start(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    start();
  }

  // Project clips: play silently while in view, unless the visitor prefers reduced motion or paused it
  var clips = Array.prototype.slice.call(document.querySelectorAll('video[data-autoplay]'));
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (clips.length && !still && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !v.userPaused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else if (!e.isIntersecting && !v.paused) { v.autoPause = true; v.pause(); }
      });
    }, { threshold: 0.5 });
    clips.forEach(function (v) {
      v.muted = true;
      v.addEventListener('pause', function () { if (!v.autoPause) v.userPaused = true; v.autoPause = false; });
      v.addEventListener('play', function () { v.userPaused = false; });
      io.observe(v);
    });
  }

  // Photo credit on the homepage
  var info = document.querySelector('.info');
  var credit = document.querySelector('.credit-text');
  if (info && credit) {
    credit.hidden = true;
    info.addEventListener('click', function () {
      credit.hidden = !credit.hidden;
      info.setAttribute('aria-expanded', String(!credit.hidden));
    });
  }

  // Projects filter: All / Emile / Merlijn / Together, kept in the address as #emile, #merlijn or #together
  var bar = document.querySelector('[data-filter-bar]');
  if (bar) {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-by]'));
    var buttons = Array.prototype.slice.call(bar.querySelectorAll('button[data-filter]'));
    var status = document.querySelector('[data-filter-status]');
    var names = { all: 'all projects', emile: 'projects by Emile', merlijn: 'projects by Merlijn', together: 'projects by Emile and Merlijn together' };
    var matches = function (item, f) {
      var by = (item.getAttribute('data-by') || '').split(' ');
      if (f === 'all') return true;
      if (f === 'together') return by.length > 1;
      return by.indexOf(f) !== -1;
    };
    var apply = function (f, remember) {
      if (!names[f]) f = 'all';
      var shown = 0;
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === f)); });
      items.forEach(function (it) { var ok = matches(it, f); it.hidden = !ok; if (ok) shown++; });
      if (status) status.textContent = 'Showing ' + shown + ' ' + names[f] + '.';
      document.querySelectorAll('[data-keep-filter]').forEach(function (a) {
        a.setAttribute('href', a.getAttribute('href').split('#')[0] + (f === 'all' ? '' : '#' + f));
      });
      if (remember) {
        try { history.replaceState(null, '', f === 'all' ? location.pathname + location.search : '#' + f); } catch (e) {}
      }
    };
    buttons.forEach(function (b) { b.addEventListener('click', function () { apply(b.getAttribute('data-filter'), true); }); });
    bar.hidden = false;
    apply((location.hash || '').replace('#', '') || 'all', false);
    window.addEventListener('hashchange', function () { apply((location.hash || '').replace('#', '') || 'all', false); });
  }
})();
