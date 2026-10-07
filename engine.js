'use strict';
/* =====================================================================
   НАЛАШТУВАННЯ — тут можна міняти тексти під себе
   ===================================================================== */
const CFG = {
  her: 'киць',
  herFull: 'Рижа Киця',
  letter: [
    'Киць,',
    'я зробив цю штуку, бо просто «люблю тебе» в повідомленні — це замало.',
    'Дякую, що смієшся з моїх тупих жартів, показуєш мені язик, засинаєш зі мною на дзвінку і завжди готова тріснути шаверму.',
    'З тобою навіть звичайний вечір стає найкращим днем тижня.',
    'Ти моя найкраща рижа. І я нікуди від тебе не дінусь 🫶',
    'Люблю тебе. Тт ❤️'
  ],
  sign: '— твій ❤️'
};

/* ---------------- утиліти ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
const P = i => `p${i}.jpg`, T = i => `t${i}.jpg`;
const vib = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
const center = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
const waitClick = el => new Promise(r => el.addEventListener('click', r, { once: true }));
const fmt = n => Number(n).toLocaleString('uk-UA');
const HEARTS = ['❤️', '💖', '💕', '💗', '💘', '💞', '💓'];
const LOVE = ['❤️', '💖', '😘', '🥰', '💋', '✨', '🦊', '💕'];

/* розміри фото — для кропів облич */
const PH = {1:[591,1280],2:[591,1280],3:[961,1280],4:[1280,1280],5:[1280,1280],6:[1280,1280],7:[1280,1280],8:[1280,1280],9:[960,1280],10:[1280,960],11:[1280,1280],12:[720,1280],13:[591,1280],14:[720,1280],15:[960,1280],16:[960,1280],17:[1280,1280],18:[1280,1280],19:[960,860],20:[1280,1280],21:[1280,1280],22:[660,1000],23:[720,1280]};
/* стиль для квадратного/круглого блоку: фото i, центр (cx,cy) у частках, zoom — у скільки разів фото ширше за блок */
function crop(i, cx, cy, zoom) {
  const [W, H] = PH[i]; const ar = H / W;
  zoom = Math.max(zoom, 1, 1 / ar);
  const px = zoom > 1 ? clamp((cx * zoom - .5) / (zoom - 1), 0, 1) * 100 : 50;
  const py = zoom * ar > 1 ? clamp((cy * zoom * ar - .5) / (zoom * ar - 1), 0, 1) * 100 : 50;
  return `background-image:url(${P(i)});background-size:${(zoom * 100).toFixed(1)}% auto;background-position:${px.toFixed(1)}% ${py.toFixed(1)}%;background-repeat:no-repeat`;
}
const HIM = () => crop(16, .505, .62, 3.6);     // його обличчя (фото на плечах)
const HIM2 = () => crop(5, .76, .42, 2.4);
const HER = () => crop(12, .55, .4, 1.25);      // її обличчя

/* ---------------- збереження прогресу ---------------- */
const S = (() => {
  let s = { level: 0, ans: {}, done: false, hearts: 0, started: Date.now() };
  try { const j = JSON.parse(localStorage.getItem('ryza_v2') || 'null'); if (j) s = Object.assign(s, j); } catch (e) {}
  return s;
})();
function save() { try { localStorage.setItem('ryza_v2', JSON.stringify(S)); } catch (e) {} }

/* =====================================================================
   ЗВУКОВІ ЕФЕКТИ (синтез, без файлів)
   ===================================================================== */
