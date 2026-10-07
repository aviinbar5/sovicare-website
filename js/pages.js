/* SoviCare — inner page interactions (category, How it works, FAQ, Contact). Timings follow each page's approved interaction spec. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isReduced = () => reduce.matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const inView = (els, cb, opts = {threshold: .3}) => {
    els = els.filter(Boolean);
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(cb); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } }), opts);
    els.forEach(el => io.observe(el));
  };
  const addIn = el => el.classList.add('is-in');

  /* Hero: halves pivot in, note rises */
  const hero = $('.ph-hero');
  if (hero) requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-in')));

  /* Reveals */
  inView($$('[data-path], [data-steps], [data-diagram]'), addIn, {threshold: .3});
  /* clipped elements report no visible area, so watch their wrapper instead */
  $$('[data-wipe], .sh-st-photo').forEach(el => inView([el.parentElement], () => el.classList.add('is-in'), {threshold: .3}));

  /* Mark replay on hover (trust strip, product cards) */
  const play = m => { if (!m || isReduced()) return; m.classList.remove('play'); void m.offsetWidth; m.classList.add('play'); };
  $$('.ph-trust li, .pcard').forEach(el => el.addEventListener('mouseenter', () => play($('.ph-mark', el))));
  const trust = $('.ph-trust');
  if (trust) {
    const marks = $$('.ph-mark', trust);
    inView([trust], () => marks.forEach((m, i) => setTimeout(() => play(m), i * 120)), {threshold: .4});
    let idx = 0, timer = null;
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !timer && !isReduced()) timer = setInterval(() => { if (!document.hidden) play(marks[idx++ % marks.length]); }, 4000);
      if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; }
    }, {threshold: .4}).observe(trust);
  }

  /* Picker: one choice per question; closest product card moves first */
  const picker = $('.sh-picker');
  if (picker) {
    const cards = $('.sh-cards');
    const groups = $$('.chips', picker);
    const val = g => $('[aria-checked="true"]', g)?.dataset.v;
    const match = () => {
      const a = val(groups[0]), b = val(groups[1]);
      let best = null;
      if (a === 'timing' || b === 'daily') best = 'tadalafil';
      else if (a === 'plan') best = 'sildenafil';
      else if (b === 'needed' && a !== 'unsure') best = 'sildenafil';
      $$('.pcard', cards).forEach(c => {
        const on = c.dataset.product === best;
        c.classList.toggle('is-match', on);
        const btn = $('.btn', c);
        btn.classList.toggle('btn-primary', on); btn.classList.toggle('btn-outline', !on);
      });
      const order = best ? [best, ...['tadalafil', 'sildenafil'].filter(p => p !== best)] : ['tadalafil', 'sildenafil'];
      const first = new Map($$('.pcard', cards).map(c => [c, c.getBoundingClientRect()]));
      order.forEach(p => cards.appendChild($(`.pcard[data-product="${p}"]`, cards)));
      if (!isReduced()) $$('.pcard', cards).forEach(c => {
        const r0 = first.get(c), r1 = c.getBoundingClientRect();
        const dx = r0.left - r1.left, dy = r0.top - r1.top;
        if (dx || dy) c.animate([{transform: `translate(${dx}px,${dy}px)`}, {transform: 'none'}], {duration: 320, easing: 'cubic-bezier(.22,1,.36,1)'});
      });
    };
    groups.forEach(g => {
      const chips = $$('.chip', g);
      const pick = (c, focus) => {
        chips.forEach(o => { const on = o === c; o.setAttribute('aria-checked', String(on)); o.tabIndex = on ? 0 : -1; });
        if (focus) c.focus();
        match();
      };
      chips.forEach((c, i) => {
        c.tabIndex = c.getAttribute('aria-checked') === 'true' ? 0 : -1;
        c.addEventListener('click', () => pick(c));
        c.addEventListener('keydown', e => {
          const d = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[e.key];
          if (d) { e.preventDefault(); pick(chips[(i + d + chips.length) % chips.length], true); }
        });
      });
    });
    match();
  }

  /* Causes diagram: hover / tap shows a one-line note; line turns solid Deep Teal */
  const diagram = $('[data-diagram]');
  if (diagram) {
    const causes = $$('.cause', diagram), links = $$('.sh-link', diagram);
    const set = (i, on) => { causes[i].setAttribute('aria-expanded', String(on)); links[i]?.classList.toggle('is-on', on); };
    causes.forEach((c, i) => {
      c.addEventListener('mouseenter', () => links[i]?.classList.add('is-on'));
      c.addEventListener('mouseleave', () => { if (c.getAttribute('aria-expanded') !== 'true') links[i]?.classList.remove('is-on'); });
      c.addEventListener('click', () => {
        const open = c.getAttribute('aria-expanded') === 'true';
        causes.forEach((_, j) => set(j, false));
        set(i, !open);
      });
    });
  }

  /* FAQ rows: each question has its own URL hash */
  $$('.acc[data-hash]').forEach(acc => {
    const open = item => {
      const b = $('.acc-btn', item);
      if (b && b.getAttribute('aria-expanded') !== 'true') b.click();
    };
    $$('.acc-item', acc).forEach(item => $('.acc-btn', item).addEventListener('click', () => {
      if ($('.acc-btn', item).getAttribute('aria-expanded') === 'true' && item.id) history.replaceState(null, '', '#' + item.id);
    }));
    const fromHash = () => { const t = location.hash && acc.querySelector(location.hash); if (t && t.classList.contains('acc-item')) { open(t); t.scrollIntoView({block: 'center'}); } };
    fromHash(); window.addEventListener('hashchange', fromHash);
  });

  /* Demo CTA (assessment not connected yet) */
  $$('.ph-demo').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const msg = $('.ph-demo-msg', a.closest('section'));
    if (msg) msg.textContent = 'Demo only: the assessment is not connected yet.';
  }));

  /* Mobile sticky bar: after the hero CTA leaves view, hidden at the final CTA */
  const sticky = $('.sticky-cta'), startBtn = $('[data-sticky-start]'), endSec = $('[data-sticky-end]');
  if (sticky && startBtn && endSec) {
    const upd = () => {
      const gone = startBtn.getBoundingClientRect().bottom < 0;
      const atEnd = endSec.getBoundingClientRect().top < window.innerHeight;
      const menuOpen = $('.menu-panel')?.classList.contains('open');
      const show = gone && !atEnd && !menuOpen;
      sticky.classList.toggle('show', show); sticky.inert = !show; sticky.setAttribute('aria-hidden', String(!show));
    };
    window.addEventListener('scroll', upd, {passive: true});
    window.addEventListener('resize', upd);
    upd();
  }
})();
