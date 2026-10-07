'use strict';
/* =====================================================================
   КАРТКИ
   ===================================================================== */
let CUR = null;
async function showCard(card) {
  const st = $('#stage');
  if (CUR) { const o = CUR; o.classList.add('leave'); await sleep(280); o.remove(); }
  st.appendChild(card); CUR = card; st.scrollTop = 0; return card;
}
function lvCard(i, inner, cls = '') {
  const L = LEVELS[i];
  return h(`<section class="card enter ${cls}"><div class="chip"><span>РІВЕНЬ ${String(i + 1).padStart(2, '0')}</span><b>${L.icon}</b></div>${inner}</section>`);
}
const plainCard = (inner, cls = '') => h(`<section class="card enter ${cls}">${inner}</section>`);
function nextBtn(card, label = 'Далі →', cls = 'yes big') {
  return new Promise(res => {
    const r = h(`<div class="row"><button class="btn ${cls}">${label}</button></div>`); card.appendChild(r);
    const b = r.firstElementChild;
    b.addEventListener('click', () => { if (b.disabled) return; b.disabled = true; SFX.pop(); vib(15); res(); });
    setTimeout(() => r.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 380);
  });
}
function polaroid(src, cap, o = {}) {
  const { r = -3, tall = false, pos = '50% 50%', cls = '', fb = '🐶' } = o;
  return `<div class="pol in dev ${tall ? 'tall' : ''} ${cls}" style="--r:${r}deg"><img src="${src}" alt="" style="object-position:${pos}" onerror="this.outerHTML='<div class=&quot;dogfb&quot;>${fb}</div>'"><div class="cap">${cap}</div></div>`;
}
function scrollEnd(el) { setTimeout(() => el && el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120); }
function layerClean() { $('#layer').innerHTML = ''; $$('.runner').forEach(e => e.remove()); document.body.classList.remove('incall', 'filming'); }

/* XP-вікно помилки */
function xpDialog(title, html, okLabel, idx = 0, icon = '✕', cute = false) {
  const w = Math.min(innerWidth * .88, 330);
  const d = h(`<div class="xp ${cute ? 'cute' : ''}"><div class="tb"><span>${title}</span><button class="xx">✕</button></div><div class="bd"><div class="ico ${icon.length > 1 ? 'emo' : ''}">${icon}</div><div>${html}</div></div><div class="ft"><button class="ok">${okLabel}</button></div></div>`);
  d.style.left = clamp(innerWidth / 2 - w / 2 + (idx - 1) * 18, 6, innerWidth - w - 6) + 'px';
  d.style.top = clamp(innerHeight * .26 + idx * 30, 60, innerHeight - 240) + 'px';
  $('#layer').appendChild(d); return d;
}

/* =====================================================================
   ІНТРО: термінал → відбиток пальця → таймер 5 сек → музика
   ===================================================================== */
const FP_SVG = `<svg viewBox="0 0 150 150"><circle class="fpt" cx="75" cy="75" r="62"/><circle class="fpr" id="fpRing" cx="75" cy="75" r="62"/>
<g class="lines" transform="translate(75 78)">
<path d="M-26 -14 A30 30 0 0 1 26 -14"/><path d="M-34 4 A36 38 0 0 1 -22 -30"/><path d="M22 -30 A36 38 0 0 1 34 6"/>
<path d="M-20 26 A24 26 0 0 1 -24 -4 A24 24 0 0 1 24 -6 A24 26 0 0 1 22 18"/><path d="M-12 32 A16 18 0 0 1 -16 2 A16 16 0 0 1 16 0 A16 18 0 0 1 14 22"/>
<path d="M-2 34 A8 10 0 0 1 -8 6 A8 8 0 0 1 8 6 A8 12 0 0 1 6 28"/><path d="M0 14 L2 34"/><path d="M-30 18 A34 34 0 0 1 -32 -6"/><path d="M30 20 A34 34 0 0 0 33 -2"/>
</g></svg><div class="scanl"></div>`;
async function typeLine(term, txt, cls) {
  const d = document.createElement('div'); if (cls) d.className = cls; term.appendChild(d);
  const cur = document.createElement('span'); cur.className = 'cur';
  for (const ch of Array.from(txt)) { d.textContent += ch; d.appendChild(cur); await sleep(ch === ' ' ? 10 : 16); }
  cur.remove();
}
function fingerprint() {
  return new Promise(res => {
    const fp = $('#fp'), ring = $('#fpRing'), lbl = $('#fpl'); const C = 2 * Math.PI * 62;
    ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C;
    let holding = false, p = 0, last = 0, done = false, lastVib = 0;
    const step = ts => {
      if (!holding || done) return;
      p = Math.min(1, p + (ts - last) / 1500); last = ts; ring.style.strokeDashoffset = C * (1 - p); SFX.riseSet(p);
      if (ts - lastVib > 120) { vib(6); lastVib = ts; }
      lbl.textContent = p < .35 ? 'сканую… 🔍' : p < .7 ? 'аналіз милоти… 📈' : 'майже… ❤️';
      if (p >= 1) { done = true; holding = false; SFX.riseStop(); fp.classList.remove('scan'); fp.classList.add('done'); res(); return; }
      requestAnimationFrame(step);
    };
    const down = e => { e.preventDefault(); if (done) return; unlock(); SFX.resume(); holding = true; fp.classList.add('scan'); SFX.riseStart(); last = performance.now(); requestAnimationFrame(step); };
    const up = () => {
      if (!holding || done) return; holding = false; SFX.riseStop(); fp.classList.remove('scan'); lbl.textContent = 'тримай довше 😌';
      const back = () => { if (holding || done) return; p = Math.max(0, p - .03); ring.style.strokeDashoffset = C * (1 - p); if (p > 0) requestAnimationFrame(back); }; back();
    };
    fp.addEventListener('pointerdown', down); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    fp.addEventListener('contextmenu', e => e.preventDefault());
  });
}
async function intro() {
  HUD.hide(); document.body.classList.add('nocaps');
  const boot = h(`<div id="boot"><div class="term" id="term"></div><div class="fpw hidden" id="fpw"><div id="fp">${FP_SVG}</div><div class="fpl" id="fpl">Приклади пальчик і потримай 👆</div><div class="fps">🎧 краще в навушниках · 🔊 увімкни звук</div></div></div>`);
  document.body.appendChild(boot);
  const L = [['> ініціалізація подарунка...'], ['> пошук найкрасивішої дівчини поблизу... 📡'], ['> знайдено: 1 рижа киця 🦊', 'ok'], ['> рівень милоти: 999% ⚠️ ПЕРЕВИЩЕНО', 'warn'], ['> потрібна перевірка особи 🔐']];
  await sleep(400);
  for (const [t, c] of L) { await typeLine($('#term'), t, c); await sleep(230); }
  $('#fpw').classList.remove('hidden');
  await fingerprint();
  $('#fpl').innerHTML = '✅ Особу підтверджено: <b>Рижа Киця 🦊</b>';
  SFX.chime(); vib([30, 60, 30]); FX.burst(...center($('#fp')), ['✅', '💖', '✨', '🦊'], 26);
  await sleep(1500);
  boot.classList.add('fade'); await sleep(600); boot.remove();
  await countdown();
}
async function countdown() {
  const cd = h(`<div id="cd"><div class="cd-sub">музика почнеться через</div><div class="cd-n" id="cdn">5</div><div class="cd-heart">❤️</div></div>`);
  document.body.appendChild(cd);
  // фонове завантаження фото
  setTimeout(() => { window.__pre = Array.from({ length: 23 }, (_, i) => { const im = new Image(); im.src = P(i + 1); return im; }); }, 1200);
  for (let n = 5; n >= 1; n--) {
    const el = $('#cdn'); el.textContent = n; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    SFX.thump(); vib(40); await sleep(1000);
  }
  let ok = await startMusic();
  flash(.9); SFX.boom(); cd.remove();
  if (!ok) ok = await tapToPlay();
  document.body.classList.add('started'); document.body.classList.remove('nocaps');
  FX.burst(innerWidth / 2, innerHeight / 2, ['🎵', '🎶', '❤️', '💖', '✨', '🦊'], 50, { max: 13 });
  FX.firework(innerWidth * .3, innerHeight * .3); setTimeout(() => FX.firework(innerWidth * .7, innerHeight * .25), 250);
}
function tapToPlay() {
  return new Promise(res => {
    const o = h(`<div class="tapplay"><button class="btn yes big">🎵 Тицьни, щоб увімкнути музику</button></div>`); document.body.appendChild(o);
    o.querySelector('button').onclick = async () => { unlock(); await startMusic(); o.remove(); res(true); };
  });
}

/* =====================================================================
   ПРИВІТАННЯ
   ===================================================================== */
async function greet() {
  const hr = new Date().getHours();
  const g = hr < 5 ? 'Чого не спиш, совеня? 🦉' : hr < 12 ? 'Доброго ранку, соня ☀️' : hr < 18 ? 'Привіт, киць 👋' : 'Добрий вечір, киць 🌙';
  const c = plainCard(`<div class="hello-emoji">🦊</div><h1 class="hello">${g}</h1>
    <p class="lead">Я зробив для тебе гру.<br><b>${LEVELS.length} рівнів</b>, купа приколів і фінальний сюрприз 🎬</p>
    <p class="rule">Правило одне: відповіді <s>«ні»</s> тут не існує 😌</p>
    <div class="row"><button class="btn yes big" data-a>Так ❤️</button><button class="btn yes alt big" data-a>Звісно так 😍</button></div>`);
  await showCard(c);
  await new Promise(r => $$('[data-a]', c).forEach(b => b.onclick = r));
  SFX.pop(); vib(20); FX.burst(...center(c), HEARTS, 30);
}
async function resumeAsk() {
  const done = S.done;
  const c = plainCard(`<div class="hello-emoji">😏</div><h1 class="hello">З поверненням, ${CFG.her}!</h1>
    <p class="lead">${done ? 'Ти вже пройшла все 🏆' : `Ти зупинилась на рівні ${S.level + 1}.`}</p>
    <div class="resume">${done ? '<button class="btn yes big wide" data-v="film">🎬 Подивитись фільм ще раз</button>' : `<button class="btn yes big wide" data-v="go">Продовжити з рівня ${S.level + 1} →</button>`}<button class="btn ghost wide" data-v="new">🔁 Почати спочатку</button></div>`);
  await showCard(c);
  const v = await new Promise(r => $$('[data-v]', c).forEach(b => b.onclick = () => r(b.dataset.v)));
  SFX.pop();
  if (v === 'new') { S.level = 0; S.ans = {}; S.done = false; S.started = Date.now(); save(); }
  return v;
}