let muteAll = false;
const SFX = (() => {
  let ctx = null, out = null, nbuf = null, rO = null, rG = null;
  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ctx = new AC(); out = ctx.createGain(); out.gain.value = .5; out.connect(ctx.destination); } catch (e) { ctx = null; }
  }
  function resume() { if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); }
  const ok = () => ctx && !muteAll && ctx.state === 'running';
  function tone(f, d, o = {}) {
    if (!ok()) return;
    const { type = 'sine', v = .3, to = null, delay = 0, a = .006 } = o;
    const t0 = ctx.currentTime + delay, os = ctx.createOscillator(), g = ctx.createGain();
    os.type = type; os.frequency.setValueAtTime(f, t0); if (to) os.frequency.exponentialRampToValueAtTime(to, t0 + d);
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + a); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    os.connect(g); g.connect(out); os.start(t0); os.stop(t0 + d + .05);
  }
  function noise(d, o = {}) {
    if (!ok()) return;
    const { v = .2, f = 2000, q = 1, type = 'bandpass', delay = 0, to = null } = o;
    if (!nbuf) { nbuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const dd = nbuf.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1; }
    const t0 = ctx.currentTime + delay, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = nbuf; fl.type = type; fl.frequency.setValueAtTime(f, t0); if (to) fl.frequency.exponentialRampToValueAtTime(to, t0 + d); fl.Q.value = q;
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    s.connect(fl); fl.connect(g); g.connect(out); s.start(t0); s.stop(t0 + d + .05);
  }
  return {
    init, resume,
    pop: () => tone(560, .09, { to: 190, v: .32 }),
    tap: () => tone(880, .05, { type: 'triangle', v: .14 }),
    tick: () => tone(2100, .025, { type: 'square', v: .045 }),
    key: () => noise(.03, { v: .16, f: 3400, q: .9 }),
    whoosh: () => noise(.32, { v: .2, f: 420, to: 2600, q: .7 }),
    swipe: () => noise(.26, { v: .16, f: 900, to: 3200, q: .6 }),
    chime: () => [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(f, .6, { type: 'triangle', v: .15, delay: i * .07 })),
    ach: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, .4, { v: .16, delay: i * .065 })); noise(.5, { v: .04, f: 7000, q: .4, delay: .22 }); },
    err: () => { tone(523, .16, { type: 'square', v: .06 }); tone(392, .3, { type: 'square', v: .06, delay: .11 }); },
    thump: () => { tone(150, .22, { to: 42, v: .85 }); tone(128, .2, { to: 40, v: .45, delay: .21 }); },
    ring: () => { for (let k = 0; k < 3; k++) { tone(1318.5, .1, { v: .16, delay: k * .16 }); tone(1046.5, .1, { v: .12, delay: k * .16 + .05 }); } },
    sad: () => [392, 370, 349, 311].forEach((f, i) => tone(f, i === 3 ? .7 : .24, { type: 'sawtooth', v: .05, delay: i * .25 })),
    coin: () => { tone(988, .08, { type: 'square', v: .07 }); tone(1319, .32, { type: 'square', v: .07, delay: .08 }); },
    scratch: () => noise(.06, { v: .1, f: 2800, q: .6 }),
    boom: () => { noise(1, { v: .3, f: 160, to: 50, type: 'lowpass' }); tone(90, .6, { to: 30, v: .45 }); },
    sparkle: () => [2093, 2637, 3136, 4186].forEach((f, i) => tone(f, .25, { v: .06, delay: i * .05 })),
    riseStart() { if (!ok() || rO) return; rO = ctx.createOscillator(); rG = ctx.createGain(); rO.type = 'sine'; rO.frequency.value = 260; rG.gain.value = .0001; rO.connect(rG); rG.connect(out); rO.start(); rG.gain.exponentialRampToValueAtTime(.1, ctx.currentTime + .08); },
    riseSet(p) { if (rO) rO.frequency.setTargetAtTime(260 + p * 720, ctx.currentTime, .05); },
    riseStop() { if (!rO) return; const o = rO, g = rG; rO = null; try { g.gain.setTargetAtTime(.0001, ctx.currentTime, .04); } catch (e) {} setTimeout(() => { try { o.stop(); } catch (e) {} }, 300); }
  };
})();

/* =====================================================================
   МУЗИКА + синхронізація з бітом
   ===================================================================== */
const song = $('#song');
let audioUnlocked = false, musicStarted = false, NOW_T = 0, loopN = 0, lastT = 0;
function unlock() {
  SFX.init(); SFX.resume();
  if (audioUnlocked) return;
  audioUnlocked = true;
  try {
    song.muted = true;
    const p = song.play();
    if (p && p.then) p.then(() => { if (!musicStarted) { song.pause(); try { song.currentTime = 0; } catch (e) {} } song.muted = muteAll; })
      .catch(() => { audioUnlocked = false; song.muted = muteAll; });
  } catch (e) { audioUnlocked = false; }
}
['pointerup', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { passive: true }));
async function startMusic() {
  musicStarted = true; loopN = 0; lastT = 0;
  try { song.currentTime = 0; } catch (e) {}
  song.muted = muteAll;
  try { await song.play(); return true; } catch (e) { musicStarted = false; return false; }
}
song.addEventListener('ended', () => { try { song.currentTime = 0; song.play(); } catch (e) {} });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { SFX.resume(); if (musicStarted && song.paused) song.play().catch(() => {}); } });

