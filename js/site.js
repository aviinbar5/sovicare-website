/* SoviCare — interactions. Timings follow the HP v2 interaction spec (APPROVED 01.10). */
(() => {
  const doc = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isReduced = () => reduce.matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Reveal once, when in view ---------- */
  const onceInView = (els, cb, opts = {threshold: .25}) => {
    if (!('IntersectionObserver' in window)) { els.forEach(cb); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } });
    }, opts);
    els.forEach(el => io.observe(el));
  };
  onceInView($$('[data-reveal]'), el => el.classList.add('is-in'), {threshold: .15, rootMargin: '0px 0px -40px 0px'});
  onceInView($$('.kit[data-kit]'), el => el.classList.add('is-in'), {threshold: .2});
  onceInView($$('.mosaic, .why-copy'), el => el.classList.add('is-in'), {threshold: .3});
  onceInView($$('.hiw-panel'), el => el.querySelector('.hiw-orb-wrap').classList.add('is-in'), {threshold: .5});

  /* ---------- Mark moves ---------- */
  const play = (mark, move) => {
    if (!mark || isReduced()) return;
    const cls = 'play-' + (move || mark.dataset.move || 'pivot');
    mark.classList.remove(cls); void mark.getBBox?.(); mark.getBoundingClientRect();
    mark.classList.add(cls);
    clearTimeout(mark._t); mark._t = setTimeout(() => mark.classList.remove(cls), 700);
  };

  /* ---------- Header: Deep Teal after 8px ---------- */
  const header = $('.site-header');
  const onScroll = () => header && header.classList.toggle('is-stuck', window.scrollY > 8);
  onScroll(); window.addEventListener('scroll', onScroll, {passive: true});

  /* ---------- Hero ---------- */
  const hero = $('.hero');
  if (hero) {
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-in')));
    const toggle = $('.media-toggle', hero);
    const setPlaying = on => {
      hero.classList.toggle('is-playing', on);
      toggle.setAttribute('aria-pressed', String(!on));
      toggle.setAttribute('aria-label', on ? 'Pause background motion' : 'Play background motion');
    };
    setPlaying(!isReduced());
    toggle.addEventListener('click', () => setPlaying(!hero.classList.contains('is-playing')));
    reduce.addEventListener?.('change', () => setPlaying(!isReduced()));
  }

  /* ---------- Category cards: mark plays once on hover ---------- */
  $$('.cat').forEach(card => {
    const m = $('.cat-tag .mark', card);
    card.addEventListener('mouseenter', () => play(m, 'pivot'));
    card.addEventListener('focusin', () => play(m, 'pivot'));
  });

  /* ---------- Trust strip: Pivot, Pivot, Wipe, Shift — 120ms apart; hover replays; one replays every 4s in view ---------- */
  const trust = $('.trust');
  if (trust) {
    const marks = $$('.trust .mark');
    onceInView([trust], () => marks.forEach((m, i) => setTimeout(() => play(m), i * 120)), {threshold: .4});
    $$('.trust li').forEach((li, i) => li.addEventListener('mouseenter', () => play(marks[i])));
    let idx = 0, timer = null, visible = false;
    const loop = () => { if (visible && !document.hidden) { play(marks[idx % marks.length]); idx++; } };
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !timer && !isReduced()) timer = setInterval(loop, 4000);
      if (!visible && timer) { clearInterval(timer); timer = null; }
    }, {threshold: .4}).observe(trust);
  }

  /* ---------- Stories carousel: bars fill over 7s, cross-fade 320ms, hover pauses ---------- */
  const stories = $('.stories');
  if (stories) {
    const imgs = $$('.slide-img', stories), quotes = $$('.story-q', stories), bars = $$('.progress .bar', stories);
    const count = $('.progress .count', stories), live = $('.story-live', stories);
    const N = imgs.length, DUR = 7000;
    let cur = 0, start = 0, elapsed = 0, paused = false, inView = false, raf = 0;
    const pad = n => String(n).padStart(2, '0');
    const paint = p => bars.forEach((b, i) => {
      const fill = b.firstElementChild;
      fill.style.transform = `scaleX(${i < cur ? 1 : i === cur ? p : 0})`;
    });
    const go = (n, user) => {
      cur = (n + N) % N; elapsed = 0; start = performance.now();
      imgs.forEach((im, i) => im.classList.toggle('is-active', i === cur));
      quotes.forEach((q, i) => { q.classList.toggle('is-active', i === cur); q.setAttribute('aria-hidden', String(i !== cur)); });
      bars.forEach((b, i) => b.setAttribute('aria-current', i === cur ? 'true' : 'false'));
      count.textContent = `${pad(cur + 1)} / ${pad(N)}`;
      if (user && live) live.textContent = `Story ${cur + 1} of ${N}`;
      paint(isReduced() ? 1 : 0);
    };
    const tick = now => {
      if (!paused && inView && !isReduced()) {
        elapsed += now - start;
        if (elapsed >= DUR) { go(cur + 1); }
        else paint(elapsed / DUR);
      }
      start = now; raf = requestAnimationFrame(tick);
    };
    $('.prev', stories).addEventListener('click', () => go(cur - 1, true));
    $('.next', stories).addEventListener('click', () => go(cur + 1, true));
    bars.forEach((b, i) => b.addEventListener('click', () => go(i, true)));
    const media = $('.story', stories);
    media.addEventListener('mouseenter', () => paused = true);
    media.addEventListener('mouseleave', () => paused = false);
    media.addEventListener('focusin', () => paused = true);
    media.addEventListener('focusout', () => paused = false);
    let sx = null;
    const frame = $('.story-media', stories);
    frame.addEventListener('touchstart', e => { sx = e.touches[0].clientX; paused = true; }, {passive: true});
    frame.addEventListener('touchend', e => {
      paused = false; if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1), true);
    });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, {threshold: .3}).observe(stories);
    go(0); raf = requestAnimationFrame(tick);
  }

  /* ---------- How it works: tabs, arrow/Home/End, Quarter pivots 90° per step ---------- */
  const hiw = $('.hiw');
  if (hiw) {
    const tabs = $$('.step-btn', hiw), items = $$('.step', hiw);
    const pieces = $$('.hiw-symbol .pc', hiw), bars = $$('.pieces i', hiw);
    const orb = $('.hiw-orb', hiw), orbPath = $('.hiw-orb path', hiw);
    const cap = $('.hiw-cap', hiw);
    const colors = ['#264653', '#219EBC', '#2A9D8F', '#FFBE0B'];
    const caps = JSON.parse($('#hiw-data').textContent);
    let cur = 0;
    const select = (n, focus) => {
      n = (n + tabs.length) % tabs.length;
      const changed = n !== cur; cur = n;
      items.forEach((it, i) => it.setAttribute('aria-selected', String(i === n)));
      tabs.forEach((t, i) => { t.setAttribute('aria-selected', String(i === n)); t.tabIndex = i === n ? 0 : -1; });
      if (focus) tabs[n].focus();
      pieces.forEach((p, i) => { const on = i <= n; p.dataset.on = on ? '1' : '0'; p.style.fill = on ? p.dataset.color : 'transparent'; });
      bars.forEach((b, i) => b.classList.toggle('on', i <= n));
      orb.style.transform = `rotate(${n * 90}deg)`; orbPath.style.fill = colors[n];
      const c = caps[n];
      const write = () => {
        $('.t-label', cap).textContent = `${String(n + 1).padStart(2, '0')} / 04 · ${c.k}`;
        $('h3', cap).textContent = c.t; $('p', cap).textContent = c.b;
      };
      if (changed && !isReduced()) {
        cap.classList.add('swap'); write();
        requestAnimationFrame(() => requestAnimationFrame(() => cap.classList.remove('swap')));
      } else write();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', e => {
        const k = e.key;
        if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); select(cur + 1, true); }
        else if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); select(cur - 1, true); }
        else if (k === 'Home') { e.preventDefault(); select(0, true); }
        else if (k === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
      });
    });
    select(0);
  }

  /* ---------- Members & support: channel arrow shift handled in CSS ---------- */

  /* ---------- FAQ: one open at a time ---------- */
  $$('.acc').forEach(acc => {
    const btns = $$('.acc-btn', acc);
    btns.forEach(b => b.addEventListener('click', () => {
      const open = b.getAttribute('aria-expanded') === 'true';
      btns.forEach(o => { o.setAttribute('aria-expanded', 'false'); $('#' + o.getAttribute('aria-controls')).classList.remove('open'); });
      if (!open) { b.setAttribute('aria-expanded', 'true'); $('#' + b.getAttribute('aria-controls')).classList.add('open'); }
    }));
  });

  /* ---------- Final: single-select tiles (radio group) ---------- */
  const group = $('.tiles');
  if (group) {
    const tiles = $$('.tile', group);
    const pick = (t, focus) => {
      tiles.forEach(o => { const on = o === t; o.setAttribute('aria-checked', String(on)); o.tabIndex = on ? 0 : -1; });
      if (focus) t.focus();
      play($('.mark', t), 'pivot');
      try { sessionStorage.setItem('sovi-first', t.dataset.value); } catch (e) {}
    };
    tiles.forEach((t, i) => {
      t.addEventListener('click', () => pick(t));
      t.addEventListener('keydown', e => {
        const dir = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[e.key];
        if (dir) { e.preventDefault(); pick(tiles[(i + dir + tiles.length) % tiles.length], true); }
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pick(t); }
      });
    });
    tiles[0].tabIndex = 0;
    // "Start with answers" from a shortcut preselects the matching tile.
    $$('[data-preselect]').forEach(a => a.addEventListener('click', () => {
      const t = tiles.find(x => x.dataset.value === a.dataset.preselect); if (t) pick(t);
    }));
    const go = $('.final-go'), msg = $('.final-msg');
    go?.addEventListener('click', e => {
      e.preventDefault();
      const sel = tiles.find(t => t.getAttribute('aria-checked') === 'true');
      msg.textContent = sel
        ? `Demo: you chose “${$('b', sel).textContent}”. The assessment itself is not connected yet.`
        : 'Pick one of the four to begin.';
      if (!sel) tiles[0].focus();
    });
  }

  /* ---------- Newsletter (demo) ---------- */
  const news = $('.news form');
  news?.addEventListener('submit', e => {
    e.preventDefault();
    const ok = $('.ok', news), input = $('input', news);
    if (!input.checkValidity()) { ok.textContent = 'Enter an email address, like you@example.com.'; input.focus(); return; }
    ok.textContent = 'Demo only: nothing was sent. The signup is not connected yet.';
  });

  /* ---------- Mobile menu ---------- */
  const panel = $('.menu-panel'), openBtn = $('.menu-btn'), closeBtn = $('.menu-close');
  const sticky = $('.sticky-cta');
  const setMenu = on => {
    panel.classList.toggle('open', on);
    panel.inert = !on; panel.setAttribute('aria-hidden', String(!on));
    openBtn.setAttribute('aria-expanded', String(on));
    document.body.style.overflow = on ? 'hidden' : '';
    updateSticky();
    (on ? closeBtn : openBtn).focus();
  };
  if (panel) {
    panel.inert = true;
    openBtn.addEventListener('click', () => setMenu(true));
    closeBtn.addEventListener('click', () => setMenu(false));
    $$('a', panel).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) setMenu(false); });
  }

  /* ---------- Mobile sticky bar: shows once the hero button leaves; hides at the final section and while the menu is open ---------- */
  let heroGone = false, atFinal = false;
  function updateSticky() {
    if (!sticky) return;
    const show = heroGone && !atFinal && !(panel && panel.classList.contains('open'));
    sticky.classList.toggle('show', show);
    sticky.inert = !show; sticky.setAttribute('aria-hidden', String(!show));
  }
  const heroBtn = $('.hero .btn'), finalSec = $('.final');
  if (sticky && heroBtn && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { heroGone = !e.isIntersecting && e.boundingClientRect.top < 0; updateSticky(); }).observe(heroBtn);
    new IntersectionObserver(([e]) => { atFinal = e.isIntersecting || e.boundingClientRect.top < 0; updateSticky(); }, {threshold: 0}).observe(finalSec);
    updateSticky();
  }

  /* Smooth in-page jumps (instant for reduced motion) */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const t = $(id); if (!t) return;
    e.preventDefault();
    t.scrollIntoView({behavior: isReduced() ? 'auto' : 'smooth', block: 'start'});
    history.replaceState(null, '', id);
  }));
})();