/* =====================================================================
   РІВНІ
   ===================================================================== */
const DOGS = {
  c: ['https://images.dog.ceo/breeds/chihuahua/n02085620_7436.jpg', 'https://images.dog.ceo/breeds/chihuahua/n02085620_4875.jpg', 'https://images.dog.ceo/breeds/chihuahua/n02085620_3409.jpg'],
  b: ['https://images.dog.ceo/breeds/bulldog-english/jager-1.jpg', 'https://images.dog.ceo/breeds/bulldog-english/mami.jpg', 'https://images.dog.ceo/breeds/bulldog-french/n02108915_4731.jpg']
};
const DOGIMG = {};
function preloadDogs() { for (const k of ['c', 'b']) DOGIMG[k] = DOGS[k].map(u => { const im = new Image(); im.referrerPolicy = 'no-referrer'; im.src = u; return im; }); }
const dogSrc = k => { const ok = (DOGIMG[k] || []).find(im => im.complete && im.naturalWidth > 0); return ok ? ok.src : DOGS[k][0]; };

/* 1 — Чихуахуа чи бульдог */
async function L_dogs(i) {
  const c = lvCard(i, `<h2 class="q">Киць, хто краще: <em>чихуахуа</em> чи <em>бульдог</em>? 🐶</h2><p class="sub">обирай серцем</p>
    <div class="row" id="ch"><button class="btn yes big" data-k="c">Чихуахуа 🐕</button><button class="btn yes alt big" data-k="b">Бульдог 🐶</button></div><div id="res"></div>`);
  await showCard(c);
  const k = await new Promise(r => $$('#ch .btn', c).forEach(b => b.onclick = () => r(b.dataset.k)));
  SFX.pop(); $('#ch', c).remove(); const res = $('#res', c);
  S.ans.dog = k === 'c' ? 'Чихуахуа 🐕' : 'Бульдог 🐶'; save();
  if (k === 'c') {
    res.append(h(polaroid(dogSrc('c'), 'маленька, але злюка 😤', { r: -4, fb: '🐕' })));
    await sleep(450); FX.burst(...center(res), ['🐕', '🦴', '🐾', '❤️'], 26); SFX.chime();
    res.append(h(`<div class="react">Правильно! Маленька, тремтить, злиться, коли голодна, і язик показує 👅<br>когось нагадує 😏🦊</div>`));
  } else {
    res.append(h(polaroid(dogSrc('b'), 'пухкий і сонний 😴', { r: 3 })));
    await sleep(450); FX.burst(...center(res), ['🐶', '🦴', '🐾'], 18); SFX.pop();
    res.append(h(`<div class="react">Бульдог: пухкий, хропе, любить поїсти…<br>стоп, це ж я 😂</div>`));
    scrollEnd(res.lastElementChild); await sleep(2000);
    res.append(h(`<div class="react small">а ось це — ти 👇</div>`));
    res.append(h(polaroid(dogSrc('c'), 'чихуахуа-злюка 😤', { r: -4, fb: '🐕' })));
    await sleep(400); FX.burst(...center(res.lastElementChild), ['🐕', '💕', '👅'], 22); SFX.chime();
  }
  scrollEnd(res.lastElementChild);
  await nextBtn(c);
  Toast.ach('Собачий експерт', 'розбирається в породах 🐶', '🐶');
}

/* 2 — Червоний чи білий */
async function L_redwhite(i) {
  const c = lvCard(i, `<h2 class="q">Як думаєш, шо я виберу: <em>червоний</em> чи <em>білий</em>? 🤔</h2><p class="sub">подумай добре</p>
    <div class="row" id="ch"><button class="btn red big">🔴 Червоний</button><button class="btn white big">⚪ Білий</button></div><div id="res"></div>`);
  await showCard(c);
  const pk = await new Promise(r => $$('#ch .btn', c).forEach(b => b.onclick = () => r(b.textContent)));
  SFX.pop(); $('#ch', c).remove(); const res = $('#res', c);
  res.append(h(`<div class="nope glitch">❌ Неправильно 😌</div>`)); SFX.err(); vib([30, 40, 30]);
  await sleep(1200);
  res.innerHTML = '';
  FX.text('вибираю тебе', 14); FX.burst(innerWidth / 2, innerHeight / 2, ['🫵', '❤️', '💘', '😍'], 40, { max: 12 }); SFX.chime(); quake(); vib([20, 30, 60]);
  res.append(h(`<div class="choose"><span>Я</span> <span>вибираю</span><br><b>ТЕБЕ</b> <i>🫵</i></div>`));
  await sleep(700);
  res.append(h(polaroid(P(12), 'ось цю 🦊❤️', { r: -2, tall: true, pos: '50% 30%' })));
  FX.rain(['🫵', '❤️', '💘', '🦊'], 2200, 2);
  res.append(h(`<div class="react">(хоча рижий — технічно червоний 😏)</div>`));
  S.ans.redwhite = pk + ' → а я вибрав тебе 🫵'; save();
  scrollEnd(res.lastElementChild);
  await nextBtn(c);
  Toast.ach('Обрана', 'тебе вибрали. назавжди 🫵', '🫵');
}

/* 3 — Шаверма (кнопка «Ні» тікає, хрестик → 3 помилки → «ну киць») */
async function L_shawarma(i) {
  const c = lvCard(i, `<button class="closeX" aria-label="закрити">✕</button><h2 class="q">Сходимо тріснем по <em>шавермі</em>? 🌯</h2><p class="sub">питання дуже серйозне</p>
    <div class="row" id="ch"><button class="btn yes big" id="yes">Так 😋</button><button class="btn ghost big" id="no">Ні</button></div><div id="res"></div>`);
  await showCard(c);
  const yes = $('#yes', c), no = $('#no', c), x = $('.closeX', c);
  let esc = 0, phase = 0, last = 0, done = false; const errs = [];
  const texts = ['не-а 😝', 'ловиш?', 'хі-хі 🏃‍♀️', 'занадто повільно', '🏃‍♀️💨', 'ну-ну 😏', 'мимо 😜', 'не сьогодні'];
  const flee = e => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (done) return; const now = Date.now(); if (now - last < 150) return; last = now; esc++;
    if (!no.classList.contains('runner')) { const r = no.getBoundingClientRect(); document.body.appendChild(no); no.classList.add('runner'); no.style.left = r.left + 'px'; no.style.top = r.top + 'px'; void no.offsetWidth; }
    const bw = no.offsetWidth, bh = no.offsetHeight, cur = no.getBoundingClientRect(); let nx, ny, k = 0;
    do { nx = rnd(10, innerWidth - bw - 10); ny = rnd(70, innerHeight - bh - 120); k++; } while (k < 40 && Math.hypot(nx - cur.left, ny - cur.top) < 150);
    no.style.left = nx + 'px'; no.style.top = ny + 'px'; no.textContent = texts[(esc - 1) % texts.length]; SFX.whoosh(); vib(10);
    if (esc === 3 && phase === 0) { x.classList.add('wiggle'); $('#res', c).append(h(`<div class="hint">(або закрий питання ✕, якщо не хочеш 😏)</div>`)); }
  };
  no.addEventListener('pointerdown', flee); no.addEventListener('mouseenter', flee); no.addEventListener('click', flee);
  const finalDialog = () => {
    if (phase >= 2) return; phase = 2; errs.forEach(d => d.remove()); SFX.sad(); vib([60, 60, 60]);
    const d = xpDialog('ну киць…', 'ну киць 🥺 ну бачиш — <b>помилка</b>.<br>Тицяй «Так».', 'Добре, тицяю «Так» 💖', 1, '🥺', true);
    const close = () => { d.remove(); phase = 3; if (no.isConnected) { FX.burst(...center(no), ['💨', '✨'], 12, { max: 5 }); no.remove(); } x.remove(); $('.hint', c)?.remove(); yes.classList.add('beg'); };
    d.querySelectorAll('button').forEach(b => b.onclick = close);
  };
  const showErrors = async () => {
    phase = 1; x.classList.remove('wiggle'); quake();
    const M = [['Помилка', 'Закрити це питання неможливо.<br>Спробуйте ще раз.'], ['Помилка', 'Відповідь «Ні» не підтримується.<br>Спробуйте ще раз.'], ['Критична помилка', 'ERROR 0xШАВЕРМА:<br>відмова від шаверми неможлива.']];
    for (let k = 0; k < 3; k++) { if (phase !== 1) return; const d = xpDialog(M[k][0], M[k][1], 'Спробувати ще раз', k); errs.push(d); d.querySelectorAll('button').forEach(b => b.onclick = finalDialog); SFX.err(); vib(40); await sleep(280); }
  };
  x.onclick = () => { SFX.pop(); if (phase === 0) showErrors(); else if (phase === 1) finalDialog(); };
  await waitClick(yes);
  done = true; errs.forEach(d => d.remove()); $$('.xp').forEach(d => d.remove()); if (no.isConnected) no.remove(); x.remove(); $('#ch', c).remove(); $('.hint', c)?.remove();
  SFX.chime(); vib([20, 30, 80]);
  FX.burst(...center(c), HEARTS, 50, { max: 13 }); FX.rain(['🌯', '❤️', '💋', '💕', '😘'], 3200, 3);
  const res = $('#res', c);
  res.append(h(`<div class="tt-big">тт 💋</div>`));
  res.append(h(polaroid(P(14), 'твій погляд, коли я кажу «я не голодний» 🤨', { r: 3, tall: true, pos: '50% 25%' })));
  res.append(h(`<div class="react">Побачення з шавермою заброньоване 🌯❤️</div>`));
  S.ans.shawarma = 'ТАК 😋'; save();
  scrollEnd(res.lastElementChild);
  await nextBtn(c);
  Toast.ach('Шавермоїд 80 lvl', 'відмова від шаверми неможлива 🌯', '🌯');
}

