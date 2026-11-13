(() => {
  'use strict';
  const M = window.Motion;
  const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- плёнка: точки на пружинах, тянутся за курсором ---------- */
  const film = document.getElementById('film');
  const sheet = document.getElementById('sheet');
  const glow = document.getElementById('glow');
  const W = 1000, BASE = 70, N = 9;
  const pts = Array.from({ length: N }, (_, i) => ({ x: i * W / (N - 1), s: M.S(BASE, [180, 11]) }));
  let px = W / 2, py = 0, active = false;

  const draw = () => {
    let d = `M0,0 L0,${pts[0].s.x.toFixed(1)}`;
    for (let i = 0; i < N - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const mx = (a.x + b.x) / 2, my = (a.s.x + b.s.x) / 2;
      d += ` Q${a.x},${a.s.x.toFixed(1)} ${mx},${my.toFixed(1)}`;
    }
    const l = pts[N - 1];
    d += ` T${l.x},${l.s.x.toFixed(1)} L${W},0 Z`;
    sheet.setAttribute('d', d);
    glow.setAttribute('cx', px.toFixed(0));
    glow.setAttribute('cy', (BASE + 40 + Math.max(0, py) * .3).toFixed(0));
  };
  draw();

  const job = {
    frame: dt => pts.forEach(p => M.step(p.s, dt)),
    render: draw,
    done: () => !active && pts.every(p => M.rest(p.s))
  };
  const pull = e => {
    const r = film.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width * W;
    py = (e.clientY - r.top) / r.height * 220 - BASE;
    pts.forEach(p => {
      const d = (p.x - px) / 170;
      p.s.t = BASE + Math.max(-20, py) * 1.25 * Math.exp(-d * d);
    });
    active = true; M.run(job);
  };
  film.addEventListener('pointermove', pull);
  film.addEventListener('pointerleave', () => { active = false; pts.forEach(p => { p.s.t = BASE; }); M.run(job); });
  if (!reduce) {
    /* один раз при загрузке плёнка «вздыхает», показывая, что она живая */
    setTimeout(() => { pts.forEach((p, i) => { p.s.v = 260 - Math.abs(i - N / 2) * 40; }); M.run(job); }, 900);
  }

  /* ---------- цены и калькулятор ---------- */
  const TYPES = {
    pvc:   { ppm: 1150, txt: 'Матовая или глянцевая ПВХ-плёнка. Подходит для любой комнаты, не боится соседей сверху: выдерживает до 100 литров воды на метр.' },
    fabric:{ ppm: 1900, txt: 'Тканевое полотно без запаха и без швов до 5 метров. Не боится мороза, поэтому ставят на дачах и верандах.' },
    float: { ppm: 2400, txt: 'Парящий потолок: профиль со светодиодной лентой по периметру, потолок как будто висит в воздухе.' }
  };
  let type = 'pvc';
  const area = document.getElementById('area');
  const set = (id, v) => { document.getElementById(id).textContent = v; };
  const calc = () => {
    const a = +area.value, raw = a * TYPES[type].ppm, total = Math.max(raw, 16000);
    set('areaV', a);
    set('total', fmt(total));
    set('note', raw < 16000 ? 'Применён минимальный заказ 16 000 ₽' : 'Угол в подарок при заказе от 16 000 ₽');
    set('ppm', fmt(TYPES[type].ppm));
    set('ptxt', TYPES[type].txt);
  };
  document.querySelectorAll('[data-type]').forEach(b => b.addEventListener('click', () => { type = b.dataset.type; calc(); }));
  area.addEventListener('input', calc);
  calc();

  /* ---------- форма: демо, никуда не уходит ---------- */
  document.getElementById('lead').addEventListener('submit', e => {
    e.preventDefault();
    const ph = document.getElementById('phone');
    if (ph.value.replace(/\D/g, '').length < 10) { ph.focus(); ph.setAttribute('aria-invalid', 'true'); return; }
    ph.removeAttribute('aria-invalid');
    document.getElementById('ok').hidden = false;
  });
})();