const ALPH = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
const decEnv = s => { const a = new Float32Array(s.length); for (let i = 0; i < s.length; i++) a[i] = ALPH.indexOf(s[i]) / 63; return a; };
const ENV_LOW = decEnv(SONG.low), ENV_FULL = decEnv(SONG.full);
const envAt = (arr, t) => { const x = t * SONG.fr, i = Math.floor(x); if (i < 0 || i >= arr.length - 1) return 0; const f = x - i; return arr[i] * (1 - f) + arr[i + 1] * f; };
const BEATS = SONG.beats, BAR_LEN = 60 / SONG.bpm * 4;
const BARS = BEATS.filter((_, i) => i % 4 === 0);
function idxAt(arr, t) { if (!arr.length || t < arr[0]) return -1; let lo = 0, hi = arr.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (arr[m] <= t) lo = m; else hi = m - 1; } return lo; }
const barTime = b => b < BARS.length ? BARS[b] : BARS[BARS.length - 1] + (b - BARS.length + 1) * BAR_LEN;
const barAt = t => { const bi = idxAt(BEATS, t); return bi < 0 ? -1 : Math.floor(bi / 4); };
const SECTION = b => b < 8 ? 'intro' : b < 32 ? 'verse' : b < 56 ? 'chorus' : b < 72 ? 'verse2' : b < 80 ? 'break' : b < 103 ? 'chorus2' : b < 111 ? 'peak' : 'outro';
const isHot = b => ['chorus', 'chorus2', 'peak'].includes(SECTION(b));

/* чекати n тактів (переходи рівно в такт музики) */
function waitBars(n, cancel) {
  return new Promise(res => {
    const start = performance.now();
    const playing = musicStarted && !song.paused;
    const t0 = playing ? song.currentTime : 0;
    const target = playing ? barTime(Math.max(0, barAt(t0)) + n) : null;
    const maxMs = n * BAR_LEN * 1000;
    const chk = () => {
      if (cancel && cancel()) return res();
      const el = performance.now() - start;
      if (target != null && !song.paused) {
        const t = song.currentTime;
        if (t >= target - .03 || t < t0 - 1 || el > maxMs + 1500) return res();
      } else if (el >= maxMs) return res();
      requestAnimationFrame(chk);
    };
    chk();
  });
}

/* =====================================================================
   ФОН (полотно під контентом): боке, сердечка, полароїди — реагують на бас
   ===================================================================== */