/* 4 — Капча: «найкрасивіша» + «де вона показує язик 👅» */
const TONGUES = [3, 10, 17, 16, 18, 22];
function tileStyle(n) {
  if (n === 16) return crop(16, .52, .26, 2.6);
  if (n === 18) return crop(18, .26, .64, 1.9);
  if (n === 10) return crop(10, .47, .48, 1.4);
  if (n === 17) return crop(17, .5, .42, 1.15);
  return `background-image:url(${T(n)})`;
}
function captchaRound(wrap, o) {
  return new Promise(res => {
    wrap.innerHTML = `<div class="rc"><div class="rc-head"><div class="s1">${o.s1}</div><div class="s2">${o.s2}</div><div class="s3">${o.s3}</div></div>
      <div class="rc-grid">${o.tiles.map((t, k) => `<button class="rc-t" data-k="${k}" style="${tileStyle(t.n)}"><i>✓</i></button>`).join('')}</div>
      <div class="rc-msg"></div><div class="rc-foot"><span class="rc-ic">⟳ 🎧 ⓘ</span><button class="rc-skip">Пропустити</button><button class="rc-go">Підтвердити</button></div></div>`;
    const tiles = $$('.rc-t', wrap), msg = $('.rc-msg', wrap), box = $('.rc', wrap);
    tiles.forEach(b => b.onclick = () => { b.classList.toggle('sel'); SFX.tap(); vib(8); msg.textContent = ''; });
    $('.rc-skip', wrap).onclick = () => { msg.textContent = o.skip; SFX.err(); shake(box); };
    $('.rc-go', wrap).onclick = () => {
      const wrong = tiles.filter((b, k) => b.classList.contains('sel') && !o.tiles[k].good);
      const miss = tiles.filter((b, k) => !b.classList.contains('sel') && o.tiles[k].good);
      if (wrong.length) { msg.textContent = o.wrong; SFX.err(); shake(box); wrong.forEach(b => { b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 900); }); return; }
      if (miss.length) { msg.textContent = o.miss; SFX.err(); shake(box); miss.forEach(b => { b.classList.add('hint'); setTimeout(() => b.classList.remove('hint'), 1300); }); return; }
      SFX.coin(); vib(30); res();
    };
  });
}
async function L_captcha(i) {
  const c = lvCard(i, `<h2 class="q">Перевірка безпеки 🤖</h2><p class="sub">треба переконатися, що ти не робот</p><div id="rcw"></div>`);
  await showCard(c);
  const w = $('#rcw', c);
  await captchaRound(w, { s1: 'Виберіть усі зображення з', s2: 'найкрасивішою дівчиною', s3: 'Якщо їх немає, натисніть «Пропустити»',
    tiles: shuffle([7, 12, 14, 8, 1, 20, 4, 11, 15]).map(n => ({ n, good: true })),
    skip: 'Пропустити не вийде — вона тут на кожному фото 😌', miss: 'Ви пропустили найкрасивішу 😤 Виберіть усі.', wrong: '' });
  SFX.chime(); FX.burst(...center(w), ['✅', '💖'], 16);
  await sleep(450);
  await captchaRound(w, { s1: 'Дякуємо! Ще одна перевірка. Виберіть усі фото, де вона', s2: 'показує язик 👅', s3: 'Будьте уважні 🧐',
    tiles: shuffle([...TONGUES.map(n => ({ n, good: true })), ...[12, 7, 14].map(n => ({ n, good: false }))]),
    skip: 'Язики тут є, я точно знаю 👅', miss: 'Ви пропустили язик 👅 Уважніше!', wrong: 'А тут язика немає 🤨 (але гарна)' });
  w.innerHTML = `<div class="rc-ok"><div class="rc-check">✓</div><div><b>Перевірку пройдено.</b><br>Ви не робот. Ви — язиката киця 👅</div></div>
    <div class="tongues">${TONGUES.map((n, k) => `<div class="tg" style="${tileStyle(n)};--d:${k * .09}s;--rr:${rnd(-6, 6).toFixed(1)}deg"><i>👅</i></div>`).join('')}</div>
    <div class="react">Колекція язиків: 6 з 6 👅<br>офіційний символ наших стосунків</div>`;
  FX.burst(...center(w), ['👅', '😝', '😛', '💖'], 36); SFX.ach();
  S.ans.captcha = '6/6 язиків 👅'; save();
  scrollEnd(w.lastElementChild);
  await nextBtn(c);
  Toast.ach('Не робот', 'знайдено 6 з 6 язиків 👅', '🤖');
}

/* 5 — Бліц */
async function L_blitz(i) {
  const c = lvCard(i, `<h2 class="q">⚡ Бліц!</h2><p class="sub">5 питань · 3 секунди на кожне · не думай, тицяй</p><div id="bz"><div class="row"><button class="btn yes big" id="go">Погнали ⚡</button></div></div>`);
  await showCard(c); await waitClick($('#go', c)); SFX.pop();
  const Q = [['Обійми чи поцілунок?', '🫂 Обійми', '💋 Поцілунок', 'обидва 😌'], ['Шаверма чи піца?', '🌯 Шаверма', '🍕 Піца', 'шаверма, очевидно 🌯'],
    ['Дзвінок чи переписка?', '📱 Дзвінок', '💬 Переписка', 'дзвінок до ранку 📱'], ['Ранок чи ніч?', '☀️ Ранок', '🌙 Ніч', 'ніч, бо ти совеня 🦉'], ['Я чи шаверма?', '😳 Ти', '🌯 Ти, але з шавермою', 'ти. звісно ти ❤️']];
  const out = [], bz = $('#bz', c);
  for (let k = 0; k < Q.length; k++) {
    const [q, a, b, def] = Q[k];
    bz.innerHTML = `<div class="bq"><svg class="ring" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" class="rt"/><circle cx="32" cy="32" r="28" class="rf"/></svg><div class="bt">3</div><div class="bn">${k + 1}/5</div></div>
      <div class="bqq">${q}</div><div class="row"><button class="btn yes" data-v="${a}">${a}</button><button class="btn yes alt" data-v="${b}">${b}</button></div><div class="bres"></div>`;
    const rf = $('.rf', bz); void rf.getBoundingClientRect();
    requestAnimationFrame(() => requestAnimationFrame(() => { rf.style.transition = 'stroke-dashoffset 3s linear'; rf.style.strokeDashoffset = '176'; }));
    SFX.tick();
    const ans = await new Promise(res => {
      let left = 3; const iv = setInterval(() => { left--; if (left > 0) { $('.bt', bz).textContent = left; SFX.tick(); vib(10); } }, 1000);
      const to = setTimeout(() => { clearInterval(iv); res(null); }, 3000);
      $$('.btn', bz).forEach(btn => btn.onclick = () => { clearTimeout(to); clearInterval(iv); res(btn.dataset.v); });
    });
    $$('.btn', bz).forEach(b => b.disabled = true);
    if (ans) { SFX.pop(); out.push(ans); $('.bres', bz).textContent = pick(['записав ✓', 'так і знав ✓', 'ок ✓', 'зафіксовано ✓']); }
    else { SFX.err(); out.push(def); $('.bres', bz).textContent = '⏰ не встигла — записую: ' + def; }
    await sleep(ans ? 550 : 1500);
  }
  bz.innerHTML = `<div class="chips">${out.map((o, k) => `<span style="animation-delay:${k * .08}s">${o}</span>`).join('')}</div><div class="react">Записав. Тепер я знаю про тебе ВСЕ 📝😎</div>`;
  FX.burst(...center(bz), ['⚡', '✨', '💖'], 26); SFX.chime();
  S.ans.blitz = out; save();
  await nextBtn(c);
  Toast.ach('Блискавка', '5 відповідей за 15 секунд ⚡', '⚡');
}

/* 6 — Тіндер */
async function L_tinder(i) {
  const c = lvCard(i, `<h2 class="q">💘 Тіндер для кохання</h2><p class="sub">свайпай: вправо — ❤️ подобається, вліво — ✖ ні</p><div class="tstack" id="ts"></div>
    <div class="row tbtns" id="tb"><button class="tb no">✖</button><button class="tb yes">❤</button></div><div id="res"></div>`);
  await showCard(c);
  const D = [
    { e: '🌯', t: 'Шаверма о 23:00', s: 'з подвійним соусом' },
    { img: 13, pos: '50% 30%', t: 'Дзвінки до ночі 📱', s: 'навіть коли робиш поросятко 🐷' },
    { img: 16, pos: '50% 40%', t: 'Кататися на моїх плечах', s: 'безкоштовне таксі 🚕' },
    { e: '🐕', t: 'Чихуахуа', s: 'маленька, але злюка 😤' },
    { img: 11, pos: '62% 45%', t: 'Цілувати мене в щічку', s: 'як на цьому фото 😚' },
    { img: 5, pos: '92% 40%', t: 'Я 😎', s: 'твій хлопець · 1 шт · обміну не підлягає', me: true }
  ];
  const ts = $('#ts', c); let idx = 0, meTries = 0; const likes = [];
  const els = D.map((d, k) => {
    const el = h(`<div class="tc ${d.me ? 'me' : ''}" style="z-index:${D.length - k};${d.img ? `background-image:url(${P(d.img)});background-position:${d.pos}` : ''}">${d.e ? `<div class="em">${d.e}</div>` : ''}<div class="gr"><b>${d.t}</b><span>${d.s}</span></div><div class="st like">LIKE</div><div class="st nope">NOPE</div></div>`);
    el.style.transform = `translateY(${k * 6}px) scale(${1 - k * .03})`;
    ts.appendChild(el); return el;
  });
  await new Promise(done => {
    const top = () => els[idx];
    const layout = () => els.forEach((el, k) => { if (k >= idx) { el.style.transition = 'transform .35s cubic-bezier(.2,1.2,.3,1)'; el.style.transform = `translateY(${(k - idx) * 6}px) scale(${1 - (k - idx) * .03})`; } });
    const fly = (el, dir) => { el.style.transition = 'transform .45s ease-in, opacity .45s'; el.style.transform = `translate(${dir === 'R' ? 160 : -160}vw, -40px) rotate(${dir === 'R' ? 35 : -35}deg)`; el.style.opacity = '0'; setTimeout(() => el.remove(), 500); };
    const spring = el => { el.style.transition = 'transform .5s cubic-bezier(.2,1.6,.3,1)'; el.style.transform = 'none'; el.querySelector('.like').style.opacity = 0; el.querySelector('.nope').style.opacity = 0; };
    const decide = dir => {
      const el = top(), d = D[idx]; if (!el) return;
      if (d.me && dir === 'L') {
        meTries++; spring(el); setTimeout(() => shake(el), 60); SFX.err(); vib([40, 40]);
        Toast.info(meTries === 1 ? '🔒 Свайп вліво для цієї картки недоступний' : meTries === 2 ? 'ну киць 🥺 ну бачиш — не свайпається' : 'добре, я сам 😌');
        if (meTries >= 3) setTimeout(() => decide('R'), 700);
        return;
      }
      fly(el, dir); SFX.swipe(); vib(12); likes.push(`${d.t.replace(/ [^\s]*$/, m => /\p{Extended_Pictographic}/u.test(m) ? '' : m)} ${dir === 'R' ? '❤️' : '✖'}`);
      if (dir === 'R') FX.burst(innerWidth * .75, innerHeight * .5, ['❤️', '💚'], 8, { max: 6 });
      idx++; if (idx >= D.length) setTimeout(done, 350); else layout();
    };
    els.forEach((el, k) => {
      let sx = 0, sy = 0, dx = 0, dy = 0, drag = false;
      el.addEventListener('pointerdown', e => { if (k !== idx) return; drag = true; sx = e.clientX; sy = e.clientY; dx = dy = 0; el.setPointerCapture(e.pointerId); el.style.transition = 'none'; });
      el.addEventListener('pointermove', e => { if (!drag) return; dx = e.clientX - sx; dy = e.clientY - sy; el.style.transform = `translate(${dx}px,${dy * .4}px) rotate(${dx / 14}deg)`; el.querySelector('.like').style.opacity = clamp(dx / 90, 0, 1); el.querySelector('.nope').style.opacity = clamp(-dx / 90, 0, 1); });
      const end = () => { if (!drag) return; drag = false; if (Math.abs(dx) > 85) decide(dx > 0 ? 'R' : 'L'); else spring(el); };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    });
    $('.tb.no', c).onclick = () => { const el = top(); if (!el) return; el.querySelector('.nope').style.opacity = 1; decide('L'); };
    $('.tb.yes', c).onclick = () => { const el = top(); if (!el) return; el.querySelector('.like').style.opacity = 1; decide('R'); };
  });
  ts.remove(); $('#tb', c).remove();
  const res = $('#res', c);
  res.append(h(`<div class="match"><div class="mt">It’s a match!</div><div class="mcx"><div class="av a" style="${HER()}"></div><div class="av b" style="${HIM()}"></div><div class="mh">💘</div></div><div class="react">ви сподобались одне одному 💘<br>(хто б сумнівався)</div></div>`));
  SFX.ach(); vib([30, 50, 30]); setTimeout(() => FX.burst(...center($('.mcx', res)), HEARTS, 40, { max: 12 }), 600);
  S.ans.tinder = likes.join(', '); save();
  scrollEnd(res.lastElementChild);
  await nextBtn(c);
  Toast.ach('It’s a match', 'взаємна симпатія підтверджена 💘', '💘');
}

/* 7 — Автокорект: що б не друкувала — виходить правильна відповідь */
async function L_keyboard(i) {
  const TARGET = Array.from('ти найкращий у світі, і я тебе обожнюю 😌❤️');
  const R1 = 'йцукенгшщзхї', R2 = 'фівапролджє', R3 = 'ячсмитьбю';
  const key = k => `<button class="k" data-k="${k}">${k}</button>`;
  const c = lvCard(i, `<h2 class="q">Напиши чесно, що ти про мене думаєш ✍️</h2>
    <div class="chat"><div class="ch-h"><div class="ch-av" style="${HIM()}"></div><div><b>Твій хлопець ❤️</b><small>у мережі</small></div></div>
      <div class="ch-b" id="cb"><div class="msg in">ну шо, як тобі подарунок? 🙈</div><div class="msg in">напиши чесно, що ти про мене думаєш 👀</div></div>
      <div class="ch-in"><div class="ch-txt" id="ct"><span class="ph">Повідомлення…</span></div><button class="ch-send" id="cs">➤</button></div></div>
    <div class="kb" id="kb"><div class="kr">${[...R1].map(key).join('')}</div><div class="kr">${[...R2].map(key).join('')}</div>
      <div class="kr"><button class="k wd" data-k="⇧">⇧</button>${[...R3].map(key).join('')}<button class="k wd" data-k="⌫">⌫</button></div>
      <div class="kr"><button class="k wd" data-k="😀">😀</button><button class="k" data-k=",">,</button><button class="k sp" data-k=" ">пробіл</button><button class="k" data-k=".">.</button><button class="k wd" data-k="↵">↵</button></div></div>`);
  await showCard(c);
  const ct = $('#ct', c), cs = $('#cs', c), kb = $('#kb', c); let n = 0, extra = '', lastWarn = 0;
  const render = () => { ct.innerHTML = ''; const s = document.createElement('span'); s.textContent = TARGET.slice(0, n).join('') + extra; ct.appendChild(s); ct.appendChild(h('<span class="cur"></span>')); cs.classList.toggle('ready', n >= TARGET.length); };
  await new Promise(done => {
    kb.addEventListener('click', e => {
      const b = e.target.closest('.k'); if (!b) return; const k = b.dataset.k;
      b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 120);
      if (k === '⌫') { SFX.err(); shake(ct.parentElement); vib(30); if (Date.now() - lastWarn > 1500) { lastWarn = Date.now(); Toast.info('⌫ Видаляти не можна — автокорект вже все вирішив 😌'); } return; }
      if (k === '↵') { cs.click(); return; }
      SFX.key(); vib(5);
      if (n < TARGET.length) n = Math.min(TARGET.length, n + 3); else if (extra.length < 12) extra += '❤️';
      render();
    });
    cs.onclick = () => {
      if (n < TARGET.length) { shake(ct.parentElement); SFX.err(); if (Date.now() - lastWarn > 1500) { lastWarn = Date.now(); Toast.info('допиши спочатку 😏'); } return; }
      SFX.swipe(); done();
    };
  });
  const cb = $('#cb', c); const text = TARGET.join('') + extra;
  cb.append(h(`<div class="msg out">${text}<small>✓✓ прочитано</small></div>`)); ct.innerHTML = '<span class="ph">Повідомлення…</span>'; cs.classList.remove('ready'); kb.style.opacity = .35; kb.style.pointerEvents = 'none';
  cb.scrollTop = 1e5; await sleep(700);
  const ty = h(`<div class="msg in typing"><i></i><i></i><i></i></div>`); cb.append(ty); cb.scrollTop = 1e5; await sleep(1600); ty.remove();
  cb.append(h(`<div class="msg in">я так і знав 🥹</div>`)); SFX.pop(); cb.scrollTop = 1e5; await sleep(700);
  cb.append(h(`<div class="msg in">я тебе теж ❤️❤️❤️</div>`)); SFX.chime(); cb.scrollTop = 1e5;
  FX.burst(...center(cb), HEARTS, 30); vib([20, 40, 20]);
  kb.remove();
  c.append(h(polaroid(P(4), 'ти, коли пишеш мені щось миле 💻🥹', { r: 2 })));
  S.ans.typed = text; save();
  await nextBtn(c);
  Toast.ach('Чесна відповідь', 'автокорект не бреше ✍️', '✍️');
}

/* 8 — Машина часу до 2076 */
async function L_time(i) {
  const MS = [[2026, 'ми зараз: ти показуєш язик, я роблю вигляд, що мені все одно 😐'], [2030, 'перша спільна квартира 🏠 і окрема полиця для шаверми 🌯'],
    [2038, 'досі сперечаємось, хто перший заснув на дзвінку 😴'], [2050, 'ти все ще найкрасивіша, а я дивлюсь на тебе, як уперше 🥹'],
    [2064, 'онуки питають, хто такий бульдог 🐶'], [2076, 'а я все ще твій 👴❤️']];
  const c = lvCard(i, `<h2 class="q">⏳ Машина часу</h2><p class="sub">тягни повзунок — подивимось, якими ми будемо</p>
    <div class="tm"><div class="tm-year" id="ty">2026</div><div class="tm-ph"><img id="tn" src="${P(18)}" style="object-position:40% 50%"><img id="tf" src="${P(23)}" style="object-position:50% 40%"></div>
    <div class="tm-txt" id="tt">${MS[0][1]}</div><input type="range" min="0" max="1000" value="0" step="1" id="tr" class="tm-range"></div><div id="res"></div>`);
  await showCard(c);
  const tr = $('#tr', c), ty = $('#ty', c), tn = $('#tn', c), tf = $('#tf', c), tt = $('#tt', c); let mx = 0, lastY = 2026, lastWarn = 0, ms = 0;
  await new Promise(done => {
    tr.addEventListener('input', () => {
      let v = +tr.value;
      if (v < mx) { v = mx; tr.value = mx; if (Date.now() - lastWarn > 1800) { lastWarn = Date.now(); Toast.info('у минуле не можна — тільки вперед, разом ⏩'); SFX.err(); vib(25); } }
      mx = v; const y = 2026 + Math.round(v / 1000 * 50);
      tr.style.setProperty('--p', v / 10 + '%');
      if (y !== lastY) { lastY = y; ty.textContent = y; if (y % 2 === 0) SFX.tick(); }
      tn.style.filter = `sepia(${(v / 1000 * .8).toFixed(2)}) contrast(${(1 + v / 5000).toFixed(2)}) saturate(${(1 - v / 2500).toFixed(2)})`;
      tf.style.opacity = smooth(760, 960, v).toFixed(3);
      let k = 0; MS.forEach((m, j) => { if (y >= m[0]) k = j; });
      if (k !== ms) { ms = k; tt.classList.add('swap'); setTimeout(() => { tt.textContent = MS[k][1]; tt.classList.remove('swap'); }, 220); SFX.pop(); vib(10); }
      if (v >= 1000) { tr.disabled = true; done(); }
    });
  });
  ty.classList.add('glow'); SFX.chime(); vib([30, 40, 30]); FX.burst(...center(tf), ['👴', '👵', '❤️', '✨', '🧔'], 30);
  const res = $('#res', c);
  res.append(h(`<h2 class="q" style="margin-top:14px">Будеш мене любити отаким? 👴</h2>`));
  const row = h(`<div class="row"><button class="btn yes" data-v="Так 👵❤️">Так 👵❤️</button><button class="btn yes alt" data-v="Ще більше 😍">Ще більше 😍</button></div>`); res.append(row);
  scrollEnd(row);
  const v = await new Promise(r => $$('button', row).forEach(b => b.onclick = () => r(b.dataset.v)));
  row.remove(); SFX.pop(); FX.burst(...center(res), HEARTS, 26);
  res.append(h(`<div class="react">Домовились: до 2076 і далі ♾️</div>`));
  S.ans.future = v; save();
  scrollEnd(res.lastElementChild);
  await nextBtn(c);
  Toast.ach('Разом до 2076', 'довгострокові відносини 👴👵', '⏳');
}