const BG = (() => {
  const c = $('#bg'), ctx = c.getContext('2d');
  let W = 0, H = 0; const SC = .5;
  const COLS = ['255,138,61', '255,79,139', '255,194,161', '255,107,107', '190,70,200', '255,170,90'];
  const sprites = {}, orbs = [], hearts = [], pols = [];
  let heartSpr = null, mood = 0;
  function orbSprite(col) {
    const s = document.createElement('canvas'); s.width = s.height = 128; const g = s.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${col},.85)`); gr.addColorStop(.45, `rgba(${col},.25)`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return s;
  }
  function mkHeart() {
    const s = document.createElement('canvas'); s.width = s.height = 64; const g = s.getContext('2d');
    g.translate(32, 34); g.beginPath();
    for (let i = 0; i <= 60; i++) { const t = i / 60 * Math.PI * 2; const x = 16 * Math.pow(Math.sin(t), 3); const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); i ? g.lineTo(x * 1.7, y * 1.7) : g.moveTo(x * 1.7, y * 1.7); }
    g.closePath(); const gr = g.createLinearGradient(0, -28, 0, 28); gr.addColorStop(0, '#ff9ec0'); gr.addColorStop(1, '#ff3d7f'); g.fillStyle = gr; g.fill(); return s;
  }
  function resize() { W = c.width = Math.max(1, Math.round(innerWidth * SC)); H = c.height = Math.max(1, Math.round(innerHeight * SC)); }
  function init() {
    COLS.forEach(col => sprites[col] = orbSprite(col)); heartSpr = mkHeart(); resize();
    for (let i = 0; i < 13; i++) orbs.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(40, 110), vx: rnd(-.12, .12), vy: rnd(-.1, .1), col: pick(COLS), ph: rnd(0, 6.28) });
    const ids = shuffle([1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 23]);
    for (let i = 0; i < 9; i++) { const im = new Image(); im.src = T(ids[i]); pols.push({ im, x: rnd(0, W), y: rnd(0, H) + H * i / 9, r: rnd(-.35, .35), vr: rnd(-.0008, .0008), vy: rnd(.06, .14), s: rnd(46, 62) }); }
  }
  function kick(e) {
    const n = e > .7 ? 2 : (e > .45 ? 1 : (Math.random() < .5 ? 1 : 0));
    for (let i = 0; i < n; i++) hearts.push({ x: rnd(0, W), y: H + 10, vy: rnd(.5, 1.2) * (1 + e), vx: rnd(-.2, .2), s: rnd(7, 15) * (1 + e * .6), a: rnd(.35, .7), ph: rnd(0, 6.28), life: 0 });
    if (hearts.length > 70) hearts.splice(0, hearts.length - 70);
  }
  function draw(ts, low, full, hot) {
    mood = lerp(mood, hot ? 1 : 0, .02);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    for (const p of pols) {
      p.y -= p.vy; p.r += p.vr; if (p.y < -p.s * 1.6) { p.y = H + p.s; p.x = rnd(0, W); }
      if (!p.im.complete || !p.im.naturalWidth) continue;
      ctx.save(); ctx.globalAlpha = .16 + low * .06; ctx.translate(p.x, p.y); ctx.rotate(p.r);
      const s = p.s; ctx.fillStyle = '#fff6ee'; ctx.fillRect(-s / 2 - 3, -s / 2 - 3, s + 6, s + 14);
      const iw = p.im.naturalWidth, ih = p.im.naturalHeight, m = Math.min(iw, ih);
      ctx.drawImage(p.im, (iw - m) / 2, (ih - m) / 2, m, m, -s / 2, -s / 2, s, s); ctx.restore();
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const o of orbs) {
      o.x += o.vx; o.y += o.vy; if (o.x < -o.r) o.x = W + o.r; if (o.x > W + o.r) o.x = -o.r; if (o.y < -o.r) o.y = H + o.r; if (o.y > H + o.r) o.y = -o.r;
      const r = o.r * (1 + low * .45 + Math.sin(ts / 1400 + o.ph) * .06) * (1 + mood * .15);
      ctx.globalAlpha = clamp(.22 + full * .32 + mood * .1, 0, .75);
      ctx.drawImage(sprites[o.col], o.x - r, o.y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = hearts.length - 1; i >= 0; i--) {
      const p = hearts[i]; p.life++; p.y -= p.vy; p.x += p.vx + Math.sin(p.life / 30 + p.ph) * .25;
      if (p.y < -20) { hearts.splice(i, 1); continue; }
      ctx.globalAlpha = p.a * clamp(p.y / H * 1.4, 0, 1);
      ctx.drawImage(heartSpr, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }
    ctx.globalAlpha = 1;
  }
  return { init, resize, draw, kick };
})();

/* =====================================================================
   ЧАСТИНКИ ПОВЕРХ УСЬОГО (емодзі, феєрверки, фрази)
   ===================================================================== */
const FX = (() => {
  const c = $('#fx'), ctx = c.getContext('2d');
  let W = 0, H = 0, D = 1, last = 0; const PS = [], cache = new Map();
  function resize() { D = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; c.width = Math.round(W * D); c.height = Math.round(H * D); }
  function spr(ch, text) {
    const key = (text ? 'T:' : 'E:') + ch; let s = cache.get(key); if (s) return s;
    s = document.createElement('canvas'); const g = s.getContext('2d');
    if (!text) {
      s.width = s.height = 96; g.font = '70px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 48, 54);
    } else {
      const f = '700 54px Caveat, "Segoe Print", cursive'; g.font = f; const w = Math.ceil(g.measureText(ch).width) + 44;
      s.width = w; s.height = 92; g.font = f; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = 'rgba(255,79,139,.95)'; g.shadowBlur = 18; g.fillStyle = '#fff3e8'; g.fillText(ch, w / 2, 48); g.shadowBlur = 0; g.fillText(ch, w / 2, 48);
    }
    cache.set(key, s); return s;
  }
  const add = p => { if (PS.length > 460) PS.splice(0, PS.length - 460); PS.push(p); };
  function burst(x, y, set = HEARTS, n = 24, o = {}) {
    if (x == null) { x = W / 2; y = H / 2; }
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = rnd(o.min || 3, o.max || 10);
      add({ s: spr(pick(set)), x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up ?? 2), g: o.g ?? .2, dr: .982, r: rnd(-.5, .5), vr: rnd(-.12, .12), sz: rnd(o.s0 || 18, o.s1 || 40), life: rnd(1.1, 1.8), t: 0 });
    }
    S.hearts += n;
  }
  function rain(set = HEARTS, ms = 2500, rate = 3) {
    const end = performance.now() + ms;
    const tick = () => {
      for (let i = 0; i < rate; i++) add({ s: spr(pick(set)), x: rnd(0, W), y: -30, vx: rnd(-.5, .5), vy: rnd(2, 4.5), g: .03, dr: .995, r: rnd(-1, 1), vr: rnd(-.05, .05), sz: rnd(20, 38), life: rnd(3.2, 4.6), t: 0, sw: rnd(0, 6.28) });
      S.hearts += rate; if (performance.now() < end) setTimeout(tick, 90);
    };
    tick();
  }
  function float(set = HEARTS, n = 1) { for (let i = 0; i < n; i++) add({ s: spr(pick(set)), x: rnd(10, W - 10), y: H + 30, vx: rnd(-.4, .4), vy: -rnd(1.8, 3.4), g: -.004, dr: .998, r: rnd(-.3, .3), vr: rnd(-.02, .02), sz: rnd(20, 36), life: rnd(3, 4.2), t: 0, sw: rnd(0, 6.28) }); S.hearts += n; }
  function fountain(x, y, set = HEARTS, n = 20) { for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + rnd(-.45, .45) + (x < W / 2 ? .35 : -.35); const sp = rnd(9, 16); add({ s: spr(pick(set)), x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: .32, dr: .99, r: rnd(-.5, .5), vr: rnd(-.15, .15), sz: rnd(20, 38), life: rnd(1.6, 2.4), t: 0 }); } S.hearts += n; }
  function firework(x, y, set = HEARTS) {
    const sy = H + 10, vy = -Math.sqrt(2 * .26 * Math.max(60, sy - y));
    add({ s: spr('✨'), x, y: sy, vx: rnd(-1, 1), vy, g: .26, dr: 1, r: 0, vr: .3, sz: 22, life: 4, t: 0, rocket: true,
      onDie: p => { burst(p.x, p.y, set, 34, { min: 4, max: 11, g: .12, up: 0 }); SFX.sparkle(); } });
  }
  function text(str, n = 12) { for (let i = 0; i < n; i++) add({ s: spr(str, true), x: W / 2 + rnd(-60, 60), y: H / 2 + rnd(-90, 90), vx: rnd(-5, 5), vy: rnd(-6, 3), g: .05, dr: .985, r: rnd(-.5, .5), vr: rnd(-.02, .02), sz: rnd(28, 54), life: rnd(2, 3.2), t: 0, isText: true }); }
  function trail(x, y) { add({ s: spr(pick(['✨', '💖', '⭐', '💕'])), x, y, vx: rnd(-1, 1), vy: rnd(-2, -.4), g: .02, dr: .97, r: 0, vr: rnd(-.1, .1), sz: rnd(11, 19), life: .7, t: 0 }); }
  function draw(ts) {
    const dt = last ? Math.min(.05, (ts - last) / 1000) : .016; last = ts; const k = dt * 60;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.setTransform(D, 0, 0, D, 0, 0);
    for (let i = PS.length - 1; i >= 0; i--) {
      const p = PS[i]; p.t += dt;
      if (p.rocket && p.vy >= -.5) p.t = p.life;
      if (p.t >= p.life) { PS.splice(i, 1); if (p.onDie) p.onDie(p); continue; }
      p.vx *= Math.pow(p.dr, k); p.vy = p.vy * Math.pow(p.dr, k) + p.g * k;
      p.x += p.vx * k + (p.sw != null ? Math.sin(p.t * 2.2 + p.sw) * .7 * k : 0); p.y += p.vy * k; p.r += p.vr * k;
      const a = Math.min(1, (p.life - p.t) / Math.min(.6, p.life * .4)) * Math.min(1, p.t / .07);
      ctx.globalAlpha = clamp(a, 0, 1); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      if (p.isText) { const hh = p.sz, ww = hh * p.s.width / p.s.height; ctx.drawImage(p.s, -ww / 2, -hh / 2, ww, hh); }
      else ctx.drawImage(p.s, -p.sz / 2, -p.sz / 2, p.sz, p.sz);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  function clearText() { for (const k of [...cache.keys()]) if (k.startsWith('T:')) cache.delete(k); }
  return { resize, burst, rain, float, fountain, firework, text, trail, draw, clearText };
})();

/* =====================================================================
   СУБТИТРИ ПІД МУЗИКУ (свої рядки, не текст пісні) — слово на кожен біт
   [такт, текст, стиль]
   ===================================================================== */
const CAPS_A = [
  [2, 'тсс... 🤫'], [6, 'вдягай навушники 🎧'],
  [8, 'ця пісня тепер — наша 🎶'], [12, 'бо кожен раз, як я її чую'], [16, 'я думаю про одну рижу кицю 🦊'], [20, 'яка зараз читає це'],
  [24, 'і робить вигляд, що не посміхається 😏'], [28, 'я все бачу 👀'],
  [32, 'ти — моя улюблена людина ❤️', 'hot'], [36, 'мій улюблений дзвінок о другій ночі 📱', 'hot'], [40, 'моя улюблена шаверма — з тобою 🌯', 'hot'],
  [44, 'моя улюблена дурненька посмішка 😝', 'hot'], [48, 'ти робиш звичайні дні особливими ✨', 'hot'], [52, 'навіть понеділки 😳', 'hot'],
  [56, 'пам’ятаєш, як ти сиділа в мене на плечах? 🚕'], [60, 'я б тебе так носив усе життя'], [64, 'ну, може з перервами на шаверму 😂'], [68, 'але все одно носив би 💪'],
  [72, 'тихіше... 🕯️'], [76, 'зараз буде найкраща частина'],
  [80, 'я вибираю тебе 🫵', 'hot'], [84, 'сьогодні, завтра і завжди ♾️', 'hot'], [88, 'навіть коли ти засинаєш на дзвінку 😴', 'hot'],
  [92, 'навіть коли робиш поросятко 🐷', 'hot'], [96, 'особливо тоді 🥹', 'hot'], [100, 'ти моя 🦊❤️', 'hot'],
  [103, 'люблю тебе, киць ❤️', 'peak'], [107, 'тт 💋💋💋', 'peak'], [111, '...ставлю на повтор 🔁']
];
const CAPS_B = [
  [2, 'о, ти ще тут? 😌'], [6, 'тоді слухай ще раз 🎧'],
  [8, 'знаєш, що в тобі найкраще?'], [12, 'ні, не волосся (хоча воно топ 🦊)'], [16, 'і не веснянки (хоча вони ✨)'], [20, 'а те, як ти смієшся'],
  [24, 'голосно, на всю кімнату 😂'], [28, 'моя улюблена мелодія — твій сміх'],
  [32, 'дякую, що ти є 💞', 'hot'], [36, 'що терпиш мої тупі приколи 🤡', 'hot'], [40, 'що цілуєш мене в щічку 😚', 'hot'],
  [44, 'що показуєш мені язик 👅', 'hot'], [48, 'і що ти — це ти ❤️', 'hot'], [52, 'я б нічого не міняв', 'hot'],
  [56, 'окрім одного...'], [60, 'хочу, щоб ти була поруч частіше 🥺'], [64, 'бо без тебе навіть шаверма не та 🌯'], [68, 'серйозно, я перевіряв'],
  [72, 'закрий очі на секунду 🕯️'], [76, 'уяви, що я тебе обіймаю 🫂'],
  [80, 'відчула? це був я ❤️', 'hot'], [84, 'і так буде завжди ♾️', 'hot'], [88, 'і в 2076 теж 👴👵', 'hot'],
  [92, 'навіть коли я буду з бородою 🧔', 'hot'], [96, 'а ти все одно найкрасивіша', 'hot'], [100, 'моя рижа киця 🦊', 'hot'],
  [103, 'я тебе кохаю ❤️', 'peak'], [107, 'тт 💋 тт 💋 тт 💋', 'peak'], [111, '...і ще раз 🔁']
];
const Caps = (() => {
  const el = $('#caps'); let cur = -1, ln = null, words = [], startBeat = 0, setIdx = -1;
  function lines() { return loopN % 2 === 0 ? CAPS_A : CAPS_B; }
  function render(L, k) {
    if (ln) { const o = ln; o.classList.add('out'); setTimeout(() => o.remove(), 480); ln = null; }
    if (k < 0) return;
    const [bar, txt, cls] = L[k];
    ln = document.createElement('div'); ln.className = 'ln ' + (cls || '');
    words = txt.split(' ').map(w => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; ln.appendChild(s); ln.appendChild(document.createTextNode(' ')); return { el: s, on: false }; });
    el.appendChild(ln); startBeat = bar * 4;
  }
  function update(t) {
    const L = lines(); if (setIdx !== loopN % 2) { setIdx = loopN % 2; cur = -2; }
    let k = -1; for (let i = 0; i < L.length; i++) if (t >= barTime(L[i][0]) - .05) k = i;
    if (k !== cur) { cur = k; render(L, k); }
    if (ln) { const bi = idxAt(BEATS, t + .04); for (let j = 0; j < words.length; j++) { const w = words[j]; if (!w.on && bi >= startBeat + j) { w.on = true; w.el.classList.add('on'); } } }
  }
  function reset() { cur = -2; }
  return { update, reset };
})();

/* =====================================================================
   ТОСТИ: досягнення, «сповіщення», підказки
   ===================================================================== */
const Toast = (() => {
  const box = $('#toasts'); const q = []; let busy = false;
  async function run() {
    if (busy) return; busy = true;
    while (q.length) {
      const o = q.shift(); const el = h(o.html); box.appendChild(el); o.sfx && o.sfx(); vib(o.vib || 0);
      await sleep(o.ms || 3300); el.classList.add('out'); await sleep(380); el.remove();
    }
    busy = false;
  }
  return {
    ach(title, desc, icon = '🏆') { q.push({ html: `<div class="toast ach"><div class="ic">${icon}</div><div><div class="tt">🏆 Досягнення розблоковано</div><div class="tx">${title}</div><div class="ds">${desc}</div></div></div>`, sfx: SFX.ach, vib: [20, 40, 20] }); run(); },
    note(icon, app, text) { q.push({ html: `<div class="toast note"><div class="ic">${icon}</div><div style="flex:1;text-align:left"><div class="tt"><span>${app}</span><i>зараз</i></div><div class="tx" style="font-weight:600">${text}</div></div></div>`, sfx: SFX.tap, ms: 3600 }); run(); },
    info(text, ms = 2300) { const el = h(`<div class="toast info">${text}</div>`); box.appendChild(el); setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 380); }, ms); }
  };
})();

/* =====================================================================
   HUD
   ===================================================================== */
const HUD = {
  set(i, n) {
    $('#lvl').textContent = `РІВЕНЬ ${String(Math.min(i + 1, n)).padStart(2, '0')}/${n}`;
    const p = clamp(i / n, 0, 1) * 100; $('#barFill').style.width = p + '%'; $('#barFox').style.left = p + '%';
  },
  show() { $('#hud').classList.remove('hide'); },
  hide() { $('#hud').classList.add('hide'); }
};
$('#mute').addEventListener('click', () => {
  muteAll = !muteAll; song.muted = muteAll; $('#mute').textContent = muteAll ? '🔇' : '🔊';
});
/* прихований пропуск рівня для тесту: 5 швидких тапів по «РІВЕНЬ» */
(() => { let n = 0, t = 0; $('#lvl').addEventListener('click', () => { const now = Date.now(); n = now - t < 600 ? n + 1 : 1; t = now; if (n >= 5) { n = 0; window.__skip && window.__skip(); } }); })();

function flash(o = 1) { const f = $('#flash'); f.style.setProperty('--fo', o); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
function quake() { document.body.classList.remove('quake'); void document.body.offsetWidth; document.body.classList.add('quake'); setTimeout(() => document.body.classList.remove('quake'), 520); }
function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

/* =====================================================================
   ГОЛОВНИЙ ЦИКЛ: біт → фон, емодзі, субтитри, моменти пісні
   ===================================================================== */
const NOTES = [
  { 10: ['🎧', 'Твій хлопець', 'ти в навушниках? 😏'], 33: ['🎤', 'Музика', 'Приспів! Можна підспівувати'], 58: ['🔋', 'Батарея милоти', '100% — заряджено тобою ⚡'], 74: ['📍', 'Поруч', 'виявлено найкрасивішу дівчину (це ти)'], 90: ['🌯', 'Шавермна', 'ваше замовлення: 2 шаверми і 1 поцілунок 💋'], 108: ['💬', 'Твій хлопець', 'люблю тебе ❤️'] },
  { 10: ['💬', 'Твій хлопець', 'досі слухаєш? я радий 🥹'], 33: ['❤️', 'Здоров’я', 'пульс підвищено. причина: ти'], 58: ['📸', 'Фото', 'знайдено 23 фото з найкрасивішою дівчиною'], 74: ['🌙', 'Нагадування', 'обійняти хлопця при зустрічі 🫂'], 90: ['🐶', 'Чихуахуа', 'гав (переклад: ти найкраща)'], 108: ['💬', 'Твій хлопець', 'тт 💋'] }
];
function onBeat(bi) {
  const bar = Math.floor(bi / 4), e = SONG.ebar[bar] || 0, hot = isHot(bar);
  BG.kick(e);
  document.documentElement.style.setProperty('--pulse', (1 + (hot ? .1 : .05) * (bi % 2 ? .5 : 1)).toFixed(3));
  setTimeout(() => document.documentElement.style.setProperty('--pulse', '1'), 140);
  if (hot && bi % 2 === 0 && !document.body.classList.contains('filming')) FX.float(HEARTS, 1);
}
function onBar(b) {
  const busy = document.body.classList.contains('filming') || document.body.classList.contains('incall') || !document.body.classList.contains('started');
  const n = NOTES[loopN % 2][b]; if (n && !busy) Toast.note(...n);
  if (b === 32 || b === 80) { FX.fountain(0, innerHeight, HEARTS, 16); FX.fountain(innerWidth, innerHeight, HEARTS, 16); }
  if (b === 80) setTimeout(() => FX.firework(innerWidth * .5, innerHeight * .28), 300);
  if (b === 103) { flash(.25); for (let k = 0; k < 4; k++) setTimeout(() => FX.firework(rnd(.2, .8) * innerWidth, rnd(.18, .4) * innerHeight, LOVE), k * 380); }
}
let lastBeat = -1, lastBar = -1;
function frame(ts) {
  let low = .12, full = .1, hot = false;
  if (musicStarted && !song.paused) {
    const t = song.currentTime || 0;
    if (t + 1 < lastT) { loopN++; lastBeat = -1; lastBar = -1; Caps.reset(); }
    lastT = t; NOW_T = t;
    const bi = idxAt(BEATS, t);
    if (bi !== lastBeat) { if (bi >= 0 && bi > lastBeat) onBeat(bi); lastBeat = bi; }
    const ba = bi >= 0 ? Math.floor(bi / 4) : -1;
    if (ba !== lastBar) { if (ba >= 0 && ba > lastBar) onBar(ba); lastBar = ba; }
    Caps.update(t);
    low = envAt(ENV_LOW, t); full = envAt(ENV_FULL, t); hot = ba >= 0 && isHot(ba);
  }
  BG.draw(ts, low, full, hot); FX.draw(ts);
  requestAnimationFrame(frame);
}
function resizeAll() { BG.resize(); FX.resize(); }
addEventListener('resize', resizeAll);
/* іскорки від пальця */
(() => { let t = 0; addEventListener('pointermove', e => { if (e.pointerType !== 'touch' && !e.buttons) return; const n = performance.now(); if (n - t < 40) return; t = n; FX.trail(e.clientX, e.clientY); }, { passive: true }); })();