/* 9 — Пазл */
async function L_puzzle(i) {
  const c = lvCard(i, `<h2 class="q">🧩 Збери нас докупи</h2><p class="sub">тицяй на шматочки, щоб повернути. зелені — вже на місці</p>
    <div class="puz" id="pz"></div><div class="row" id="pzb"><button class="btn ghost" id="gu">здаюсь 🥺</button></div><div id="res"></div>`);
  await showCard(c);
  const pz = $('#pz', c), rot = []; const fixed = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 2);
  const tiles = [];
  for (let k = 0; k < 9; k++) {
    const t = document.createElement('div'); t.className = 'tile';
    t.style.backgroundImage = `url(${P(11)})`; t.style.backgroundPosition = `${(k % 3) * 50}% ${Math.floor(k / 3) * 50}%`;
    rot[k] = fixed.includes(k) ? 0 : pick([90, 180, 270]); t.style.transform = `rotate(${rot[k]}deg)`; if (rot[k] % 360 === 0) t.classList.add('ok');
    pz.appendChild(t); tiles.push(t);
  }
  await new Promise(done => {
    let solved = false;
    const win = () => { if (solved) return; solved = true; done(); };
    tiles.forEach((t, k) => t.onclick = () => {
      if (solved) return; rot[k] += 90; t.style.transform = `rotate(${rot[k]}deg)`; SFX.tap(); vib(6);
      const ok = rot[k] % 360 === 0; t.classList.toggle('ok', ok); if (ok) SFX.tick();
      if (rot.every(r => r % 360 === 0)) setTimeout(win, 380);
    });
    $('#gu', c).onclick = () => { tiles.forEach((t, k) => { rot[k] = Math.ceil(rot[k] / 360) * 360; t.style.transform = `rotate(${rot[k]}deg)`; t.classList.add('ok'); }); $('#res', c).dataset.giveup = 1; SFX.whoosh(); setTimeout(win, 450); };
  });
  pz.classList.add('done'); $('#pzb', c).remove(); SFX.chime(); vib([20, 40, 20]);
  FX.burst(...center(pz), ['🧩', '💞', '❤️', '✨'], 34);
  const gu = $('#res', c).dataset.giveup;
  $('#res', c).append(h(`<div class="react">${gu ? 'я зібрав за тебе, бо я завжди поруч 🫶' : 'ми складаємось ідеально 💞'}</div>`));
  scrollEnd($('#res', c).lastElementChild);
  await nextBtn(c);
  Toast.ach('Ідеальна пара', 'складаємось ідеально 🧩', '🧩');
}

/* 10 — Меморі */
async function L_memory(i) {
  const c = lvCard(i, `<h2 class="q">🃏 Знайди пари</h2><p class="sub">перевіримо, чи впізнаєш себе 😏</p><div class="mem" id="mem"></div><div class="moves" id="mv">ХОДИ: 0</div><div id="res"></div>`);
  await showCard(c);
  const imgs = [13, 17, 10, 16, 23, 18], tags = { 13: '🐷', 17: '👅', 10: '😝', 16: '🚕', 23: '👴', 18: '😛' };
  const deck = shuffle([...imgs, ...imgs]), mem = $('#mem', c); let open = [], found = 0, busy = false, moves = 0;
  await new Promise(done => {
    deck.forEach(n => {
      const card = h(`<div class="mc" data-n="${n}"><div class="in"><div class="f">🦊</div><div class="b" style="background-image:url(${T(n)})"></div></div></div>`);
      card.onclick = async () => {
        if (busy || card.classList.contains('flip')) return; card.classList.add('flip'); open.push(card); SFX.tap(); vib(6);
        if (open.length < 2) return;
        busy = true; moves++; $('#mv', c).textContent = 'ХОДИ: ' + moves; const [a, b] = open; open = [];
        if (a.dataset.n === b.dataset.n) {
          await sleep(250); a.classList.add('ok'); b.classList.add('ok'); SFX.coin(); FX.burst(...center(b), [tags[n] || '💖', '✨', '💖'], 12, { max: 6 }); found++; busy = false;
          if (found === imgs.length) setTimeout(done, 500);
        } else { await sleep(800); a.classList.remove('flip'); b.classList.remove('flip'); busy = false; }
      };
      mem.appendChild(card);
    });
  });
  SFX.chime(); FX.burst(...center(mem), ['🧠', '🃏', '💖', '✨'], 30);
  $('#res', c).append(h(`<div class="react">Всі пари за ${moves} ходів! 🧠<br>на кожній картці — найкрасивіша 😍</div>`));
  S.ans.memory = moves; save();
  scrollEnd($('#res', c).lastElementChild);
  await nextBtn(c);
  Toast.ach('Пам’ять як у слона', `усі пари за ${moves} ходів 🐘`, '🐘');
}

/* 11 — Колесо фортуни */
async function L_wheel(i) {
  const SEG = [['🌯', 'Шаверма', '#ff8a3d', '#fff'], ['🎬', 'Кіно+обійми', '#ff4f8b', '#fff'], ['🌙', 'Гуляти вночі', '#5a1532', '#ffd9c7'], ['📱', 'Дзвінок до ранку', '#ffc2a1', '#5a1532'],
    ['💋', 'Цілуватись', '#c2367a', '#fff'], ['🚕', 'Плечі-таксі', '#ffb066', '#5a1532'], ['😴', 'Спати до обіду', '#7a2350', '#ffd9c7'], ['🍳', 'Готувати разом', '#ff6b6b', '#fff']];
  const R = 140, pt = a => [R * Math.sin(a * Math.PI / 180), -R * Math.cos(a * Math.PI / 180)];
  const sectors = SEG.map((s, k) => {
    const a0 = k * 45 - 22.5, a1 = k * 45 + 22.5, [x0, y0] = pt(a0), [x1, y1] = pt(a1);
    return `<path d="M0 0 L${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z" fill="${s[2]}" stroke="rgba(255,255,255,.35)" stroke-width="1.5"/>
      <g transform="rotate(${k * 45})"><text y="-114" text-anchor="middle" dominant-baseline="middle" font-size="22">${s[0]}</text>
      <text transform="translate(0 -66) rotate(-90)" text-anchor="middle" dominant-baseline="middle" font-size="10.5" font-weight="700" fill="${s[3]}" font-family="Rubik,sans-serif">${s[1]}</text></g>`;
  }).join('');
  const c = lvCard(i, `<h2 class="q">🎡 Крути колесо: що робимо на вихідних?</h2><p class="sub">колесо фортуни ніколи не бреше</p>
    <div class="wheelw"><div class="ptr" id="ptr"></div><svg viewBox="-150 -150 300 300"><circle r="148" fill="#2a0c1e" stroke="#fffaf4" stroke-width="5"/><g id="wg">${sectors}</g>
    ${Array.from({ length: 16 }, (_, k) => { const [x, y] = [145 * Math.sin(k * 22.5 * Math.PI / 180), -145 * Math.cos(k * 22.5 * Math.PI / 180)]; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#ffd27a"/>`; }).join('')}</svg><div class="hub">🦊</div></div>
    <div class="wres" id="wr"></div><div class="plan" id="pl"></div><div class="row"><button class="btn yes big" id="sp">Крутити! 🎡</button></div><div id="res"></div>`);
  await showCard(c);
  const wg = $('#wg', c), ptr = $('#ptr', c), wr = $('#wr', c), pl = $('#pl', c), sp = $('#sp', c);
  let rot = 0, spins = 0; const got = [];
  const spin = () => new Promise(res => {
    let v = rnd(820, 1250), last = performance.now(), lastSeg = Math.floor((rot + 22.5) / 45);
    const step = now => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      rot += v * dt; v *= Math.pow(.42, dt); v -= 22 * dt;
      wg.setAttribute('transform', `rotate(${rot.toFixed(2)})`);
      const seg = Math.floor((rot + 22.5) / 45); if (seg !== lastSeg) { lastSeg = seg; SFX.tick(); ptr.classList.remove('tk'); void ptr.offsetWidth; ptr.classList.add('tk'); if (v > 200) vib(3); }
      if (v <= 6) { const k = ((Math.round(-rot / 45) % 8) + 8) % 8; res(k); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  let first = true;
  await new Promise(done => {
    sp.onclick = async () => {
      sp.disabled = true; wr.textContent = ''; SFX.whoosh();
      const k = await spin(); spins++;
      const s = SEG[k]; got.push(s[0] + ' ' + s[1]); wr.textContent = `Випало: ${s[0]} ${s[1]}!`; SFX.chime(); vib([20, 30, 20]);
      FX.burst(...center($('.wheelw', c)), [s[0], '✨', '❤️'], 24);
      pl.innerHTML = got.map(g => `<span>${g}</span>`).join('');
      sp.disabled = false; sp.textContent = 'Ще раз! 🎡';
      if (first) { first = false; $('#res', c).append(h(`<div class="react small">Домовились! Записав у календар 📅</div>`)); done(); }
    };
  });
  S.ans.wheel = got; save();
  await nextBtn(c);
  S.ans.wheel = got; save();
  Toast.ach('Азартна', 'плани на вихідні готові 🎡', '🎡');
}

/* 12 — Скретч-лотерея */
async function L_scratch(i) {
  const c = lvCard(i, `<h2 class="q">🎰 Миттєва лотерея!</h2><p class="sub">зітри пальчиком захисний шар</p>
    <div class="ticket"><div class="tk-top"><span>ЛОТЕРЕЯ «КОХАННЯ»</span><span>№ 000001</span></div>
      <div class="tk-area"><div class="tk-prize"><img src="${P(16)}" alt=""><div class="tk-lbl">ГОЛОВНИЙ ПРИЗ 🏆<b>персональне таксі на плечах 🚕</b>безлімітне · діє назавжди</div></div><canvas class="tk-cv" id="cv"></canvas></div>
      <div class="tk-bottom" id="tkb">шанс виграти: 100% 😌</div></div><div id="res"></div>`);
  await showCard(c);
  const cv = $('#cv', c); await sleep(60);
  const r = cv.getBoundingClientRect(), D = Math.min(devicePixelRatio || 1, 2);
  cv.width = Math.round(r.width * D); cv.height = Math.round(r.height * D);
  const g = cv.getContext('2d');
  const gr = g.createLinearGradient(0, 0, cv.width, cv.height); gr.addColorStop(0, '#d9a441'); gr.addColorStop(.35, '#ffe9a8'); gr.addColorStop(.6, '#c8902e'); gr.addColorStop(1, '#ffdf8a');
  g.fillStyle = gr; g.fillRect(0, 0, cv.width, cv.height);
  for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '120,70,10'},${rnd(.05, .18)})`; g.fillRect(rnd(0, cv.width), rnd(0, cv.height), 2 * D, 2 * D); }
  g.save(); g.translate(cv.width / 2, cv.height / 2); g.rotate(-.35); g.fillStyle = 'rgba(110,60,10,.35)'; g.font = `800 ${20 * D}px Unbounded, Rubik, sans-serif`; g.textAlign = 'center';
  for (let y = -cv.height; y < cv.height; y += 46 * D) g.fillText('ЗІТРИ ✨ ЗІТРИ ✨ ЗІТРИ', 0, y); g.restore();
  g.fillStyle = 'rgba(90,21,50,.85)'; g.font = `700 ${34 * D}px Caveat, cursive`; g.textAlign = 'center'; g.fillText('зітри мене 👆', cv.width / 2, cv.height / 2);
  g.globalCompositeOperation = 'destination-out'; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 46 * D;
  const small = document.createElement('canvas'); small.width = 40; small.height = 50; const sg = small.getContext('2d', { willReadFrequently: true });
  await new Promise(done => {
    let down = false, lx = 0, ly = 0, moves = 0, lastS = 0, fin = false;
    const pos = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * D, (e.clientY - b.top) * D]; };
    const check = () => { sg.clearRect(0, 0, 40, 50); sg.drawImage(cv, 0, 0, 40, 50); const d = sg.getImageData(0, 0, 40, 50).data; let clr = 0; for (let k = 3; k < d.length; k += 4) if (d[k] < 60) clr++; return clr / 2000; };
    cv.addEventListener('pointerdown', e => { down = true; cv.setPointerCapture(e.pointerId); [lx, ly] = pos(e); g.beginPath(); g.arc(lx, ly, 23 * D, 0, 7); g.fill(); });
    cv.addEventListener('pointermove', e => {
      if (!down || fin) return; const [x, y] = pos(e); g.beginPath(); g.moveTo(lx, ly); g.lineTo(x, y); g.stroke(); lx = x; ly = y;
      const now = performance.now(); if (now - lastS > 70) { lastS = now; SFX.scratch(); vib(4); }
      if (++moves % 8 === 0 && check() > .5) { fin = true; done(); }
    });
    const up = () => { down = false; if (!fin && check() > .5) { fin = true; done(); } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  });
  cv.classList.add('gone'); SFX.coin(); setTimeout(SFX.ach, 250); vib([30, 50, 30, 50, 80]);
  $('#tkb', c).textContent = '🎉 ДЖЕКПОТ! 🎉';
  FX.burst(...center($('.tk-area', c)), ['🪙', '💰', '🎉', '✨', '❤️'], 50, { max: 12 }); FX.rain(['🪙', '✨', '🎉'], 1800, 3);
  $('#res', c).append(h(`<div class="react">Ти виграла таксі, яке ще й тебе любить 🚕❤️<br><span style="font-size:20px;opacity:.85">(а я виграв тебе 😎)</span></div>`));
  scrollEnd($('#res', c).lastElementChild);
  await nextBtn(c);
  Toast.ach('Джекпот', 'виграно персональне таксі 🚕', '🎰');
}

/* 13 — Скільки поцілунків винна */
async function L_kisses(i) {
  const c = lvCard(i, `<h2 class="q">💋 Скільки поцілунків ти мені винна?</h2><div class="kiss-n" id="kn">100</div><div class="react small" id="kt">чесно-чесно?</div>
    <div class="row" id="kr"><button class="btn ghost" id="less">менше ➖</button><button class="btn yes" id="ok">чесно ✅</button></div>
    <div id="res">${polaroid(P(11), '📸 доказ №1: борг повертається 😚', { r: 3 })}</div>`);
  await showCard(c);
  let k = 100, shown = 100; const kn = $('#kn', c), kt = $('#kt', c);
  const lines = ['ой, порахував неправильно 🤭', 'калькулятор каже більше 🧮', 'з відсотками 📈', 'інфляція 💸', 'а за вчора? 😤', 'ну ти ж сама натиснула', 'пеня за прострочку ⏰', 'курс поцілунка виріс 📊'];
  let animT = 0;
  const animate = to => { const from = shown, t0 = performance.now(); cancelAnimationFrame(animT); const st = now => { const p = Math.min(1, (now - t0) / 500); shown = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); kn.textContent = fmt(shown); if (p < 1) animT = requestAnimationFrame(st); }; animT = requestAnimationFrame(st); };
  let n = 0;
  $('#less', c).onclick = e => {
    n++; k = Math.round(k * rnd(1.45, 2.2)); animate(k); kt.textContent = lines[(n - 1) % lines.length];
    kn.classList.remove('bump'); void kn.offsetWidth; kn.classList.add('bump'); FX.burst(...center(kn), ['💋', '😘'], 10, { max: 6 }); SFX.coin(); vib(15);
    e.currentTarget.style.transform = `scale(${Math.max(.55, 1 - n * .07)})`;
  };
  await waitClick($('#ok', c));
  $('#kr', c).remove(); SFX.chime(); vib([20, 30, 20]);
  kt.textContent = 'віддаси при зустрічі 😘 я записав 📝'; FX.rain(['💋', '😘', '💋', '❤️'], 2200, 3);
  S.ans.kisses = fmt(k); save();
  await nextBtn(c);
  Toast.ach('Боржниця', `${fmt(k)} поцілунків 💋`, '💋');
}

/* 14 — Вхідний відеодзвінок */
async function L_call(i) {
  const c = lvCard(i, `<h2 class="q">📞 Хвилинку…</h2><p class="sub">тобі хтось дзвонить</p><div style="font-size:60px;margin:10px 0;animation:wob .5s infinite">📱</div>`);
  await showCard(c); await sleep(900);
  document.body.classList.add('incall');
  const o = h(`<div class="call"><div class="call-bg" style="background-image:url(${P(16)})"></div>
    <div class="call-top"><div class="call-av" style="${HIM()}"></div><div class="call-name">Твій хлопець ❤️</div><div class="call-st">вхідний відеодзвінок…</div></div>
    <div class="call-act"><button class="cbtn no"><i>📵</i><span>Відхилити</span></button><button class="cbtn yes"><i>📞</i><span>Прийняти</span></button></div></div>`);
  $('#layer').appendChild(o);
  let ringing = true; const ringLoop = async () => { while (ringing) { SFX.ring(); vib([300, 150, 300]); await sleep(1800); } }; ringLoop();
  const no = $('.cbtn.no', o), yes = $('.cbtn.yes', o); let tries = 0;
  const NO = ['не-а 😝', 'не вийде', 'ну візьми 🥺'];
  await new Promise(done => {
    const flee = e => {
      e.preventDefault(); e.stopPropagation();
      if (tries >= 3) { done(); return; }
      tries++; SFX.whoosh(); vib(15);
      const r = no.getBoundingClientRect(); if (!no.classList.contains('runner')) { o.appendChild(no); no.classList.add('runner'); no.style.left = r.left + 'px'; no.style.top = r.top + 'px'; void no.offsetWidth; }
      no.style.left = rnd(20, innerWidth - 110) + 'px'; no.style.top = rnd(innerHeight * .35, innerHeight * .7) + 'px';
      $('span', no).textContent = NO[tries - 1];
      if (tries >= 3) { $('i', no).textContent = '📞'; $('i', no).style.background = '#34c759'; $('span', no).textContent = 'Прийняти 😌'; }
    };
    no.addEventListener('pointerdown', flee); no.addEventListener('click', e => { e.preventDefault(); });
    yes.onclick = done;
  });
  ringing = false; SFX.pop(); vib(30);
  const SL = [[13, 'коли ти робиш поросятко 🐷 — моє улюблене'], [1, 'коли ти просто лежиш, а я не можу відвести очей'], [2, 'а коли ти засинаєш — я ще довго не скидаю 😴❤️']];
  o.innerHTML = `<div class="vcall"><img id="vi" src="${P(SL[0][0])}"><div class="vtop"><b>Твій хлопець ❤️</b><span id="vt">00:00</span></div>
    <div class="vdots">${SL.map((_, k) => `<span class="${k ? '' : 'on'}"></span>`).join('')}</div><div class="vcap" id="vc">${SL[0][1]}</div>
    <button class="cbtn vend" id="ve" style="display:none"><i>📵</i><span>Завершити</span></button></div>`;
  let sec = 0; const tim = setInterval(() => { sec++; const el = $('#vt', o); if (el) el.textContent = `00:${String(sec).padStart(2, '0')}`; }, 1000);
  for (let k = 1; k < SL.length; k++) {
    await Promise.race([sleep(3800), waitClick(o)]);
    const vi = $('#vi', o); vi.style.opacity = 0; await sleep(350); vi.src = P(SL[k][0]); vi.style.opacity = 1;
    $$('.vdots span', o).forEach((s, j) => s.classList.toggle('on', j <= k));
    const vc = $('#vc', o); vc.remove(); o.querySelector('.vcall').appendChild(h(`<div class="vcap" id="vc">${SL[k][1]}</div>`)); SFX.tap();
  }
  await sleep(1400);
  const ve = $('#ve', o); ve.style.display = ''; await waitClick(ve);
  clearInterval(tim); SFX.pop(); o.style.transition = 'opacity .5s'; o.style.opacity = 0; await sleep(500); o.remove(); document.body.classList.remove('incall');
  $('.q', c).textContent = '📞 Дзвінок завершено'; $('.sub', c).textContent = `тривалість: ${sec} сек · найкращі ${sec} секунд дня`;
  c.querySelector('div[style]').textContent = '🥹';
  FX.burst(...center(c), HEARTS, 26);
  await nextBtn(c);
  Toast.ach('Соня на дзвінку', 'дзвінок прийнято 😴', '📞');
}

/* 15 — Оціни свого хлопця */
async function L_stars(i) {
  const c = lvCard(i, `<h2 class="q">⭐ Оціни свого хлопця</h2><p class="sub">чесно і неупереджено</p>${polaroid(P(19), 'досліджуваний об’єкт 🔬', { r: -2 })}
    <div class="stars" id="st">${Array.from({ length: 5 }, (_, k) => `<button class="star" data-k="${k + 1}">★</button>`).join('')}</div><div class="score" id="sc"></div><div id="res"></div>`);
  await showCard(c);
  const st = $('#st', c), sc = $('#sc', c);
  const k = await new Promise(r => $$('.star', st).forEach(b => b.onclick = () => r(+b.dataset.k)));
  const stars = $$('.star', st); stars.forEach(b => b.onclick = null);
  for (let j = 0; j < k; j++) { stars[j].classList.add('on'); SFX.tap(); await sleep(90); }
  if (k < 5) { sc.textContent = `${k}/5? 🤨`; SFX.err(); vib(40); await sleep(900); sc.textContent = 'відправлено на перерахунок… 🔄'; await sleep(1200); }
  for (let j = k; j < 5; j++) { stars[j].classList.add('on'); SFX.tap(); await sleep(140); }
  for (let j = 5; j < 10; j++) { const s = h(`<button class="star on extra">★</button>`); st.appendChild(s); SFX.sparkle(); vib(8); sc.textContent = `${j + 1}/5`; await sleep(220); }
  sc.textContent = '10/5 ⭐'; SFX.ach(); FX.burst(...center(st), ['⭐', '🌟', '✨', '💛'], 40);
  $('#res', c).append(h(`<div class="react">Система зламалась від захвату 💥<br>Нагорода «Найкращий хлопець року» вручена 🏆</div>`));
  S.ans.rating = k < 5 ? `10/5 (сама поставила ${k}, але система перерахувала 😌)` : '10/5 ⭐'; save();
  scrollEnd($('#res', c).lastElementChild);
  await nextBtn(c);
  Toast.ach('Справедлива оцінка', '10 з 5 ⭐', '⭐');
}

/* 16 — Подарунок і купони */
async function L_gift(i) {
  const C = [['🫂', 'Безлімітні обійми', 'діє 24/7, без вихідних і перерв на обід'], ['🌯', 'Шаверма за мій рахунок', 'будь-коли, навіть о третій ночі'],
    ['🙊', 'Одне «ти права» без суперечок', 'використовувати з розумом 😏'], ['📱', 'Дзвінок до ранку', 'навіть якщо заснеш першою'], ['👑', 'День, коли я роблю все, що скажеш', 'в межах розумного (майже)']];
  const c = lvCard(i, `<h2 class="q">🎁 Тут для тебе подарунок</h2><p class="sub">тицьни 3 рази, щоб відкрити</p>
    <div class="giftw" id="gw"><div class="rays"></div><div class="gift" id="gf"><div class="lid"><div class="bow">🎀</div></div><div class="box"></div></div></div><div id="res"></div>`);
  await showCard(c);
  const gf = $('#gf', c), gw = $('#gw', c); let taps = 0;
  await new Promise(done => gf.onclick = () => {
    taps++; gf.classList.remove('wob'); void gf.offsetWidth; gf.classList.add('wob'); SFX.pop(); vib(20);
    FX.burst(...center(gf), ['✨', '⭐'], 6, { max: 4 });
    if (taps >= 3) { gf.onclick = null; done(); }
  });
  gw.classList.add('open'); SFX.boom(); setTimeout(SFX.chime, 200); vib([30, 40, 80]); flash(.5);
  FX.burst(...center(gf), ['🎉', '🎊', '❤️', '✨', '🎟️'], 60, { max: 14 });
  await sleep(900);
  $('.sub', c).textContent = 'гортай купони 👉';
  const res = $('#res', c);
  res.append(h(`<div class="coupons">${C.map((x, k) => `<div class="coupon" style="--d:${k * .12}s"><div class="cn">№ 00${k + 1}</div><div class="ce">${x[0]}</div><div class="ct">${x[1]}</div><div class="cd">${x[2]}</div><div class="cs">дійсний назавжди ♾️</div></div>`).join('')}</div>`));
  res.append(h(`<div class="cdots">${C.map((_, k) => `<i class="${k ? '' : 'on'}"></i>`).join('')}</div>`));
  res.append(h(`<div class="react small">щоб використати — зроби скрін і покажи мені 📸</div>`));
  const cps = $('.coupons', res), dots = $$('.cdots i', res);
  cps.addEventListener('scroll', () => { const w = cps.firstElementChild.offsetWidth + 12; const k = Math.round(cps.scrollLeft / w); dots.forEach((d, j) => d.classList.toggle('on', j === k)); }, { passive: true });
  gw.style.height = '0'; gw.style.overflow = 'hidden'; gw.style.transition = 'height .6s';
  scrollEnd(res.lastElementChild);
  await nextBtn(c);
  Toast.ach('Багачка', '5 купонів отримано 🎟️', '🎟️');
}

/* 17 — Будеш моєю назавжди? */
async function L_final(i) {
  const c = lvCard(i, `<div class="ring-emoji">💍</div><h2 class="q" style="font-size:30px">Будеш моєю <em>назавжди</em>?</h2><p class="sub">останнє питання. найважливіше.</p>
    <div class="final-btns" id="fb"><button class="btn yes big" id="fy">Так ❤️</button><button class="btn ghost" id="fn">Ні</button></div>`);
  await showCard(c);
  const fy = $('#fy', c), fn = $('#fn', c);
  const T = ['ти впевнена? 🤨', 'подумай ще 🥺', 'киць…', 'ну пліз 🙏', 'я зараз заплачу 😭', 'останній шанс 😤', 'ок, тоді ТАК ❤️'];
  let n = 0, sY = 1;
  await new Promise(done => {
    fy.onclick = done;
    fn.onclick = () => {
      if (n >= T.length - 1) { done(); return; }
      fn.textContent = T[n]; n++; SFX.sad(); vib(35);
      sY = Math.min(40, 20 + n * 3.2); fy.style.fontSize = sY + 'px'; fy.style.padding = `${18 + n * 2}px ${30 + n * 5}px`; fn.style.transform = `scale(${Math.max(.6, 1 - n * .07)})`;
      FX.burst(...center(fn), ['🥺', '💔'], 4, { max: 4 });
      if (n === T.length - 1) { fn.textContent = T[n]; fn.className = 'btn yes alt big'; fn.style.transform = ''; SFX.chime(); }
    };
  });
  S.ans.forever = 'ТАК 💍'; save();
  await sleep(100);
}

const LEVELS = [
  { icon: '🐶', run: L_dogs }, { icon: '🔴', run: L_redwhite }, { icon: '🌯', run: L_shawarma }, { icon: '🤖', run: L_captcha },
  { icon: '⚡', run: L_blitz }, { icon: '💘', run: L_tinder }, { icon: '✍️', run: L_keyboard }, { icon: '⏳', run: L_time },
  { icon: '🧩', run: L_puzzle }, { icon: '🃏', run: L_memory }, { icon: '🎡', run: L_wheel }, { icon: '🎰', run: L_scratch },
  { icon: '💋', run: L_kisses }, { icon: '📞', run: L_call }, { icon: '⭐', run: L_stars }, { icon: '🎁', run: L_gift }, { icon: '💍', run: L_final }
];

/* =====================================================================
   ФІНАЛ: фільм під біт → лист → титри → фінальний екран
   ===================================================================== */
const FILM = [[15, 'ми ❤️'], [16, 'моє улюблене таксі — це я 🚕'], [12, 'ця посмішка — мій улюблений вид 🥹'], [11, 'найкращий будильник 😚'],
  [13, 'поросятко моє 🐷'], [17, '👅 офіційний символ наших стосунків'], [19, 'наші вечори 💜'], [3, 'синій язик — теж ти 💙'],
  [7, 'і ці веснянки ✨'], [14, 'і цей погляд 🤨'], [2, 'і навіть коли ти спиш на дзвінку 😴'], [23, 'і через 50 років теж 👴'],
  [9, 'навіть намальовані ми гарні ✏️'], [18, 'ти і я. завжди.']];
async function film() {
  document.body.classList.add('filming', 'nocaps'); HUD.hide();
  const f = h(`<div class="film"><div class="fl-a"></div><div class="fl-b"></div><div class="fl-shade"></div><div class="fl-bars"></div>
    <div class="fl-title"><small>фільм</small><b>«МИ»</b><span>у головних ролях: ти і я</span></div><div class="fl-cap" id="fc"></div><div class="fl-count" id="fco"></div><button class="fl-skip">пропустити ⏭</button></div>`);
  $('#layer').appendChild(f); await sleep(40); f.classList.add('on');
  let skip = false; $('.fl-skip', f).onclick = () => { skip = true; SFX.pop(); };
  SFX.whoosh(); await waitBars(2, () => skip);
  $('.fl-title', f).classList.add('gone');
  const Ls = [$('.fl-a', f), $('.fl-b', f)]; let cur = 0;
  for (let k = 0; k < FILM.length && !skip; k++) {
    const [n, cap] = FILM[k], L = Ls[cur];
    L.style.backgroundImage = `url(${P(n)})`; L.className = (cur ? 'fl-b' : 'fl-a') + ' show kb' + (k % 4);
    Ls[1 - cur].classList.remove('show'); cur = 1 - cur;
    const fc = $('#fc', f); fc.classList.remove('on'); setTimeout(() => { fc.textContent = cap; fc.classList.add('on'); }, 250);
    $('#fco', f).textContent = `${String(k + 1).padStart(2, '0')} / ${FILM.length}`;
    if (k % 3 === 2) FX.float(HEARTS, 3);
    await waitBars(2, () => skip);
  }
  f.classList.add('end'); await sleep(850); f.remove(); document.body.classList.remove('filming');
}
async function letter() {
  document.body.classList.add('filming', 'nocaps');
  const L = h(`<div class="letterw"><div class="paper"><div class="ltxt" id="lt"></div><div class="lsig" id="ls"></div></div><div class="row" id="lr"></div></div>`);
  $('#layer').appendChild(L); await sleep(40); L.classList.add('on');
  let fast = false; L.addEventListener('click', () => fast = true);
  await sleep(900);
  const lt = $('#lt', L); let cnt = 0;
  for (const para of CFG.letter) {
    const p = document.createElement('p'); lt.appendChild(p);
    for (const ch of Array.from(para)) { p.textContent += ch; if (!fast) { if (ch !== ' ' && ++cnt % 2) SFX.key(); await sleep(/[.,!?…]/.test(ch) ? 150 : 34); } }
    if (!fast) await sleep(320);
    L.scrollTop = 1e5;
  }
  $('#ls', L).textContent = CFG.sign; SFX.chime(); FX.burst(...center($('.paper', L)), HEARTS, 30);
  const b = h(`<button class="btn yes big">🎬 Титри</button>`); $('#lr', L).appendChild(b); L.scrollTop = 1e5;
  await waitClick(b); SFX.pop();
  L.classList.remove('on'); await sleep(700); L.remove(); document.body.classList.remove('filming');
}
async function credits() {
  document.body.classList.add('filming', 'nocaps');
  const it = [['', '🎬', 'big'], ['У головній ролі', 'Рижа Киця 🦊'], ['p', 16, -3], ['Режисер', 'твій хлопець'], ['Сценарій', 'теж він 😎'], ['p', 11, 3],
    ['Музика', 'Alec Benjamin — «Water Fountain»'], ['Спецефекти', `сердечка і смайлики ❤️ (${fmt(S.hearts)} шт.)`], ['p', 13, -2],
    ['Каскадер', 'кнопка «Ні» (сильно постраждала)'], ['Кейтеринг', 'шавермна за рогом 🌯'], ['Консультанти', 'чихуахуа і бульдог 🐶'], ['p', 23, 2],
    ['Перевірка безпеки', 'капча: 6/6 язиків 👅'], ['Фінансовий відділ', `борг: ${S.ans.kisses || '∞'} поцілунків 💋`], ['Оцінка режисеру', '10/5 ⭐'], ['p', 15, -2],
    ['', 'Жодна киця не постраждала під час зйомок 🐾'], ['', 'Знято з любов’ю ❤️']];
  const cr = h(`<div class="credits"><div class="roll" id="rl">${it.map(([a, b, x]) => a === 'p' ? `<div class="cr"><img src="${P(b)}" style="--r:${x}deg" alt=""></div>` : `<div class="cr ${x || ''}">${a ? `<small>${a}</small>` : ''}<b>${b}</b></div>`).join('')}</div>
    <div class="cr-end" id="ce"><h2>Кінець?..</h2></div></div>`);
  $('#layer').appendChild(cr); await sleep(40); cr.classList.add('on');
  const rl = $('#rl', cr); await sleep(300);
  const dist = rl.offsetHeight + innerHeight, dur = dist / 80;
  rl.style.transition = `transform ${dur}s linear`; rl.style.transform = `translateY(${-dist}px)`;
  let skip = false; cr.addEventListener('click', () => skip = true);
  const t0 = performance.now(); while (!skip && performance.now() - t0 < dur * 1000) await sleep(100);
  rl.style.transition = 'opacity .6s'; rl.style.opacity = 0;
  const ce = $('#ce', cr); ce.classList.add('on'); SFX.whoosh(); await sleep(1900);
  ce.innerHTML = `<h2>Ні.<br><span>Тільки початок ❤️</span></h2>`; SFX.chime(); FX.rain(HEARTS, 3500, 4); vib([30, 60, 30]);
  await sleep(2600);
  const b = h(`<button class="btn yes big">❤️</button>`); ce.appendChild(b); await waitClick(b); SFX.pop();
  cr.style.transition = 'opacity .7s'; cr.style.opacity = 0; await sleep(700); cr.remove(); document.body.classList.remove('filming');
}
async function endScreen() {
  document.body.classList.remove('nocaps'); HUD.hide();
  const mins = Math.max(1, Math.round((Date.now() - S.started) / 60000));
  const c = plainCard(`<div class="won">🏆</div><h1 class="hello">Ти пройшла все!</h1>
    <div class="stats"><div><b>${fmt(S.hearts)}</b><span>сердечок і смайликів</span></div><div><b>${S.ans.kisses || '∞'}</b><span>поцілунків винна 💋</span></div><div><b>6/6</b><span>язиків 👅</span></div><div><b>${mins} хв</b><span>разом тут</span></div></div>
    <div class="col"><button class="btn yes big wide" id="sh">💌 Надіслати йому відповіді</button><button class="btn ghost wide" id="ce">🏅 Мій сертифікат</button><button class="btn ghost wide" id="hg">🫂 Обійняти</button>
    <div class="row" style="margin-top:4px"><button class="btn ghost" id="fm">🎬 Фільм ще раз</button><button class="btn ghost" id="rs">🔁 Пройти ще раз</button></div></div>`);
  await showCard(c);
  $('#sh', c).onclick = () => { SFX.pop(); share(); };
  $('#ce', c).onclick = () => { SFX.pop(); certificate(); };
  $('#hg', c).onclick = e => { const b = e.currentTarget; FX.burst(...center(b), ['🤗', '❤️', '🫂', '💞', '💖'], 44, { max: 12 }); SFX.chime(); vib([40, 60, 120]); b.textContent = pick(['обійняв 🫂 тепер твоя черга', 'ще міцніше 🫂', 'не відпускаю 🫂❤️']); };
  $('#fm', c).onclick = async () => { SFX.pop(); await film(); document.body.classList.remove('nocaps'); };
  $('#rs', c).onclick = () => { S.level = 0; S.done = false; S.ans = {}; S.started = Date.now(); save(); location.reload(); };
}
function shareText() {
  const a = S.ans;
  return ['Я пройшла твій подарунок 🦊❤️', '',
    `🐶 Хто краще: ${a.dog || '—'}`, `🌯 Шаверма: ${a.shawarma || 'ТАК'}`, `👅 Капча: ${a.captcha || 'пройдено'}`,
    `⚡ Бліц: ${(a.blitz || []).join(', ') || '—'}`, `💘 Тіндер: ${a.tinder || '—'}`, `✍️ Що я про тебе думаю: ${a.typed || '—'}`,
    `⏳ Через 50 років: ${a.future || '—'}`, `🎡 На вихідних: ${(a.wheel || []).join(', ') || '—'}`, `💋 Поцілунків винна: ${a.kisses || '∞'}`,
    `⭐ Оцінка тобі: ${a.rating || '10/5'}`, `💍 Твоя назавжди: ${a.forever || 'ТАК'}`].join('\n');
}
async function share() {
  const text = shareText();
  try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); Toast.info('Скопійовано 📋 Встав йому в чат 💌', 3000); return; } catch (e) {}
  const m = h(`<div class="modal"><p>Скопіюй і надішли йому 💌</p><textarea readonly></textarea><button class="btn yes">Готово</button></div>`);
  $('textarea', m).value = text; $('#layer').appendChild(m); $('button', m).onclick = () => m.remove();
}
async function certificate() {
  try { await Promise.all([document.fonts.load('800 40px Unbounded'), document.fonts.load('700 40px Caveat'), document.fonts.load('700 20px Rubik')]); } catch (e) {}
  const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = '#fff8ef'; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 4000; k++) { g.fillStyle = `rgba(120,60,40,${Math.random() * .05})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
  g.strokeStyle = '#5a1532'; g.lineWidth = 10; g.strokeRect(40, 40, W - 80, H - 80); g.lineWidth = 3; g.strokeRect(64, 64, W - 128, H - 128);
  g.font = '60px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  [[100, 100], [W - 100, 100], [100, H - 100], [W - 100, H - 100]].forEach(([x, y]) => g.fillText('❤️', x, y));
  g.fillStyle = '#5a1532'; g.font = '800 74px Unbounded, Rubik, sans-serif'; g.fillText('СЕРТИФІКАТ', W / 2, 190);
  g.font = '500 30px Rubik, sans-serif'; g.fillStyle = '#7a3a52'; g.fillText('офіційної найкращої дівчини у світі', W / 2, 262);
  const im = new Image(); im.src = P(12); await new Promise(r => { if (im.complete && im.naturalWidth) r(); else { im.onload = r; im.onerror = r; } });
  const cx = W / 2, cy = 500, R = 170;
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.closePath(); g.clip();
  if (im.naturalWidth) { const s = Math.max(2 * R / im.naturalWidth, 2 * R / im.naturalHeight) * 1.25; const iw = im.naturalWidth * s, ih = im.naturalHeight * s; g.drawImage(im, cx - iw * .55, cy - ih * .4, iw, ih); }
  g.restore(); g.lineWidth = 10; g.strokeStyle = '#ff4f8b'; g.beginPath(); g.arc(cx, cy, R + 6, 0, 7); g.stroke();
  g.fillStyle = '#c2367a'; g.font = '700 96px Caveat, cursive'; g.fillText(CFG.herFull + ' 🦊', W / 2, 760);
  g.fillStyle = '#3a1a28'; g.font = '500 32px Rubik, sans-serif';
  const lines = [`пройшла ${LEVELS.length} рівнів і жодного разу не сказала «ні»`, `капча: 6/6 язиків 👅`, `поцілунків винна: ${S.ans.kisses || '∞'} 💋`, `оцінка хлопцю: 10/5 ⭐`, `шаверма: ТАК 🌯 · назавжди: ТАК 💍`];
  lines.forEach((l, k) => g.fillText(l, W / 2, 850 + k * 50));
  const d = new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
  g.font = '500 26px Rubik, sans-serif'; g.fillStyle = '#7a3a52'; g.textAlign = 'center'; g.fillText(d, W / 2, 1236);
  g.textAlign = 'right'; g.font = '700 60px Caveat, cursive'; g.fillStyle = '#c2367a'; g.fillText(CFG.sign, W - 110, 1180);
  g.save(); g.translate(225, 1165); g.rotate(-.25); g.strokeStyle = 'rgba(214,40,60,.75)'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 92, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 76, 0, 7); g.stroke();
  g.fillStyle = 'rgba(214,40,60,.8)'; g.font = '800 24px Unbounded, Rubik, sans-serif'; g.textAlign = 'center'; g.fillText('ЗАТВЕРД-', 0, -10); g.fillText('ЖЕНО ❤️', 0, 24); g.restore();
  let url; try { url = cv.toDataURL('image/jpeg', .9); } catch (e) { Toast.info('не вийшло зробити картинку 😢'); return; }
  const m = h(`<div class="modal"><img src="${url}" alt="сертифікат"><p>затисни картинку, щоб зберегти 📲</p><div class="row" style="margin:0"><a class="btn yes" download="sertyfikat.jpg" href="${url}">⬇️ Зберегти</a><button class="btn ghost">Закрити</button></div></div>`);
  $('#layer').appendChild(m); $('button', m).onclick = () => m.remove();
  FX.burst(innerWidth / 2, innerHeight / 2, ['🏅', '✨', '❤️'], 30); SFX.ach();
}
async function finale() {
  HUD.set(LEVELS.length, LEVELS.length);
  flash(.85); SFX.boom(); vib([50, 50, 50, 50, 200]);
  for (let k = 0; k < 6; k++) setTimeout(() => FX.firework(rnd(.15, .85) * innerWidth, rnd(.15, .42) * innerHeight, k % 2 ? HEARTS : LOVE), k * 330);
  FX.rain(LOVE, 4200, 4);
  const c = plainCard(`<div class="won">🏆</div><h1 class="hello">Я так і знав ❤️</h1><p class="lead">Усі ${LEVELS.length} рівнів пройдено.<br>Жодного «ні». Ти — моя.</p>`);
  await showCard(c);
  Toast.ach('Назавжди', 'гру пройдено на 100% 💍', '💍');
  await sleep(1800);
  await nextBtn(c, '🎬 Дивитись фільм про нас');
  HUD.hide();
  await film(); await letter(); await credits(); await endScreen();
}

/* =====================================================================
   ЗАПУСК
   ===================================================================== */
function runLevel(i) {
  return new Promise(res => {
    let fin = false;
    const end = () => { if (fin) return; fin = true; window.__skip = null; layerClean(); res(); };
    window.__skip = end;
    LEVELS[i].run(i).then(end, e => { console.error(e); end(); });
  });
}
async function main() {
  BG.init(); FX.resize(); requestAnimationFrame(frame); preloadDogs();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => FX.clearText());
  await intro();
  let v = 'go';
  if (S.level > 0 || S.done) v = await resumeAsk(); else await greet();
  if (v === 'new') await greet();
  if (v === 'film') { await film(); await endScreen(); return; }
  HUD.show();
  for (let i = S.level; i < LEVELS.length; i++) { S.level = i; save(); HUD.set(i, LEVELS.length); await runLevel(i); }
  S.level = LEVELS.length; S.done = true; save();
  await finale();
}
main();
