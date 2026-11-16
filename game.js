// PLATANUS HACK FIGHTERS
// Juego de peleas 1 vs 1. Cada luchador es un integrante (generico y personalizable) de un equipo
// ganador de Platanus Hack. Cada escenario es una sede. Jefes: Rafa (con Nacho en la camara) y El Deadline.

const W = 800, H = 600, GR = 520;

// DO NOT replace existing keys — they match the physical arcade cabinet wiring.
const CABINET_KEYS = {
  P1_U: ['w'], P1_D: ['s'], P1_L: ['a'], P1_R: ['d'],
  P1_1: ['u'], P1_2: ['i'], P1_3: ['o'], P1_4: ['j'], P1_5: ['k'], P1_6: ['l'],
  P2_U: ['ArrowUp'], P2_D: ['ArrowDown'], P2_L: ['ArrowLeft'], P2_R: ['ArrowRight'],
  P2_1: ['r'], P2_2: ['t'], P2_3: ['y'], P2_4: ['f'], P2_5: ['g'], P2_6: ['h'],
  START1: ['Enter'], START2: ['2'],
};
const KEYBOARD_TO_ARCADE = {};
for (const [a, ks] of Object.entries(CABINET_KEYS)) for (const k of ks) KEYBOARD_TO_ARCADE[normalizeIncomingKey(k)] = a;
function normalizeIncomingKey(k) {
  if (typeof k !== 'string' || !k.length) return '';
  return k === ' ' ? 'space' : k.toLowerCase();
}

// ---------- Datos ----------
const SK = [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0x5c3a1e];
const HC = [0x1b1b1b, 0x4a2c17, 0x7b4a26, 0xc98b3c, 0xe8c872, 0x8e8e8e, 0xb03a2e];
const CH = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789 -';
// look = piel, color de pelo, peinado (0 corto, 1 largo, 2 rizado, 3 cola, 4 gorra), lentes
const TEAMS = [
  { n: 'LITTLE DRAGONS', c: 'SANTIAGO 2024', col: 0x2563eb, ac: 0xffe066, st: 0, p: ['MONEDA DE FUEGO', 'EVOLUCIÓN', 'INTERÉS COMPUESTO'], m: ['1000', '2210', '0121', '3430', '1641'] },
  { n: 'HEDGIE', c: 'SANTIAGO 2025', col: 0x27ae60, ac: 0xffffff, st: 1, p: ['COPY TRADE', 'COBERTURA', 'VENTA EN CORTO'], m: ['2101', '0010', '3220', '1530', '4340'] },
  { n: 'RECORD.AI', c: 'SANTIAGO 2025', col: 0x3a3a3a, ac: 0xe8e8e8, st: 1, p: ['ESCANEO FACIAL', '¿CÓMO TE LLAMABAS?', 'RECUERDO TOTAL'], m: ['1001', '3111', '0321', '2031', '4241'] },
  { n: 'TRANQUERA', c: 'BUENOS AIRES 2026', col: 0x2b2a26, ac: 0xefede6, st: 2, p: ['TRANQUERA CERRADA', '[REDACTADO]', 'REGLA VIOLADA'], m: ['1100', '2010', '0420', '3230', '1141'] },
  { n: 'DOMINIKITO', c: 'CDMX 2026', col: 0x5c3cd5, ac: 0xffffff, st: 3, p: ['ELIGE TU CAMINO', 'CUENTO VIVO', 'PERFIL EMOCIONAL'], m: ['2000', '3111', '1220', '4031', '2340'] },
  { n: 'WOKI', c: 'BOGOTÁ 2026', col: 0xf2f2f2, ac: 0x111111, st: 4, p: ['SEÑAL LORA', 'SOS', 'RESCATE'], m: ['3000', '2110', '1221', '4430', '2541'] },
  { n: 'MUS3O', c: 'CARACAS 2026', col: 0x8e2a1e, ac: 0xd9a441, st: 5, p: ['SALA NUEVA', 'MODO EXAMEN', 'PALACIO DE LA MEMORIA'], m: ['2010', '3131', '1220', '4031', '2340'] },
  { n: 'RAFA', c: 'EL ORGANIZADOR', col: 0xe1ff00, ac: 0x1b1b1b, st: 6, p: ['CAMBIO DE LOGÍSTICA', 'CRONOGRAMA', 'DE CERO A PRODUCTO'], m: ['1000'] },
  { n: 'EL DEADLINE', c: '36 HORAS', col: 0xff3b3b, ac: 0xffffff, st: 7, p: ['TIC TAC', 'ÚLTIMO COMMIT', 'DEPLOY A LAS 4AM'], m: ['0000'] },
  { n: 'EL PLÁTANO', c: 'COMODÍN', col: 0xffe135, ac: 0x6d4c2f, st: 6, p: ['CÁSCARA', 'POTASIO', 'LLUVIA DE PLÁTANOS'], m: ['1000', '3100', '0200', '4300', '2400'] },
];
TEAMS.forEach(t => { t.m = t.m.map((x, i) => x + '10201'[i]); });
const SELT = [0, 1, 2, 3, 4, 5, 6, 9], isTeam = t => t < 7 || t === 9;
const SN = ['SANTIAGO 2024', 'SANTIAGO 2025 · MUT, LAS CONDES', 'BUENOS AIRES 2026', 'CDMX 2026', 'BOGOTÁ 2026', 'CARACAS 2026', 'PLATANUS HQ', 'EL DEADLINE', 'SAN FRANCISCO · EL DESTINO'];
const ROOT = [110, 98, 123, 110, 92, 104, 130, 82, 98];
const PAT = [0, 0, 12, 0, 7, 0, 10, 12, 0, 0, 12, 0, 5, 7, 3, 5];
const PUNCH = { k: 'p', s: .05, a: .08, r: .14, rng: 70, d: 5, y: -108 };
const KICK = { k: 'k', s: .09, a: .1, r: .22, rng: 95, d: 8, y: -68 };

const S = { pts: 0, hs: [], ach: { a: 0, e: 0, t: 0 }, ch: [], ui: [], names: ['', ''], tw: {}, T: 0, pr: [], pa: [], walls: [], tm: [], imp: [], hst: 0 };
const ST = window.platanusArcadeStorage;

new Phaser.Game({
  type: Phaser.AUTO, width: W, height: H, parent: 'game-root', backgroundColor: '#0b0f03',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: W, height: H },
  scene: { create, update },
});

// ---------- Utilidades ----------
const rnd = (a, b) => a + Math.random() * (b - a);
const clampX = x => Math.max(40, Math.min(W - 40, x));
const held = c => S.c.h[c] === true;
function pr(c) { if (S.c.p[c]) { S.c.p[c] = false; return true; } return false; }
function opp(f) { return S.F[1 - f.i]; }
function later(t, fn) { S.tm.push({ t, fn }); }
function lerpC(a, b, t) {
  const r = (a >> 16) + ((b >> 16) - (a >> 16)) * t, g = ((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t, c = (a & 255) + ((b & 255) - (a & 255)) * t;
  return ((r | 0) << 16) | ((g | 0) << 8) | (c | 0);
}
function tx(x, y, s, sz = 16, c = '#ffffff', ox = .5) {
  const fl = S.flat, cap = fl && c === '#b8c48d';
  if (fl && (cap || c === '#e1ff00')) c = '#f2ff00';
  const t = S.sc.add.text(x, y, s, { fontFamily: 'ui-monospace, monospace', fontSize: sz + 'px', color: c, fontStyle: 'bold', stroke: '#000000', strokeThickness: fl ? 0 : Math.max(3, sz / 5), align: 'center' }).setOrigin(ox, .5).setDepth(10);
  if (fl) t.setLetterSpacing(sz < 16 ? 2 : 1).setAlpha(cap ? .55 : 1);
  S.ui.push(t);
  return t;
}
function clr() { S.ui.forEach(t => t.destroy()); S.ui = []; }
function ann(s, c = '#e1ff00', d = 900) {
  const t = S.sc.add.text(W / 2, 250, s, { fontFamily: 'monospace', fontSize: '52px', color: c, fontStyle: 'bold', stroke: '#000000', strokeThickness: 8 }).setOrigin(.5).setDepth(20).setScale(2);
  S.sc.tweens.add({ targets: t, scale: 1, duration: 180 });
  S.sc.tweens.add({ targets: t, alpha: 0, delay: d, duration: 250, onComplete: () => t.destroy() });
}
function flt(f, s, c = '#ffffff') {
  const t = S.sc.add.text(f.x, f.y - 175, s, { fontFamily: 'monospace', fontSize: '15px', color: c, fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(.5).setDepth(15);
  S.sc.tweens.add({ targets: t, y: t.y - 35, alpha: 0, duration: 900, onComplete: () => t.destroy() });
}
function spark(x, y, c, n = 8) {
  for (let i = 0; i < n; i++) S.pa.push({ x, y, vx: rnd(-260, 260), vy: rnd(-300, 80), l: rnd(.2, .45), c });
}

// ---------- Sonido ----------
function tone(f, d, type = 'square', v = .1, f2) {
  try {
    const c = S.sc.sound.context;
    if (!c) return;
    const n = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.connect(g); g.connect(c.destination);
    o.frequency.setValueAtTime(f, n);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, n + d);
    g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(.001, n + d);
    o.start(n); o.stop(n + d + .02);
  } catch (e) { /* sin audio */ }
}
const SFX = { hit: [220, .12, 'square', .12, 90], blk: [600, .06, 'triangle', .08, 500], pw: [300, .2, 'sawtooth', .07, 900], ko: [400, .8, 'sawtooth', .18, 40], sel: [660, .06, 'square', .06, 880], ok: [523, .15, 'square', .08, 1046], ctr: [900, .3, 'square', .1, 200], heal: [400, .3, 'sine', .1, 1200] };
function snd(k) { const d = SFX[k]; tone(d[0], d[1], d[2], d[3], d[4]); }

// ---------- Guardado ----------
async function load() {
  try {
    if (!ST) return;
    const a = await ST.get('phf-names-v1');
    if (a && a.found && a.value && Array.isArray(a.value.n)) S.names = a.value.n.slice(0, 2).map(x => typeof x === 'string' ? x.split('').filter(ch => CH.includes(ch)).join('').slice(0, 8) : '');
    const b = await ST.get('phf-wins-v1');
    if (b && b.found && b.value && typeof b.value === 'object') for (const k in b.value) if (isTeam(+k) && typeof b.value[k] === 'number') S.tw[k] = b.value[k];
    const c = await ST.get('phf-ach-v1');
    if (c && c.found && c.value) for (const k of ['a', 'e', 't']) if (typeof c.value[k] === 'number') S.ach[k] = c.value[k] | 0;
    const d = await ST.get('phf-hs-v1');
    if (d && d.found && Array.isArray(d.value)) S.hs = d.value.filter(e => e && typeof e.n === 'string' && typeof e.s === 'number' && isTeam(e.t)).map(e => ({ n: e.n.slice(0, 8), t: e.t | 0, s: e.s | 0 })).slice(0, 10);
    if (S.scr === 'title') go('title');
  } catch (e) { /* sin guardado */ }
}
function save() {
  try { if (ST) { ST.set('phf-names-v1', { n: S.names }); ST.set('phf-wins-v1', S.tw); ST.set('phf-ach-v1', S.ach); ST.set('phf-hs-v1', S.hs); } } catch (e) { /* sin guardado */ }
}


// ---------- Gamificación: puntos, combos, logros y récords ----------
const ACH = ['PRIMER DEPLOY', 'PERFECTO', 'COMBO x5', 'VENCISTE A RAFA', 'SOBREVIVISTE AL DEADLINE', 'SIN DORMIR', 'LOS 3 FINALES', 'TURISTA (4 EQUIPOS)'];
const pc = n => { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; };
function unlock(i) {
  if (S.ach.a >> i & 1) return;
  S.ach.a |= 1 << i; save(); snd('heal');
  const t = S.sc.add.text(W / 2, 112, 'LOGRO DESBLOQUEADO: ' + ACH[i], { fontFamily: 'monospace', fontSize: '18px', color: '#1abc9c', fontStyle: 'bold', stroke: '#000000', strokeThickness: 5 }).setOrigin(.5).setDepth(25);
  S.sc.tweens.add({ targets: t, alpha: 0, delay: 1800, duration: 400, onComplete: () => t.destroy() });
}
function addHS() {
  if (S.pts <= 0) return -1;
  const e = { n: S.hum.name, t: S.hum.t, s: S.pts };
  S.hs.push(e); S.hs.sort((a, b) => b.s - a.s); S.hs = S.hs.slice(0, 10); save();
  return S.hs.indexOf(e);
}
// Ranking cercano: muestra a quién tienes justo arriba en vez de solo el primer lugar
function rankTxt(r, y) {
  tx(W / 2, y, 'PUNTOS: ' + S.pts + (r >= 0 ? '  ·  PUESTO #' + (r + 1) + ' DE ' + S.hs.length : '  ·  FUERA DEL TOP 10'), 16, '#e1ff00');
  const up = r > 0 ? S.hs[r - 1] : r < 0 ? S.hs[S.hs.length - 1] : null;
  tx(W / 2, y + 26, r === 0 ? '¡ERES EL RÉCORD DE LA MÁQUINA!' : up ? 'TE FALTARON ' + (up.s - S.pts + 1) + ' PUNTOS PARA SUPERAR A ' + up.n : '', 13, '#f7ffd8');
}

// ---------- Escena ----------
function create() {
  S.sc = this;
  S.c = { h: Object.create(null), p: Object.create(null) };
  const dn = e => {
    const a = KEYBOARD_TO_ARCADE[normalizeIncomingKey(e.key)];
    if (!a) return;
    if (!S.c.h[a]) S.c.p[a] = true;
    S.c.h[a] = true;
    const c = S.sc.sound.context;
    if (c && c.state === 'suspended') c.resume();
  };
  const up = e => { const a = KEYBOARD_TO_ARCADE[normalizeIncomingKey(e.key)]; if (a) S.c.h[a] = false; };
  window.addEventListener('keydown', dn);
  window.addEventListener('keyup', up);
  this.events.once('shutdown', () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); });
  S.bg = this.add.graphics().setDepth(0);
  S.g = this.add.graphics().setDepth(5);
  S.h = this.add.graphics().setDepth(9);
  S.ov = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff).setDepth(30).setAlpha(0);
  go('title');
  load();
}

function go(s, arg) {
  clr();
  S.scr = s; S.st = 0; S.flat = s !== 'vs' && s !== 'fight';
  S.bg.clear(); S.g.clear(); S.h.clear();
  ({ title: initTitle, sel: initSel, vs: initVs, fight: initFight, res: initRes, over: initOver, end: initEnd, story: initStory, cho: initCho })[s](arg);
}

function update(time, delta) {
  const dt = Math.min(delta / 1000, .05);
  S.T += dt; S.st += dt; S.dt = dt;
  ({ title: updTitle, sel: updSel, vs: updVs, fight: updFight, res: updRes, over: updOver, end: updEnd, story: updStory, cho: updCho })[S.scr](dt);
  if (S.fl > 0) { S.fl -= dt; S.ov.setAlpha(Math.max(0, Math.min(1, S.fl * 2.5))); } else S.ov.setAlpha(0);
  S.c.p = Object.create(null);
}

// ---------- Luchadores ----------
function mkF(i, t, look, name, cpu) {
  const f = { i, t, look: typeof look === 'string' ? look.split('').map(Number) : look.slice(), name, cpu, wins: 0, m: 0, anim: Math.random() * 9 };
  reset(f);
  return f;
}
function reset(f) {
  Object.assign(f, { x: f.i ? 560 : 240, y: GR, vx: 0, vy: 0, kx: 0, face: f.i ? -1 : 1, hp: 100, ghp: 100, atk: null, at: 0, hd: 0, lh: -1, cast: 0, cd: [0, 0], hs: 0, stun: 0, inv: 0, sil: 0, slow: 0, sh: 0, buff: 0, ctr: 0, blk: 0, cr: 0, gr: 1, ko: 0, fl: 0, ait: 0, aiI: null, win: 0, cb: 0, cbt: 0, tk: 0, iv: 0, dz: 0, mx: 0 });
}
function startAtk(f, a) { f.atk = a; f.at = 0; f.hd = 0; f.lh = -1; if (f.gr && !a.dash) f.vx = 0; }
function inRange(f, o, a) {
  const dx = (o.x - f.x) * f.face;
  if (dx < -10 || dx > a.rng + 24) return false;
  const ay = f.y + a.y, top = o.y - (o.cr ? 92 : 148);
  return ay >= top - 8 && ay <= o.y + 4;
}
function shoot(f, k, o = {}) {
  const p = Object.assign({ x: f.x + f.face * 45, y: f.y - 95, vx: f.face * 460, vy: 0, g: 0, ow: f.i, k, d: 8, l: 2.5, w: 26, h: 20, fx: {}, a: 0 }, o);
  if (o.v) p.vx = f.face * o.v;
  S.pr.push(p);
  return p;
}

// Poderes: [poder 1, poder 2, super] por equipo
const PW = [
  [f => shoot(f, 'fire', { d: 9 }),
    f => { f.buff = 6; flt(f, '¡EVOLUCIÓN!', '#ffe066'); },
    f => { for (let j = 0; j < 5; j++) later(j * .15, () => shoot(f, 'fire', { d: 4 + j * 2, v: 540, y: f.y - 70 - j * 10 })); }],
  [f => shoot(f, 'arrow', { d: 9, v: 560 }),
    f => { f.sh = 4; flt(f, 'COBERTURA', '#2ecc71'); },
    f => startAtk(f, { k: 'd', s: .08, a: .25, r: .25, rng: 50, d: 16, dash: 700, y: -90, heal: 1 })],
  [f => shoot(f, 'scan', { d: 5, v: 950, l: .3, w: 60, h: 10, fx: { stun: .9 } }),
    f => shoot(f, 'q', { d: 4, v: 420, fx: { inv: 2.5 } }),
    f => startAtk(f, { k: 'd', s: .05, a: .4, r: .25, rng: 55, d: 4, multi: .08, dash: 560, y: -95 })],
  [f => S.walls.push({ x: clampX(f.x + f.face * 70), ow: f.i, l: 3 }),
    f => shoot(f, 'red', { d: 6, v: 500, w: 40, h: 14, fx: { sil: 3, drain: 30 } }),
    f => { f.ctr = 1.5; flt(f, 'MODO REGLAS', '#75aadb'); }],
  [f => { shoot(f, 'book', { d: 7, y: f.y - 125, v: 430 }); shoot(f, 'book', { d: 7, y: f.y - 22, v: 430 }); },
    f => shoot(f, 'buddy', { d: 10, y: GR - 14, v: 300, l: 4 }),
    f => shoot(f, 'heart', { d: 10, v: 380, w: 34, h: 30, fx: { bonus: 1 } })],
  [f => shoot(f, 'wave', { d: 7, v: 420, w: 30, h: 60, fx: { ub: 1 } }),
    f => { f.hp = Math.min(100, f.hp + 12); flt(f, 'SOS +12', '#ff5050'); snd('heal'); },
    f => { const o = opp(f); for (let j = 0; j < 6; j++) later(j * .12, () => shoot(f, 'rock', { x: o.x + rnd(-60, 60), y: -20, vx: 0, vy: 200, g: 1400, d: 5, l: 3, nc: 1 })); }],
  [f => { const o = opp(f); spark(f.x, f.y - 80, 0x8e44ad, 12); f.x = clampX(o.x + (f.x < o.x ? 65 : -65)); f.face = o.x > f.x ? 1 : -1; spark(f.x, f.y - 80, 0xffe066, 12); },
    f => shoot(f, 'quiz', { d: 5, v: 400, w: 24, h: 28, fx: { stun: 1.3 } }),
    f => { const o = opp(f); for (let j = 0; j < 3; j++) later(.3 * j, () => shoot(f, 'pillar', { x: o.x, y: GR + 50, vx: 0, vy: -900, d: 9, w: 36, h: 80, l: .45, nc: 1 })); }],
  [f => shoot(f, 'clip', { d: 7, fx: { slow: 3 } }),
    f => shoot(f, 'clock', { d: 8, v: 480, fx: { time: 3 } }),
    f => { const o = opp(f); flt(f, '¡DE CERO A PRODUCTO!', '#e1ff00'); later(.3, () => shoot(f, 'robot', { x: o.x, y: -60, vx: 0, vy: 300, g: 1600, d: 20, w: 60, h: 60, l: 3, nc: 1 })); }],
  [f => { shoot(f, 'hand', { d: 6, y: f.y - 125 }); later(.2, () => shoot(f, 'hand', { d: 6, y: f.y - 60 })); },
    f => startAtk(f, { k: 'd', s: .1, a: .3, r: .3, rng: 60, d: 14, dash: 750, y: -90 }),
    f => { const o = opp(f); for (let j = 0; j < 8; j++) later(j * .1, () => shoot(f, 'rock', { x: o.x + rnd(-90, 90), y: -20, vx: 0, vy: 150, g: 1400, d: 4, l: 3, nc: 1 })); }],
  [f => shoot(f, 'peel', { x: clampX(f.x + f.face * 60), y: GR - 6, vx: 0, d: 4, l: 6, w: 30, h: 12, nc: 1, fx: { stun: 1.1, slip: 1, ub: 1 } }),
    f => { f.buff = 5; f.hp = Math.min(100, f.hp + 6); flt(f, '+POTASIO', '#ffe135'); snd('heal'); },
    f => { const o = opp(f); for (let j = 0; j < 7; j++) later(j * .11, () => shoot(f, 'ban', { x: o.x + rnd(-80, 80), y: -20, vx: 0, vy: 180, g: 1400, d: 4, l: 3, nc: 1 })); }],
];

function cast(f, k) {
  f.cast = .3;
  if (k < 2) f.cd[k] = (k ? 4.5 : 2.2) * (f.cdm || 1); else f.m = 0;
  PW[f.t][k](f);
  snd('pw');
  flt(f, TEAMS[f.t].p[k], k == 2 ? '#ff6ec7' : '#ffffff');
}

function hin(f) {
  const P = f.i ? 'P2_' : 'P1_';
  let l = held(P + 'L'), r = held(P + 'R');
  if (f.inv > 0) [l, r] = [r, l];
  return { l, r, u: held(P + 'U'), d: held(P + 'D'), b: [1, 2, 3, 4, 5, 6].map(n => pr(P + n)) };
}

function incoming(f) {
  return S.pr.some(p => p.ow !== f.i && Math.abs(p.x - f.x) < 220 && (p.x - f.x) * p.vx < 0);
}
function ai(f, o, dt) {
  f.ait -= dt;
  if (f.ait > 0 && f.aiI) { const r = Object.assign({}, f.aiI); f.aiI.b = [0, 0, 0, 0, 0, 0]; return r; }
  const lv = S.lv || 0;
  f.ait = Math.max(.05, rnd(.1, .24) - lv * .025);
  const I = { l: 0, r: 0, u: 0, d: 0, b: [0, 0, 0, 0, 0, 0] };
  const dx = o.x - f.x, dist = Math.abs(dx), tow = dx > 0 ? 'r' : 'l', away = dx > 0 ? 'l' : 'r';
  if (((o.atk && dist < 140) || incoming(f)) && Math.random() < .25 + lv * .12) I[away] = 1;
  else if (dist > 115) {
    I[tow] = 1;
    if (f.cd[0] <= 0 && Math.random() < .2 + lv * .06) I.b[2] = 1;
    else if (Math.random() < .05) I.u = 1;
  } else {
    const r = Math.random();
    if (Math.random() < .4 - lv * .08) { f.aiI = Object.assign({}, I); return I; }
    if (r < .33) I.b[0] = 1; else if (r < .58) I.b[1] = 1; else if (r < .68 && f.cd[1] <= 0) I.b[3] = 1;
    else if (r < .8) I[away] = 1; else if (r < .86) I.u = 1; else if (r < .92) I.d = 1;
  }
  if (f.m >= 100 && Math.random() < .5) I.b[4] = 1;
  f.aiI = Object.assign({}, I, { b: [0, 0, 0, 0, 0, 0] });
  return I;
}

function step(f, o, dt) {
  if (f.ko) { f.dz += dt; f.mx = Math.min(1, Math.max(0, (f.dz - .5) / 1.1)); }
  for (const k of ['hs', 'stun', 'inv', 'sil', 'slow', 'sh', 'buff', 'ctr', 'fl', 'cast', 'cbt', 'iv']) if (f[k] > 0) f[k] -= dt;
  f.cd[0] -= dt; f.cd[1] -= dt;
  f.anim += dt;
  const live = S.ph === 'fight' && !f.ko && !f.win;
  const I = live ? (f.cpu ? ai(f, o, dt) : hin(f)) : { b: [] };
  f.blk = 0; f.cr = 0;
  if (live && f.hs <= 0 && f.stun <= 0) {
    if (f.atk) {
      const a = f.atk;
      f.at += dt;
      if (f.at >= a.s && f.at < a.s + a.a) {
        if (a.dash) f.vx = f.face * a.dash;
        if (a.multi ? f.at - f.lh >= a.multi : !f.hd) {
          if (inRange(f, o, a)) {
            f.lh = f.at; f.hd = 1;
            const before = o.hp;
            hurt(o, a.d, f, {});
            if (a.heal) f.hp = Math.min(100, f.hp + (before - o.hp) * .7);
          }
        }
      } else if (a.dash && f.gr) f.vx = 0;
      if (f.at >= a.s + a.a + a.r) f.atk = null;
    } else {
      if (f.gr) f.face = o.x > f.x ? 1 : -1;
      const back = f.face > 0 ? I.l : I.r, fwd = f.face > 0 ? I.r : I.l;
      const sp = (f.slow > 0 ? 120 : 230) * (f.t === 8 ? 1 + (100 - f.hp) / 140 : 1);
      if (f.gr) {
        f.vx = 0;
        if (I.d) { f.cr = 1; if (back) f.blk = 1; }
        else if (back) { f.blk = 1; f.vx = -f.face * sp * .6; }
        else if (fwd) f.vx = f.face * sp;
        if (I.u && !I.d) { f.vy = -760; f.gr = 0; snd('sel'); }
      }
      const B = I.b;
      if (B[0]) startAtk(f, PUNCH);
      else if (B[1]) startAtk(f, KICK);
      else if (f.sil <= 0) {
        if (B[2] && f.cd[0] <= 0) cast(f, 0);
        else if (B[3] && f.cd[1] <= 0) cast(f, 1);
        else if ((B[4] || B[5]) && f.m >= 100) cast(f, 2);
      }
    }
  } else if (!f.ko && f.gr) f.vx = 0;
  f.x = clampX(f.x + (f.vx + f.kx) * dt);
  f.kx *= Math.pow(.01, dt);
  if (!f.gr) {
    f.vy += 2000 * dt; f.y += f.vy * dt;
    if (f.y >= GR) { f.y = GR; f.vy = 0; f.gr = 1; if (f.ko) f.kx *= .3; }
  }
}

function hurt(o, d, f, fx) {
  if (o.ko || S.ph !== 'fight' || o.iv > 0) return;
  if (o.ctr > 0) {
    o.ctr = 0; flt(o, '¡REGLA VIOLADA!', '#75aadb'); snd('ctr'); spark(o.x, o.y - 100, 0x75aadb, 14);
    hurt(f, Math.max(20, d * 2), o, { stun: .6 });
    return;
  }
  if (fx.bonus) d += (100 - o.hp) * .25;
  if (f.buff > 0) d *= 1.4;
  d *= f.dm || 1;
  const dir = o.x >= f.x ? 1 : -1;
  if (o.blk && !fx.ub) {
    d *= .15; o.kx = dir * 140; spark(o.x - dir * 20, o.y - 100, 0xffffff, 5); snd('blk');
  } else {
    if (o.sh > 0) d *= .5;
    o.hs = .22; o.kx = dir * 240; o.fl = .12; o.atk = null;
    f.cb = f.cbt > 0 ? f.cb + 1 : 1; f.cbt = .9;
    if (f.cb > 2 && f.cb & 1) flt(f, ['¡BIEN!', '¡GENIAL!', '¡BRUTAL!', '¡ÉPICO!'][Math.min(3, f.cb - 3 >> 1)], '#ff6ec7');
    if (!S.fh) { S.fh = 1; flt(f, '¡PRIMER COMMIT!', '#e1ff00'); if (S.np === 1 && !f.i) S.pts += 300; }
    if (f.cb >= 5 && !f.cpu) unlock(2);
    if (f.cb >= 4 && f.cb % 4 === 0) { o.kx = dir * 520; o.iv = .5; o.hs = .3; }
    if (S.np === 1 && f.i === 0 && f.cb >= 3) S.pts += f.cb * 50;
    if (fx.stun) o.stun = fx.stun;
    if (fx.inv) { o.inv = fx.inv; flt(o, '¿EH?', '#c39bd3'); }
    if (fx.sil) { o.sil = fx.sil; flt(o, '[REDACTADO]', '#aaaaaa'); }
    if (fx.slow) o.slow = fx.slow;
    if (fx.slip) flt(o, '¡SE RESBALÓ!', '#ffe135');
    if (fx.drain) o.m = Math.max(0, o.m - fx.drain);
    if (fx.time) { S.time = Math.max(1, S.time - fx.time); flt(o, '-3 SEG', '#e1ff00'); }
    spark(o.x, o.y - 95, 0xffe066); snd('hit'); S.hst = d >= 12 ? .12 : .06; S.imp.push({ x: o.x - dir * 18, y: o.y - 100, l: .12, s: d >= 12 ? 1.6 : 1 });
    if (d >= 12) S.sc.cameras.main.shake(120, .006);
  }
  o.hp = Math.max(0, o.hp - d); o.tk += d;
  if (S.np === 1 && f.i === 0) S.pts += Math.round(d * 10);
  f.m = Math.min(100, f.m + d * .9); o.m = Math.min(100, o.m + d * .5);
  if (o.hp <= 0) {
    o.ko = 1; o.gr = 0; o.vy = -420; o.kx = dir * 260;
    ann('¡DEPLOYADO!', '#ff6ec7', 1400); snd('ko'); S.sc.cameras.main.shake(300, .012).zoomTo(1.3, 250).pan(o.x, o.y - 100, 250); S.slo = 1.2;
    endRound(f);
  }
}

// ---------- Dibujo de luchadores (pixel art procedural) ----------
function pose(f) {
  if (f.ko) return 'ko';
  if (f.win) return 'win';
  if (f.hs > 0 || f.stun > 0) return 'hurt';
  if (f.atk) return f.at < f.atk.s ? 'wind' : f.at < f.atk.s + f.atk.a + .05 ? (f.atk.k === 'k' ? 'kick' : 'punch') : 'idle';
  if (f.cast > 0) return 'cast';
  if (!f.gr) return 'jump';
  if (f.cr) return 'crouch';
  if (f.blk) return 'block';
  if (Math.abs(f.vx) > 1) return 'walk';
  return 'idle';
}

// Sombra con cambio de tono (mas oscura y fria) y luz (mas clara y calida)
function shd(c) { return lerpC(lerpC(c, 0x2a1b4a, .35), 0, .15); }
function lit(c) { return lerpC(c, 0xfff2c4, .3); }

function drawF(g, f, X, Y, sc = 1) {
  if (f.t === 8) return drawClock(g, f, X, Y, sc);
  const U = 5 * sc, fc = f.face, T = TEAMS[f.t], L = f.look, t = f.t;
  X = Math.round(X / U) * U; Y = Math.round(Y / U) * U;
  const ps = pose(f), W8 = 0xffffff, sk = f.fl > 0 ? W8 : SK[L[0]], hc = HC[L[1]], hs = L[2];
  const sh = f.fl > 0 ? W8 : T.col, sh2 = shd(sh), dk = 0x15151f;
  const pa = f.fl > 0 ? W8 : t === 9 ? 0xe6c200 : lerpC(T.col, 0x1d1430, .72);
  // complexion: 0 slim, 1 medium, 2 broad
  const bd = L[4] === undefined ? 1 : L[4], tw = [9, 10, 12][bd], tl = -(tw >> 1), lw = bd === 2 ? 4 : 3;
  const gl = L[3] || t === 2 || t === 6;
  if (!f.ko) { const k = Math.max(.3, 1 - (GR - f.y) / 300); g.fillStyle(0x000000, .28 * k); g.fillEllipse(X, Y + (GR - f.y) + 2, 70 * sc * k, 12 * sc * k); }
  if (f.sh > 0) { g.lineStyle(3, 0x2ecc71, .7); g.strokeCircle(X, Y - 75 * sc, 85 * sc); }
  if (f.ctr > 0) { g.lineStyle(4, 0x75aadb, .5 + Math.sin(S.T * 20) * .3); g.strokeRect(X - 40 * sc, Y - 155 * sc, 80 * sc, 155 * sc); }
  if (f.buff > 0) { g.fillStyle(0xff7b29, .18 + Math.sin(S.T * 15) * .08); g.fillCircle(X, Y - 75 * sc, 80 * sc); }
  const dsd = fc > 0 ? 1 : -1;
  const body = (R, ol) => {
    // B = part with volume: base + hue-shifted shadow strip + light strip
    const B = (dx, dy, w, h, c) => {
      R(dx, dy, w, h, c);
      if (ol || w < 3) return;
      if (dsd > 0) R(dx + w - 1, dy, 1, h, shd(c)); else R(dx, dy, 1, h, shd(c));
      if (h > 3) R(dsd > 0 ? dx : dx + w - 2, dy, 2, 1, lit(c));
    };
    const shoe = (x, y, w) => { R(x, y, w, 1, sh); R(x, y + 1, w, 1, W8); };
    if (ps === 'ko') {
      B(-6, -4, 10, 4, pa); B(-15, -5, 9, 5, sh); B(-23, -8, 8, 8, sk); R(-24, -9, 3, 8, hc);
      if (!ol) { R(-19, -6, 1, 1, dk); R(-17, -6, 1, 1, dk); }
      return;
    }
    const cr = ps === 'crouch' ? 5 : 0, ln = ps === 'hurt' || ps === 'wind' ? -1 : 0;
    const bob = ps === 'idle' ? Math.round(Math.sin(f.anim * 4) * .6) : 0;
    // legs: stance with legs apart
    if (ps === 'jump') { B(-4, -14, lw, 5, pa); B(1, -15, lw, 5, pa); shoe(-4, -10, lw + 1); shoe(1, -11, lw + 1); }
    else if (ps === 'kick') { B(-4, -10, lw, 8, pa); shoe(-5, -2, lw + 1); B(1, -14, 10, 3, pa); R(11, -15, 2, 4, sh); R(13, -15, 1, 4, W8); }
    else if (cr) { B(-6, -5, lw + 1, 3, pa); B(2, -5, lw + 1, 3, pa); shoe(-7, -2, lw + 2); shoe(2, -2, lw + 2); }
    else {
      const s = ps === 'walk' ? Math.round(Math.sin(f.anim * 12) * 2) : 0;
      B(-5 + s, -10, lw, 8, pa); B(2 - s, -10, lw, 8, pa); shoe(-6 + s, -2, lw + 1); shoe(2 - s, -2, lw + 1);
    }
    const b = cr + bob + (ps === 'jump' ? -4 : 0), y = d => d + b, x = d => d + ln;
    // behind the body: cape (Dominikito), tail (Little Dragons), antenna (WOKI), hood (Rafa)
    if (t === 4) R(x(tl - 2), y(-19), 3, 15, lerpC(sh, 0x2e168f, .5));
    if (t === 0) { R(x(tl - 3), y(-13), 3, 2, sh); R(x(tl - 5), y(-15), 2, 2, sh); if (!ol) R(x(tl - 6), y(-16), 1, 1, 0xffe066); }
    if (t === 5) { R(x(tl), y(-28), 1, 8, dk); if (!ol) R(x(tl), y(-29), 1, 1, S.T % 1 < .5 ? 0xff3b3b : 0x661111); }
    if (t === 7) R(x(-6), y(-22), 3, 3, sh2);
    // torso: open jacket in team color with inner shirt
    B(x(tl), y(-20), tw, 9, sh);
    if (!ol) {
      if (t === 9) { R(x(tl + 2), y(-17), 1, 1, 0x8a6a1f); R(x(tl + tw - 3), y(-14), 1, 1, 0x8a6a1f); R(x(-1), y(-19), 1, 1, 0x8a6a1f); }
      else R(x(-1), y(-20), 3, 8, t === 1 ? W8 : lerpC(T.ac, W8, .25));
      if (t === 1) R(x(0), y(-19), 1, 6, 0xc0392b);
      if (t === 3) { R(x(tl + 1), y(-20), 1, 9, T.ac); R(x(tl + tw - 2), y(-20), 1, 9, T.ac); }
      if (t === 0) { R(x(tl + 1), y(-17), 1, 1, lit(sh)); R(x(tl + 2), y(-14), 1, 1, lit(sh)); }
      if (t === 5) { R(x(tl), y(-16), tw, 1, 0x111111); R(x(tl), y(-13), tw, 1, 0x111111); }
      if (t === 7) { R(x(-2), y(-16), 1, 1, dk); R(x(-1), y(-15), 3, 1, dk); R(x(2), y(-16), 1, 1, dk); }
      for (let k = 0; k < tw; k++) R(x(tl + k), y(-11), 1, 1, t === 3 ? (k & 1 ? T.ac : dk) : dk);
    }
    // head with ear
    B(x(-4), y(-29), 9, 9, sk);
    if (!ol) {
      R(x(-2), y(-25), 1, 2, shd(sk));
      const hurt = ps === 'hurt', mad = ps === 'punch' || ps === 'kick' || ps === 'cast' || ps === 'wind';
      if (hurt) { R(x(0), y(-24), 2, 1, dk); R(x(3), y(-24), 2, 1, dk); R(x(3), y(-22), 2, 2, 0x5a1f1f); }
      else {
        R(x(0), y(-25), 2, 2, W8); R(x(3), y(-25), 2, 2, W8); R(x(1), y(-25), 1, 2, dk); R(x(4), y(-25), 1, 2, dk);
        if (mad) { R(x(0), y(-27), 1, 1, hc); R(x(1), y(-26), 1, 1, hc); R(x(3), y(-26), 1, 1, hc); R(x(4), y(-27), 1, 1, hc); }
        else { R(x(0), y(-27), 2, 1, hc); R(x(3), y(-27), 2, 1, hc); }
        R(x(ps === 'win' ? 2 : 3), y(-22), ps === 'win' ? 3 : 2, 1, 0x7a3b2e);
      }
      R(x(-1), y(-23), 1, 1, lerpC(sk, 0xff6b6b, .4));
      if (gl && !hurt) {
        R(x(-1), y(-26), 7, 1, dk);
        const l1 = t === 6 ? 0xff3355 : t === 2 ? 0xffffff : 0x9fb4c8, l2 = t === 6 ? 0x33e0ff : l1;
        R(x(0), y(-25), 2, 1, l1); R(x(3), y(-25), 2, 1, l2);
      }
      if (t === 2) { R(x(-2), y(-24), 1, 2, 0xe8e8e8); if ((S.T * 3 | 0) % 4 === 0) R(x(-4), y(-29 + ((S.T * 30) | 0) % 9), 9, 1, 0xffffff); }
      if (f.sil > 0) R(x(2), y(-23), 4, 2, 0x000000);
    }
    // hair
    const H2 = (dx, dy, w, h) => R(x(dx), y(dy), w, h, hc);
    if (t === 9) {
      R(x(-5), y(-32), 11, 3, sh); R(x(-5), y(-29), 2, 10, sh); R(x(-3), y(-33), 6, 1, sh);
      R(x(0), y(-36), 2, 3, 0x6d4c2f); R(x(1), y(-37), 2, 1, 0x6d4c2f);
      R(x(tl - 1), y(-22), 2, 4, sh); R(x(tl + tw - 1), y(-22), 2, 4, sh);
    }
    else if (hs === 0) { H2(-4, -30, 9, 2); H2(-4, -28, 2, 3); }
    else if (hs === 1) { H2(-5, -30, 10, 2); H2(-5, -28, 3, 10); }
    else if (hs === 2) { H2(-6, -33, 12, 5); H2(-6, -28, 3, 4); }
    else if (hs === 3) { H2(-4, -30, 9, 2); H2(-4, -28, 2, 2); H2(-7, -29, 3, 2); H2(-8, -28, 2, 6); }
    else { R(x(-4), y(-31), 9, 2, sh2); R(x(3), y(-30), 4, 1, sh2); H2(-4, -29, 2, 2); }
    if (!ol && hs !== 4 && t !== 9) R(x(-1), y(hs === 2 ? -33 : -30), 3, 1, lit(hc));
    // team signature accessory
    if (t === 0) { R(x(-2), y(-32 - (hs === 2 ? 2 : 0)), 2, 2, 0xfff1c1); R(x(2), y(-32 - (hs === 2 ? 2 : 0)), 2, 2, 0xfff1c1); }
    if (t === 1) { H2(-7, -30, 3, 2); H2(-8, -28, 3, 2); H2(-7, -26, 2, 2); }
    if (t === 5) { R(x(-5), y(-32), 11, 3, 0xf5f5f5); R(x(-4), y(-33), 9, 1, 0xf5f5f5); R(x(4), y(-30), 3, 1, 0x111111); }
    if (t === 6) { R(x(-5), y(-32), 10, 2, 0xd9a441); R(x(-1), y(-33), 2, 1, 0xd9a441); }
    if (t === 7 && !ol) { R(x(-5), y(-27), 1, 4, dk); R(x(-5), y(-23), 6, 1, dk); R(x(1), y(-23), 1, 1, 0xff3b3b); }
    // arms: always on guard, fists up
    const guard = () => { R(x(1), y(-16), 3, 2, sh2); R(x(4), y(-17), 2, 2, sk); R(x(3), y(-19), 3, 2, sh); R(x(5), y(-22), 2, 4, sh); R(x(5), y(-24), 2, 2, sk); };
    if (ps === 'punch') { R(x(1), y(-16), 3, 2, sh2); R(x(4), y(-17), 2, 2, sk); R(1, y(-20), 9, 2, sh); R(10, y(-21), 3, 3, sk); }
    else if (ps === 'cast') { R(1, y(-20), 8, 2, sh); R(9, y(-21), 2, 3, sk); R(1, y(-17), 7, 2, sh2); R(8, y(-18), 2, 2, sk); }
    else if (ps === 'win') { R(x(1), y(-16), 3, 2, sh2); R(x(4), y(-17), 2, 2, sk); R(3, y(-27), 2, 8, sh); R(3, y(-30), 2, 3, sk); }
    else if (ps === 'block') { R(4, y(-27), 2, 8, sh); R(4, y(-28), 2, 2, sk); R(6, y(-25), 2, 6, sh2); }
    else if (ps === 'hurt') { R(x(-7), y(-21), 2, 5, sh); R(x(-8), y(-23), 2, 2, sk); }
    else if (ps === 'wind') { R(x(1), y(-16), 3, 2, sh2); R(-7, y(-19), 5, 2, sh); R(-9, y(-20), 2, 3, sk); }
    else guard();
  };
  // pass 1: very dark purple outline (not pure black); pass 2: colors (green while turning into code)
  const OC = f.fl > 0 ? W8 : f.mx > 0 ? 0x003b1a : 0x1d1430;
  const gone = (dx, dy) => f.mx > .25 && ((dx * 7 + dy * 13 + ((S.T * 14) | 0)) & 7) / 8 < (f.mx - .25) * 1.4;
  body((dx, dy, w, h) => { if (w * h > 2 && !gone(dx, dy)) { g.fillStyle(OC); g.fillRect(X + (fc > 0 ? dx - 1 : -dx - w - 1) * U, Y + (dy - 1) * U, (w + 2) * U, (h + 2) * U); } }, 1);
  body((dx, dy, w, h, c) => { if (gone(dx, dy)) return; g.fillStyle(f.mx > 0 ? lerpC(c, 0x00ff66, Math.min(1, f.mx * 1.6)) : c); g.fillRect(X + (fc > 0 ? dx : -dx - w) * U, Y + dy * U, w * U, h * U); }, 0);
  if (ps === 'punch') { g.fillStyle(W8, .45); g.fillRect(X + (fc > 0 ? 2 : -11) * U, Y - 20 * U, 9 * U, 2 * U); }
  if (ps === 'cast') { g.fillStyle(T.col, .5); g.fillCircle(X + fc * 12 * U, Y - 19 * U, 4 * U); }
  if (f.stun > 0) for (let k = 0; k < 3; k++) { g.fillStyle(0xffe066); g.fillRect(X + Math.cos(S.T * 6 + k * 2.1) * 22 * sc - 3, Y - 175 * sc + Math.sin(S.T * 6 + k * 2.1) * 6, 6, 6); }
  if (f.inv > 0) { g.fillStyle(0xc39bd3); g.fillRect(X - 3, Y - 190 * sc + Math.sin(S.T * 8) * 4, 6, 10); }
}

// ---------- Efecto "se vuelve código": el luchador vencido se deshace en una lluvia de 0 y 1 ----------
function glyph(g, x, y, one) {
  if (one) g.fillRect(x, y, 2, 8);
  else { g.fillRect(x - 2, y, 6, 2); g.fillRect(x - 2, y + 6, 6, 2); g.fillRect(x - 2, y, 2, 8); g.fillRect(x + 2, y, 2, 8); }
}
function codeRain(g, f) {
  if (!(f.mx > 0)) return;
  const fade = f.dz < 2.4 ? 1 : Math.max(0, 1 - (f.dz - 2.4) * 1.5);
  if (fade <= 0) return;
  const cx = f.x - f.face * 40;
  for (let k = 0; k < 16; k++) {
    const x = Math.round(cx - 80 + k * 10), sp = 140 + (k * 53) % 90;
    const hy = GR - 175 + ((S.T * sp + k * 41) % 200);
    for (let j = 0; j < 7; j++) {
      const y = hy - j * 11;
      if (y < GR - 180 || y > GR - 8) continue;
      const one = ((k * 7 + j * 3 + ((S.T * 9) | 0)) & 1) === 1, al = fade * f.mx * (1 - j / 7);
      g.fillStyle(0x002b12, al); glyph(g, x + 2, y + 2, one);
      g.fillStyle(j ? 0x00ff66 : 0xd8ffe0, al); glyph(g, x, y, one);
    }
  }
}

function drawClock(g, f, X, Y, sc) {
  const r = 58 * sc, cy = Y - 92 * sc, ps = pose(f);
  if (ps === 'ko') { g.fillStyle(0xff3b3b); g.fillEllipse(X, Y - 20, r * 2.2, 40); return; }
  g.fillStyle(0x111111); g.fillRect(X - 26 * sc, Y - 40 * sc, 12 * sc, 40 * sc); g.fillRect(X + 14 * sc, Y - 40 * sc, 12 * sc, 40 * sc);
  g.fillStyle(0xbbbbbb); g.fillCircle(X - 38 * sc, cy - r * .85, 14 * sc); g.fillCircle(X + 38 * sc, cy - r * .85, 14 * sc);
  g.fillStyle(f.fl > 0 ? 0xffffff : 0xff3b3b); g.fillCircle(X, cy, r);
  g.fillStyle(0xfff4e0); g.fillCircle(X, cy, r * .8);
  g.fillStyle(0x111111);
  for (let k = 0; k < 12; k++) g.fillRect(X + Math.cos(k * .5236) * r * .68 - 2, cy + Math.sin(k * .5236) * r * .68 - 2, 4, 4);
  g.lineStyle(5 * sc, 0x111111);
  g.lineBetween(X, cy, X + Math.cos(f.anim * 6) * r * .65, cy + Math.sin(f.anim * 6) * r * .65);
  g.lineBetween(X, cy, X + Math.cos(f.anim * .6) * r * .42, cy + Math.sin(f.anim * .6) * r * .42);
  g.fillStyle(0x111111); g.fillRect(X - 22 * sc, cy - 22 * sc, 14 * sc, 6 * sc); g.fillRect(X + 8 * sc, cy - 22 * sc, 14 * sc, 6 * sc);
  if (ps === 'punch' || ps === 'cast') { g.fillStyle(0xff3b3b); g.fillRect(X + (f.face > 0 ? r - 6 : -r - 44) * 1, cy, 50 * sc, 12 * sc); }
  if (f.stun > 0) { g.fillStyle(0xffe066); g.fillRect(X + Math.cos(S.T * 6) * 30 - 3, cy - r - 14, 6, 6); }
}


// ---------- Each edition's symbol as a small pixel-art "monument" that Nacho photographs ----------
function prop(g, id) {
  const L = [], R = (dx, dy, w, h, c) => L.push([dx, dy, w, h, c]);
  if (id < 2) { R(-6, -8, 12, 8, 0xdfe6e9); R(-6, -12, 12, 4, 0xf5f6f7); R(-5, -14, 10, 2, 0xf5f6f7); R(-3, -15, 6, 1, 0xf5f6f7); R(-1, -15, 2, 7, 0x2c3e50); R(-1, -4, 2, 4, 0x7f8c8d); }
  else if (id === 2) { R(-5, -8, 10, 7, 0x8d5a2b); R(-4, -1, 8, 1, 0x6d4520); R(-4, -10, 8, 2, 0xc9c9c9); R(-3, -11, 6, 1, 0x6a9a3a); R(1, -16, 1, 6, 0xbdc3c7); R(2, -17, 2, 1, 0xbdc3c7); R(-3, -6, 2, 3, 0xa8743f); }
  else if (id === 3) { R(-6, -2, 12, 2, 0x9e9e9e); R(-5, -13, 10, 8, 0xf5f5f5); R(-4, -5, 8, 3, 0xf5f5f5); R(-3, -11, 2, 2, 0x8e44ad); R(1, -11, 2, 2, 0x27ae60); R(-1, -13, 2, 1, 0xe84393); R(-1, -8, 2, 1, 0x333333); R(-3, -4, 1, 1, 0x333333); R(-1, -4, 1, 1, 0x333333); R(1, -4, 1, 1, 0x333333); R(-5, -12, 1, 1, 0xf5c400); R(4, -12, 1, 1, 0xf5c400); }
  else if (id === 4) { R(-9, -9, 18, 7, 0xf1c40f); R(-9, -10, 18, 1, 0xc0392b); R(-9, -5, 18, 1, 0xe74c3c); R(-9, -3, 18, 1, 0x2980b9); for (let k = 0; k < 4; k++) R(-8 + k * 4, -8, 3, 2, 0x34495e); R(-6, -12, 5, 2, 0x8e5a2f); R(1, -12, 4, 2, 0x27ae60); R(-7, -2, 3, 2, 0x111111); R(4, -2, 3, 2, 0x111111); }
  else if (id > 7) { R(-10, -6, 19, 4, 0xf5f6f7); R(-12, -5, 2, 3, 0xf5f6f7); R(6, -11, 3, 5, 0xc0362c); R(-9, -5, 13, 1, 0x2980b9); R(-3, -3, 8, 1, 0xbdc3c7); R(-7, -2, 1, 2, 0x111111); R(4, -2, 1, 2, 0x111111); }
  else { R(0, -9, 1, 9, 0x5d4037); R(-3, -9, 7, 1, 0x5d4037); R(-1, -15, 3, 6, 0xe74c3c); R(0, -17, 3, 2, 0xe74c3c); R(3, -16, 1, 2, 0xffe066); R(1, -16, 1, 1, 0x111111); R(-2, -13, 2, 4, 0x2980b9); R(-1, -10, 2, 4, 0xf1c40f); }
  const U = 4, X = 640, Y = GR - 2;
  for (const ol of [1, 0]) for (const [dx, dy, w, h, c] of L) { g.fillStyle(ol ? 0x1d1430 : c); g.fillRect(X + (dx - ol) * U, Y + (dy - ol) * U, (w + 2 * ol) * U, (h + 2 * ol) * U); }
}


// Power-up for each monument. Nacho takes the photo (flash) and the fighter gets a boost.
function boost(f, id) {
  S.fl = .3; snd('heal'); spark(640, GR - 40, 0xf2ff00, 16);
  if (id < 2) { f.sh = 5; flt(f, '¡BOOST OBSERVATORIO: ESCUDO!', '#f2ff00'); }
  else if (id === 2) { f.hp = Math.min(100, f.hp + 20); flt(f, '¡BOOST MATE: +20 VIDA!', '#f2ff00'); }
  else if (id === 3) { f.buff = 6; flt(f, '¡BOOST CALAVERA: MÁS DAÑO!', '#f2ff00'); }
  else if (id === 4) { f.m = 100; flt(f, '¡BOOST CHIVA: SÚPER LISTO!', '#f2ff00'); }
  else if (id > 7) { f.cd = [0, 0]; f.m = 100; flt(f, '¡BOOST AVIÓN: TODOS LOS PODERES!', '#f2ff00'); }
  else { f.cd = [0, 0]; f.m = Math.min(100, f.m + 40); flt(f, '¡BOOST GUACAMAYA: PODERES LISTOS!', '#f2ff00'); }
}

function nacho(g, x, y, s, flash, d = 1) {
  const R = (dx, dy, w, h, c) => { g.fillStyle(c); g.fillRect(x + (d > 0 ? dx : -dx - w) * s, y + dy * s, w * s, h * s); };
  R(-4, -10, 3, 10, 0x2d3047); R(1, -10, 3, 10, 0x2d3047); R(-5, -20, 10, 10, 0x1abc9c);
  R(-4, -27, 8, 7, 0xe0ac69); R(-4, -28, 8, 2, 0x1b1b1b); R(-5, -27, 2, 3, 0x1b1b1b);
  R(2, -19, 4, 2, 0xe0ac69); R(3, -25, 7, 5, 0x111111); R(9, -24, 2, 3, 0x555555); R(4, -26, 2, 1, 0x111111);
  if (flash) { g.fillStyle(0xffffff, .9); g.fillCircle(x + d * 12 * s, y - 22 * s, 9 * s); }
}

function banana(g, x, y, r, w) {
  g.lineStyle(w, 0xffe135); g.beginPath(); g.arc(x, y, r, Math.PI * .12, Math.PI * .88, false); g.strokePath();
  g.fillStyle(0x6d4c2f);
  g.fillCircle(x + Math.cos(Math.PI * .12) * r, y + Math.sin(Math.PI * .12) * r, w * .3);
  g.fillCircle(x + Math.cos(Math.PI * .88) * r, y + Math.sin(Math.PI * .88) * r, w * .3);
}

function drawP(g, p) {
  const x = p.x, y = p.y, d = p.vx >= 0 ? 1 : -1;
  switch (p.k) {
    case 'fire': g.fillStyle(0xff5b1a); g.fillRect(x - 10, y - 10, 20, 20); g.fillStyle(0xffe066); g.fillRect(x - 5, y - 5, 10, 10); if (Math.random() < .5) spark(x - d * 10, y, 0xff9b3d, 1); break;
    case 'arrow': g.fillStyle(0x2ecc71); g.fillRect(x - 14, y - 3, 22, 6); g.fillTriangle(x + d * 16, y, x + d * 4, y - 10, x + d * 4, y + 10); break;
    case 'scan': g.fillStyle(0x66ddff, .8); g.fillRect(x - 30, y - 4, 60, 8); g.fillStyle(0xffffff); g.fillRect(x - 30, y - 1, 60, 2); break;
    case 'q': case 'quiz':
      g.fillStyle(p.k === 'q' ? 0x8e44ad : 0xffffff); g.fillRect(x - 12, y - 14, 24, 28);
      g.fillStyle(p.k === 'q' ? 0xffffff : 0x8e44ad); g.fillRect(x - 5, y - 9, 10, 3); g.fillRect(x + 3, y - 9, 3, 8); g.fillRect(x - 2, y - 2, 5, 3); g.fillRect(x - 2, y + 5, 4, 4); break;
    case 'red': g.fillStyle(0x000000); g.fillRect(x - 20, y - 7, 40, 14); g.lineStyle(2, 0xffffff); g.strokeRect(x - 20, y - 7, 40, 14); break;
    case 'book': g.fillStyle(0x8e5a2f); g.fillRect(x - 11, y - 8, 22, 16); g.fillStyle(0xffffff); g.fillRect(x - 9, y - 6, 18, 2); g.fillStyle(0xe84393); g.fillRect(x - 1, y - 8, 2, 16); break;
    case 'buddy': { const s = Math.round(Math.sin(S.T * 20) * 2); g.fillStyle(0x9c7cf6); g.fillRect(x - 10, y - 14, 20, 14); g.fillRect(x + d * 6 - 4, y - 22, 10, 10); g.fillStyle(0xffffff); g.fillRect(x + d * 8, y - 19, 3, 3); g.fillStyle(0x2d3047); g.fillRect(x - 8 + s, y, 5, 6); g.fillRect(x + 3 - s, y, 5, 6); break; }
    case 'heart': g.fillStyle(0xff3b8d); g.fillCircle(x - 8, y - 6, 11); g.fillCircle(x + 8, y - 6, 11); g.fillTriangle(x - 18, y - 2, x + 18, y - 2, x, y + 18); break;
    case 'wave': g.lineStyle(4, 0xf5c400); for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x - d * 20, y, 12 + k * 10, d > 0 ? -.8 : Math.PI - .8, d > 0 ? .8 : Math.PI + .8, false); g.strokePath(); } break;
    case 'rock': g.fillStyle(0x7f8c8d); g.fillRect(x - 10, y - 10, 20, 20); g.fillStyle(0x4d5656); g.fillRect(x - 10, y + 4, 20, 6); break;
    case 'pillar': g.fillStyle(0xe8e0d0); g.fillRect(x - 18, y - 40, 36, 80); g.fillStyle(0xbdb5a3); g.fillRect(x - 10, y - 34, 4, 70); g.fillRect(x + 6, y - 34, 4, 70); g.fillRect(x - 22, y - 44, 44, 8); break;
    case 'clip': g.fillStyle(0x8d6e4f); g.fillRect(x - 10, y - 13, 20, 26); g.fillStyle(0xffffff); g.fillRect(x - 7, y - 8, 14, 18); g.fillStyle(0x888888); g.fillRect(x - 4, y - 15, 8, 4); break;
    case 'clock': g.fillStyle(0xffffff); g.fillCircle(x, y, 13); g.lineStyle(3, 0x111111); g.strokeCircle(x, y, 13); g.lineBetween(x, y, x + Math.cos(S.T * 12) * 9, y + Math.sin(S.T * 12) * 9); break;
    case 'robot': g.fillStyle(0x95a5a6); g.fillRect(x - 30, y - 30, 60, 60); g.fillStyle(0xe1ff00); g.fillRect(x - 18, y - 16, 10, 8); g.fillRect(x + 8, y - 16, 10, 8); g.fillStyle(0x34495e); g.fillRect(x - 15, y + 8, 30, 6); g.fillRect(x - 3, y - 42, 6, 12); break;
    case 'peel': g.fillStyle(0xffe135); g.fillRect(x - 14, y - 2, 28, 6); g.fillRect(x - 14, y - 8, 6, 6); g.fillRect(x + 8, y - 8, 6, 6); g.fillRect(x - 3, y - 10, 6, 8); g.fillStyle(0x6d4c2f); g.fillRect(x - 2, y - 13, 4, 3); break;
    case 'ban': g.fillStyle(0xffe135); g.fillRect(x - 10, y - 2, 20, 6); g.fillRect(x - 14, y - 7, 5, 6); g.fillRect(x + 9, y - 7, 5, 6); g.fillStyle(0x6d4c2f); g.fillRect(x - 15, y - 9, 3, 3); g.fillRect(x + 12, y - 9, 3, 3); break;
    case 'hand': g.fillStyle(0x111111); g.fillRect(x - 16, y - 3, 32, 6); g.fillTriangle(x + d * 22, y, x + d * 10, y - 8, x + d * 10, y + 8); break;
  }
}

// ---------- Escenarios ----------
function P(a) { const o = []; for (let i = 0; i < a.length; i += 2) o.push({ x: a[i], y: a[i + 1] }); return o; }
function sky(g, a, b) {
  for (let i = 0; i < 8; i++) {
    const y = i * 65;
    g.fillStyle(lerpC(a, b, i / 7)); g.fillRect(0, y, W, 65);
    if (i < 7) { g.fillStyle(lerpC(a, b, (i + 1) / 7)); for (let x = 0; x < W; x += 8) { g.fillRect(x, y + 57, 4, 4); g.fillRect(x + 4, y + 61, 4, 4); } }
  }
}
function mtn(g, a, c) { g.fillStyle(c); g.fillPoints(P(a), true); }
let seed = 1;
const rr = () => (seed = seed * 16807 % 2147483647) / 2147483647;
function city(g, sd, c, y0, mn, mx, win) {
  seed = sd;
  for (let x = -10; x < W;) {
    const w = 30 + rr() * 45, h = mn + rr() * (mx - mn);
    g.fillStyle(c); g.fillRect(x, y0 - h, w, h);
    if (win) for (let yy = y0 - h + 8; yy < y0 - 8; yy += 14) for (let xx = x + 6; xx < x + w - 8; xx += 12) if (rr() < .55) { g.fillStyle(win); g.fillRect(xx, yy, 5, 6); }
    x += w + 4;
  }
}
function ground(g, c, line) { g.fillStyle(c); g.fillRect(0, GR, W, H - GR); g.fillStyle(line); g.fillRect(0, GR, W, 4); }
function snow(g, pk) { g.fillStyle(0xffffff); for (let i = 0; i < pk.length; i += 2) g.fillTriangle(pk[i], pk[i + 1], pk[i] - 26, pk[i + 1] + 28, pk[i] + 26, pk[i + 1] + 28); }
function tower(g, x, c, win) { g.fillStyle(c); g.fillRect(x, 150, 40, 290); g.fillTriangle(x, 150, x + 40, 150, x + 20, 115); g.fillStyle(win); for (let y = 160; y < 430; y += 12) g.fillRect(x + 4, y, 32, 3); }


function drawStage(g, id) {
  const AND = [0, 330, 90, 190, 170, 260, 260, 150, 370, 250, 470, 170, 580, 260, 680, 180, 800, 280, 800, 440, 0, 440];
  const PK = [90, 190, 260, 150, 470, 170, 680, 180];
  if (id === 0) {
    sky(g, 0x7ec8ff, 0xffd1a1); mtn(g, AND, 0x7d8bb0); snow(g, PK);
    city(g, 7, 0x5d6d7e, 445, 40, 120, 0xffe9a8); tower(g, 610, 0x2c3e50, 0x5dade2); ground(g, 0x5c5c5c, 0x8a8a8a);
  } else if (id === 1) {
    sky(g, 0x0b1d3a, 0x2c3e70); seed = 3;
    g.fillStyle(0xffffff); for (let i = 0; i < 50; i++) g.fillRect(rr() * W, rr() * 250, 2, 2);
    g.fillStyle(0xf5f3ce); g.fillCircle(680, 90, 30);
    mtn(g, AND, 0x1e2a44); g.fillStyle(0xcfd8e8); for (let i = 0; i < PK.length; i += 2) g.fillTriangle(PK[i], PK[i + 1], PK[i] - 24, PK[i + 1] + 26, PK[i] + 24, PK[i + 1] + 26);
    city(g, 11, 0x17202a, 445, 40, 110, 0xf7dc6f); tower(g, 640, 0x1b2631, 0xf7dc6f);
    for (let k = 0; k < 6; k++) { g.fillStyle(0x4e342e); g.fillRect(280 + k * 12, 440 - (k + 1) * 42, 240 - k * 24, 42); g.fillStyle(0x27ae60); g.fillRect(280 + k * 12, 440 - (k + 1) * 42, 240 - k * 24, 6); g.fillStyle(0xffd27f); for (let x = 290 + k * 12; x < 510 - k * 12; x += 18) g.fillRect(x, 440 - (k + 1) * 42 + 14, 8, 14); }
    ground(g, 0x2c2c34, 0x4a4a55);
  } else if (id === 2) {
    sky(g, 0x6ec6ff, 0xd6f0ff); g.fillStyle(0xfff3b0); g.fillCircle(120, 100, 40);
    city(g, 5, 0x8e9aaf, 445, 60, 150, 0xd6eaf8);
    g.fillStyle(0xf2f0e6); g.fillPoints(P([378, 470, 422, 470, 410, 170, 400, 135, 390, 170]), true);
    g.fillStyle(0xd5d2c4); g.fillPoints(P([400, 470, 422, 470, 410, 170, 400, 135]), true); g.fillStyle(0x333333); g.fillRect(397, 160, 6, 6);
    ground(g, 0x55585e, 0x7a7d84); g.fillStyle(0xffffff); for (let x = 0; x < W; x += 80) g.fillRect(x, 560, 40, 4);
    g.fillStyle(0x6d4c2f); g.fillRect(28, 415, 12, 105); g.fillRect(220, 415, 12, 105);
    g.fillStyle(0x8d6e4f); for (let y = 425; y < 515; y += 18) g.fillRect(40, y, 180, 7);
    g.lineStyle(7, 0x8d6e4f); g.lineBetween(42, 510, 220, 428);
  } else if (id === 3) {
    sky(g, 0xff9a8b, 0xffd59e); city(g, 9, 0x6c7a89, 445, 70, 170, 0xa9cce3);
    g.fillStyle(0x9e9e9e); g.fillRect(365, 440, 70, 40); g.fillStyle(0xe0d6b8); g.fillRect(388, 175, 24, 265); g.fillRect(380, 168, 40, 10);
    g.fillStyle(0xc9bd9c); for (let y = 200; y < 430; y += 40) g.fillRect(388, y, 24, 4);
    g.fillStyle(0xffc300); g.fillRect(395, 122, 10, 46); g.fillTriangle(395, 132, 368, 108, 395, 152); g.fillTriangle(405, 132, 432, 108, 405, 152); g.fillCircle(400, 116, 7);
    ground(g, 0xb08968, 0xd4b896); g.fillStyle(0x9c7656); for (let x = 0; x < W; x += 50) g.fillRect(x, GR, 2, H - GR);
  } else if (id === 4) {
    sky(g, 0x7f8c99, 0xc4ccd4); g.fillStyle(0xdfe4ea); for (const [x, y] of [[150, 80], [190, 70], [560, 110], [600, 95], [640, 110]]) g.fillCircle(x, y, 30);
    mtn(g, [0, 440, 120, 260, 260, 120, 330, 108, 420, 240, 560, 330, 800, 360, 800, 440], 0x2e5e3e);
    mtn(g, [0, 440, 160, 320, 300, 230, 420, 330, 560, 400, 0, 440], 0x3d7a50);
    g.fillStyle(0xffffff); g.fillRect(312, 92, 26, 18); g.fillRect(330, 78, 6, 16); g.fillStyle(0xc0392b); g.fillTriangle(310, 92, 340, 92, 325, 82);
    city(g, 13, 0x9c4a2f, 445, 50, 120, 0xf3d9a4); ground(g, 0x2f3640, 0x57606f);
    g.fillStyle(0x57606f, .6); for (let x = 20; x < W; x += 90) g.fillRect(x, 540 + (x % 3) * 12, 50, 3);
  } else if (id === 5) {
    sky(g, 0x4fb3ff, 0xbfe6ff); mtn(g, [0, 330, 150, 210, 300, 180, 450, 200, 600, 170, 800, 240, 800, 440, 0, 440], 0x3f7d3a);
    g.lineStyle(3, 0x2f5f2c); g.lineBetween(150, 210, 210, 330); g.lineBetween(450, 200, 400, 340); g.lineBetween(600, 170, 660, 320);
    g.fillStyle(0x7f8c8d); g.fillRect(560, 185, 46, 260); g.fillRect(620, 175, 46, 270);
    g.fillStyle(0xbdc3c7); for (let y = 195; y < 440; y += 14) { g.fillRect(565, y, 36, 4); g.fillRect(625, y - 6, 36, 4); }
    city(g, 17, 0xb07d62, 445, 30, 70, 0xfdebd0);
    for (const x of [90, 300, 740]) { g.fillStyle(0x5d4037); g.fillRect(x - 4, GR - 70, 8, 70); g.fillStyle(0xffd400); g.fillCircle(x, GR - 85, 30); g.fillStyle(0xf1c40f); g.fillCircle(x - 20, GR - 72, 18); g.fillCircle(x + 22, GR - 74, 18); }
    ground(g, 0xcaa472, 0xe0c393);
  } else if (id === 6) {
    g.fillStyle(0x15180a); g.fillRect(0, 0, W, H); g.fillStyle(0x1f2410); for (let x = 0; x < W; x += 100) g.fillRect(x, 0, 50, GR);
    banana(g, 400, 150, 100, 30);
    g.fillStyle(0x0b0d05); g.fillRect(590, 110, 170, 70); g.lineStyle(3, 0xe1ff00); g.strokeRect(590, 110, 170, 70);
    g.fillStyle(0x3b3f1e); for (const x of [60, 560]) { g.fillRect(x, 440, 180, 14); g.fillRect(x + 10, 454, 8, 66); g.fillRect(x + 160, 454, 8, 66); g.fillStyle(0x95a5a6); g.fillRect(x + 30, 424, 40, 16); g.fillRect(x + 110, 424, 40, 16); g.fillStyle(0x3b3f1e); }
    ground(g, 0x2a2d12, 0xe1ff00);
  } else if (id === 8) {
    sky(g, 0xff9a76, 0xffe1c6); g.fillStyle(0xfff0b3); g.fillCircle(640, 300, 46);
    mtn(g, [520, 400, 640, 300, 800, 330, 800, 400], 0x5b6b4a);
    g.fillStyle(0x2c5f7c); g.fillRect(0, 380, W, 140); g.fillStyle(0x4f86a6); for (let x = 0; x < W; x += 60) g.fillRect(x + (x % 120 ? 20 : 0), 420 + (x % 7) * 8, 34, 3);
    const RC = 0xc0362c; g.lineStyle(3, RC);
    for (let i = 0; i < 40; i++) { const f = u => u < 230 ? 120 + (230 - u) * .55 : u > 570 ? 120 + (u - 570) * .55 : 120 + 180 * (1 - Math.pow((u - 400) / 170, 2)); const a = i * 20, b = a + 20; g.lineBetween(a, f(a), b, f(b)); if (i % 2) g.lineBetween(a, f(a), a, 330); }
    g.fillStyle(RC); g.fillRect(0, 330, W, 14);
    for (const x of [230, 570]) { g.fillRect(x - 12, 110, 24, 290); for (const y of [140, 210, 280]) g.fillRect(x - 18, y, 36, 8); }
    g.fillStyle(0xffffff, .35); for (const [x, y] of [[150, 360], [330, 372], [520, 356], [700, 368]]) g.fillEllipse(x, y, 260, 34);
    ground(g, 0x6b5b4b, 0x8d7b68);
  } else {
    g.fillStyle(0x14040a); g.fillRect(0, 0, W, H); g.lineStyle(1, 0xff3b3b, .15);
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, GR); for (let y = 0; y < GR; y += 40) g.lineBetween(0, y, W, y);
    g.lineStyle(6, 0x5a0f1a); g.strokeCircle(400, 230, 170);
    g.fillStyle(0x5a0f1a); for (let k = 0; k < 12; k++) g.fillRect(400 + Math.cos(k * .5236) * 150 - 5, 230 + Math.sin(k * .5236) * 150 - 5, 10, 10);
    ground(g, 0x220810, 0xff3b3b);
  }
}

function stageFx(g, id) {
  if (id === 3) {
    const C = [0xe84393, 0xf5c400, 0x27ae60, 0x00b4e6, 0xff7b29, 0x8e44ad];
    for (const y0 of [30, 75]) {
      g.lineStyle(2, 0x333333); g.lineBetween(0, y0, W, y0);
      for (let k = 0; k < 14; k++) {
        const x = k * 58 + (y0 > 50 ? 25 : 0), dy = Math.sin(S.T * 2 + k + y0) * 3;
        g.fillStyle(C[(k + (y0 > 50 ? 3 : 0)) % 6]); g.fillRect(x, y0 + dy, 42, 32);
        g.fillStyle(0xffb894); g.fillRect(x + 8, y0 + dy + 8, 6, 6); g.fillRect(x + 26, y0 + dy + 8, 6, 6); g.fillRect(x + 17, y0 + dy + 18, 6, 6);
      }
    }
  }
  if (id === 4) { g.lineStyle(1, 0xaabbcc, .6); for (let k = 0; k < 70; k++) { const x = (k * 137 + S.T * 90) % W, y = (k * 91 + S.T * 650) % H; g.lineBetween(x, y, x - 3, y + 12); } }
  if (id === 7 && Math.random() < .08) { g.fillStyle(0xff3b3b, .3); g.fillRect(0, rnd(0, GR), W, rnd(3, 14)); }
  const fl = (S.T % 4) < .12;
  if (id % 8 < 6) { if (!(S.pkt > 0)) { g.fillStyle(0xf2ff00, .18 + Math.sin(S.T * 6) * .1); g.fillCircle(640, GR - 30, 44); prop(g, id); } nacho(g, 745, GR - 4, 2.4, fl, -1); } else nacho(g, 750, GR - 4, 2.4, fl);
}


// ---------- Menu style (inspired by the Platanus site look): neon yellow on dark gray + wireframe floor ----------
const Y = 0xf2ff00;
function menuBg(g) {
  g.fillStyle(0x1a1a1a); g.fillRect(0, 0, W, H);
  for (let r = 260; r > 40; r -= 40) { g.fillStyle(Y, .018); g.fillCircle(W / 2, 150, r); }
  g.lineStyle(1, Y, .22);
  for (let i = -12; i <= 12; i++) g.lineBetween(W / 2 + i * 14, 430, W / 2 + i * 120, H);
  for (let k = 0; k < 7; k++) { const y = 430 + k * k * 4.2; g.lineBetween(0, y, W, y); }
  g.lineStyle(1, Y, .35); g.strokeRect(12, 12, W - 24, H - 24);
}

// ---------- Pantalla: titulo ----------
function initTitle() {
  const g = S.bg;
  menuBg(g);
  tx(40, 36, 'platanus hack [26]', 18, '#f2ff00', 0);
  tx(760, 36, 'ARCADE · SANTIAGO', 11, '#b8c48d', 1);
  tx(W / 2, 128, 'FIGHTERS', 92, '#f2ff00').setShadow(0, 0, '#f2ff00', 18, false, true);
  tx(W / 2, 196, 'LOS GANADORES DE CADA SEDE, CARA A CARA', 12, '#b8c48d');
  g.fillStyle(Y); g.fillRect(190, 248, 420, 40); g.lineStyle(2, Y); g.strokeRect(190, 298, 420, 40);
  S.b1 = tx(W / 2, 268, 'START 1 · ARCADE', 20, '#1a1a1a');
  S.b2 = tx(W / 2, 318, 'START 2 · VERSUS', 20, '#f2ff00');
  const rk = Object.keys(S.tw).filter(k => S.tw[k] > 0).sort((a, b) => S.tw[b] - S.tw[a]).slice(0, 3);
  tx(W / 2, 358, rk.length ? 'COPA DE SEDES: ' + rk.map(k => TEAMS[k].n + ' ' + S.tw[k]).join(' · ') : 'COPA DE SEDES: GANA PELEAS PARA SUMARLE A TU EQUIPO', 11, '#b8c48d');
  tx(W / 2, 378, 'LOGROS ' + pc(S.ach.a) + '/8 · FINALES ' + pc(S.ach.e) + '/3', 11, '#b8c48d');
  tx(W / 2, 398, S.hs.length ? 'RÉCORDS: ' + S.hs.slice(0, 3).map((e, i) => (i + 1) + '. ' + e.n + ' ' + e.s).join('  ') : 'RÉCORDS: TODAVÍA NADIE. SÉ EL PRIMERO.', 12, '#e1ff00');
  S.demo = SELT.map((t, j) => { const f = mkF(0, t, TEAMS[t].m[j % 5], '', 0); f.face = j < 4 ? 1 : -1; return f; });
}
function updTitle(dt) {
  S.g.clear();
  S.demo.forEach((f, j) => { f.anim += dt; drawF(S.g, f, 58 + j * 97, 585, .85); });
  S.b1.setAlpha(S.T % 1 < .6 ? 1 : .55);
  if (pr('START1')) { snd('ok'); S.np = 1; go('sel'); }
  else if (pr('START2')) { snd('ok'); S.np = 2; go('sel'); }
}

// ---------- Pantalla: seleccion ----------
function initSel() {
  const g = S.bg;
  menuBg(g); g.fillStyle(Y, .35); g.fillRect(399, 0, 2, H);
  S.sel = [0, 1].map(i => {
    const s = { ph: i < S.np ? 0 : 9, t: i ? 6 : 4, m: 0, lk: null, nm: [], cur: 0, cx: 200 + i * 400 };
    s.lk = TEAMS[s.t].m[0].split('').map(Number);
    s.d = mkF(i, s.t, s.lk, '', 0);
    tx(s.cx, 28, 'JUGADOR ' + (i + 1), 20, i ? '#ff6ec7' : '#e1ff00');
    s.tT = tx(s.cx, 120, '', 24); s.tC = tx(s.cx, 148, '', 13, '#b8c48d');
    s.tP = tx(s.cx, 196, '', 12, '#f7ffd8');
    s.tM = tx(s.cx, 455, '', 14, '#b8c48d'); s.tN = tx(s.cx, 488, '', 24, '#ffffff');
    s.tH = tx(s.cx, 545, '', 12, '#e1ff00');
    return s;
  });
  if (S.np === 1) tx(600, 300, 'MODO ARCADE\n\nPELEAS CONTRA 3 EQUIPOS,\nLUEGO CONTRA RAFA\n(CON NACHO EN LA CÁMARA)\nY AL FINAL... EL DEADLINE', 15, '#f7ffd8');
}
function updSel(dt) {
  S.g.clear();
  let ready = 0;
  S.sel.forEach((s, i) => {
    if (s.ph === 9) return;
    const P = i ? 'P2_' : 'P1_';
    if (s.ph === 0) {
      let ch = 0;
      if (pr(P + 'D') || pr(P + 'R')) { s.t = SELT[(SELT.indexOf(s.t) + 1) % 8]; ch = 1; }
      if (pr(P + 'U') || pr(P + 'L')) { s.t = SELT[(SELT.indexOf(s.t) + 7) % 8]; ch = 1; }
      if (ch) { s.m = 0; s.lk = TEAMS[s.t].m[0].split('').map(Number); snd('sel'); }
      if (pr(P + '1')) { s.ph = 1; snd('ok'); }
    } else if (s.ph === 1) {
      if (pr(P + 'R')) { s.m = (s.m + 1) % 5; s.lk = TEAMS[s.t].m[s.m].split('').map(Number); snd('sel'); }
      if (pr(P + 'L')) { s.m = (s.m + 4) % 5; s.lk = TEAMS[s.t].m[s.m].split('').map(Number); snd('sel'); }
      if (pr(P + '2')) { s.lk[2] = (s.lk[2] + 1) % 5; snd('sel'); }
      if (pr(P + '3')) { s.lk[0] = (s.lk[0] + 1) % 6; snd('sel'); }
      if (pr(P + '4')) { s.lk[1] = (s.lk[1] + 1) % 7; snd('sel'); }
      if (pr(P + '5')) { s.lk[3] = s.lk[3] ? 0 : 1; snd('sel'); }
      if (pr(P + '1')) { s.ph = 2; s.nm = (S.names[i] || 'P' + (i + 1)).split(''); s.cur = s.nm.length - 1; snd('ok'); }
      if (pr(P + '6')) s.ph = 0;
    } else if (s.ph === 2) {
      const ci = CH.indexOf(s.nm[s.cur]), n = CH.length;
      if (pr(P + 'U')) { s.nm[s.cur] = CH[(ci + 1) % n]; snd('sel'); }
      if (pr(P + 'D')) { s.nm[s.cur] = CH[(ci - 1 + n) % n]; snd('sel'); }
      if (pr(P + 'R')) { if (s.cur < s.nm.length - 1) s.cur++; else if (s.nm.length < 8) { s.nm.push('A'); s.cur++; } }
      if (pr(P + 'L') && s.cur > 0) s.cur--;
      if (pr(P + '2') && s.nm.length > 1) { s.nm.splice(s.cur, 1); s.cur = Math.min(s.cur, s.nm.length - 1); }
      if (pr(P + '1')) { s.name = s.nm.join('').trim() || 'P' + (i + 1); S.names[i] = s.name; save(); s.ph = 3; snd('ok'); }
      if (pr(P + '6')) s.ph = 1;
    } else if (pr(P + '6')) s.ph = 2;
    if (s.ph === 3) ready++;
    const T = TEAMS[s.t];
    for (let j = 0; j < 8; j++) { const k = SELT[j]; S.g.fillStyle(TEAMS[k].col, k === s.t ? 1 : .35); S.g.fillRect(s.cx - 138 + j * 35, 60, 29, 26); if (k === s.t) { S.g.lineStyle(3, 0xffffff); S.g.strokeRect(s.cx - 140 + j * 35, 58, 36, 30); } }
    s.tT.setText((s.ph === 0 ? '◄ ' : '') + T.n + (s.ph === 0 ? ' ►' : '')).setColor('#' + T.col.toString(16).padStart(6, '0'));
    s.tC.setText(T.c);
    s.tP.setText('3 · ' + T.p[0] + '\n4 · ' + T.p[1] + '\n5 · SÚPER: ' + T.p[2]);
    s.d.t = s.t; s.d.look = s.lk; s.d.anim += dt; s.d.win = s.ph === 3 ? 1 : 0;
    drawF(S.g, s.d, s.cx, 438, 1.15);
    s.tM.setText(s.ph >= 1 ? 'INTEGRANTE ' + (s.m + 1) + ' DE 5' : '');
    s.tN.setText(s.ph === 2 ? s.nm.map((c, k) => k === s.cur ? '[' + c + ']' : c).join('') : s.ph === 3 ? s.name : '');
    s.tH.setText(['▲▼ ELIGE TU EQUIPO · BOTÓN 1 OK', '◄► INTEGRANTE · 2 PEINADO · 3 PIEL\n4 COLOR DE PELO · 5 LENTES\n1 OK · 6 ATRÁS', '▲▼ LETRA · ◄► MOVER · 2 BORRAR\n1 LISTO · 6 ATRÁS', '¡LISTO! ESPERANDO...  (6 ATRÁS)'][s.ph]);
  });
  if (ready === S.np) {
    S.rt = (S.rt || 0) + dt;
    if (S.rt > .5) {
      S.rt = 0;
      const a = S.sel[0];
      S.hum = { t: a.t, lk: a.lk.slice(), name: a.name };
      if (S.np === 2) {
        const b = S.sel[1];
        S.F = [mkF(0, a.t, a.lk, a.name, 0), mkF(1, b.t, b.lk, b.name, 0)];
        S.stage = Math.random() < .5 ? TEAMS[Math.random() < .5 ? a.t : b.t].st : [0, 1, 2, 3, 4, 5, 6, 8][Math.random() * 8 | 0]; S.lv = 0;
        go('vs');
      } else {
        S.lad = SELT.filter(x => x !== a.t).sort(() => Math.random() - .5).slice(0, 3).concat([7, 8]);
        S.li = 0; S.ch = []; S.pts = 0; go('story');
      }
    }
  } else S.rt = 0;
}
function nextArcade() {
  const t = S.lad[S.li], h = S.hum, T = TEAMS[t];
  S.F = [mkF(0, h.t, h.lk, h.name, 0), mkF(1, t, T.m[(Math.random() * T.m.length) | 0], T.n, 1)];
  S.stage = T.st; S.lv = S.li;
  go('vs');
}


// ---------- Historia del modo arcade (ramificar y converger) ----------
// Cada pelea es una hora del hackatón. Entre peleas hay una decisión con costo y beneficio.
// Las peleas siguen siendo las mismas (los caminos convergen), pero las decisiones se recuerdan:
// cambian reglas de la siguiente pelea, lo que dicen los jefes y el final.
const HR = ['VIE 23:00 · ARRANCA EL RELOJ', 'SÁB 05:00 · LA MADRUGADA', 'SÁB 15:00 · EL PIVOTE', 'DOM 08:00 · ENSAYO CON RAFA', 'DOM 10:59 · EL DEADLINE'];
const QT = ['¿AHORRASTE PARA ESTA PELEA?', 'COPIO TU ESTRATEGIA. COMISIÓN CERO.', 'YA ESCANEÉ TU CARA. NO ME OLVIDARÁS.', 'ESA JUGADA NO PASA LA REGLA.', 'ELIGE BIEN: ESTE CUENTO TIENE FINAL.', 'SIN INTERNET TAMBIÉN TE ENCUENTRO.', 'BIENVENIDO A MI PALACIO. HAY EXAMEN.', 'DE CERO A PRODUCTO. ¿TÚ QUÉ TRAJISTE?', 'TIC, TAC. NADIE ME HA GANADO.', 'NADIE SOBREVIVE A LA CÁSCARA.'];
const CHO = [
  { q: 'SON LAS 4 AM Y EL EQUIPO ESTÁ MUERTO.', a: ['DORMIR 2 HORAS', 'SEGUIR HACKEANDO'], d: ['VIDA COMPLETA,\nSIN SÚPER', 'SÚPER LLENO,\nPERO 75% DE VIDA'] },
  { q: 'UN MENTOR DICE QUE LA IDEA NO CONVENCE.', a: ['PIVOTEAR', 'DEFENDER LA IDEA'], d: ['PODERES SE RECARGAN\n30% MÁS RÁPIDO', 'GOLPES CON\n20% MÁS DAÑO'] },
  { q: 'FALTAN 3 HORAS PARA PRESENTAR.', a: ['DEPLOY A PRODUCCIÓN', 'PULIR LA DEMO LOCAL'], d: ['EL FLASH DE NACHO\nYA NO TE ATURDE', 'RAFA EMPIEZA CON\n20% MENOS VIDA'] },
];
function quote(f) {
  if (S.np === 1 && f.t === 7) return S.ch[2] === 0 ? 'VI TU DEPLOY. VEAMOS SI AGUANTA.' : 'DEMO LOCAL, ¿EH? LA REGLA ES PRODUCCIÓN.';
  if (S.np === 1 && f.t === 8) return S.ch[0] === 0 ? 'DORMISTE. YO NUNCA DUERMO.' : 'TE VES CANSADO. PERFECTO.';
  return QT[f.t];
}
function initStory() {
  menuBg(S.bg);
  tx(W / 2, 90, 'DESTINO · SANTIAGO, CHILE', 11, '#b8c48d');
  tx(W / 2, 140, '20 DE NOVIEMBRE', 40, '#f2ff00').setShadow(0, 0, '#f2ff00', 14, false, true);
  tx(W / 2, 250, '7 SEDES. 7 CAMPEONES.\n36 HORAS PARA LLEGAR\nA LA FOTO CON EL EQUIPO PLATANUS.\n\nCADA DECISIÓN DE TU EQUIPO\nCAMBIA LO QUE VIENE.', 18, '#ffffff');
  tx(W / 2, 400, 'TU EQUIPO: ' + TEAMS[S.hum.t].n + ' (' + TEAMS[S.hum.t].c + ')', 16, '#' + TEAMS[S.hum.t].col.toString(16).padStart(6, '0'));
  S.b1 = tx(W / 2, 520, 'BOTÓN 1 · EMPEZAR', 16, '#b8c48d');
}
function updStory() {
  S.b1.setAlpha(S.T % 1 < .6 ? 1 : .4);
  if (S.st > .4 && (pr('P1_1') || pr('START1') || S.st > 9)) nextArcade();
}
function initCho(k) {
  S.ck = k; S.cs = 0;
  menuBg(S.bg);
  tx(W / 2, 60, HR[k + 1], 13, '#b8c48d');
  tx(W / 2, 130, CHO[k].q, 22, '#ffffff');
  tx(W / 2, 170, '¿QUÉ HACE TU EQUIPO?', 16, '#e1ff00');
  S.co = [0, 1].map(j => [tx(220 + j * 360, 300, CHO[k].a[j], 18, '#ffffff'), tx(220 + j * 360, 360, CHO[k].d[j], 14, '#b8c48d')]);
  tx(W / 2, 520, '◄► ELEGIR · BOTÓN 1 CONFIRMAR', 14, '#b8c48d');
}
function updCho() {
  if (pr('P1_L')) { S.cs = 0; snd('sel'); }
  if (pr('P1_R')) { S.cs = 1; snd('sel'); }
  const g = S.g; g.clear();
  for (let j = 0; j < 2; j++) {
    const on = j === S.cs;
    g.fillStyle(on ? Y : 0x1a1a1a); g.fillRect(70 + j * 360, 250, 300, 150);
    g.lineStyle(2, Y, on ? 1 : .5); g.strokeRect(70 + j * 360, 250, 300, 150);
    S.co[j][0].setColor(on ? '#1a1a1a' : '#f2ff00'); S.co[j][1].setColor(on ? '#1a1a1a' : '#f2ff00').setAlpha(on ? 1 : .55);
  }
  if (S.st > .4 && (pr('P1_1') || pr('START1'))) { S.ch[S.ck] = S.cs; snd('ok'); nextArcade(); }
}

// ---------- Pantalla: VS ----------
function initVs() {
  drawStage(S.bg, S.stage);
  S.bg.fillStyle(0x000000, .55); S.bg.fillRect(0, 0, W, H);
  const [a, b] = S.F;
  a.face = 1; b.face = -1;
  [a, b].forEach((f, i) => {
    const x = 200 + i * 400, T = TEAMS[f.t];
    tx(x, 70, f.name, 30, i ? '#ff6ec7' : '#e1ff00');
    tx(x, 104, isTeam(f.t) ? 'TEAM ' + T.n + ' · ' + T.c : T.c, 14, '#f7ffd8');
    tx(x, 150, '«' + quote(f) + '»', 12, '#ffffff');
  });
  if (S.np === 1) tx(W / 2, 30, HR[S.li] + (S.li === 3 ? ' (NACHO EN LA CÁMARA)' : ''), 16, '#ffffff');
  S.vsT = tx(W / 2, 290, 'VS', 64, '#ffffff');
  tx(W / 2, 560, 'ESCENARIO: ' + SN[S.stage], 16, '#e1ff00');
}
function updVs(dt) {
  S.g.clear();
  S.F.forEach((f, i) => { f.anim += dt; drawF(S.g, f, 200 + i * 400, 480, 1.9); });
  S.vsT.setScale(1 + Math.sin(S.T * 8) * .08);
  if (S.st > 2.8 || pr('START1') || pr('START2')) go('fight');
}

// ---------- Pantalla: pelea ----------
function initFight() {
  drawStage(S.bg, S.stage);
  S.rd = 1; S.F.forEach(f => { f.wins = 0; f.m = 0; });
  S.F.forEach((f, i) => {
    const L = !i, T = TEAMS[f.t];
    tx(L ? 30 : 770, 58, f.name, 16, '#ffffff', L ? 0 : 1);
    tx(L ? 30 : 770, 75, isTeam(f.t) ? 'TEAM ' + T.n : T.c, 11, '#' + T.col.toString(16).padStart(6, '0'), L ? 0 : 1);
    tx(L ? 30 : 770, 588, '3 ' + T.p[0] + ' · 4 ' + T.p[1] + ' · 5 ' + T.p[2], 10, '#f7ffd8', L ? 0 : 1);
  });
  S.tt = tx(W / 2, 32, '36', 34, '#ffffff');
  S.ptT = tx(W / 2, 64, '', 12, '#e1ff00');
  S.cT = [tx(130, 120, '', 24, '#ff6ec7'), tx(670, 120, '', 24, '#ff6ec7')];
  if (S.stage === 6) tx(675, 145, '36:00', 30, '#e1ff00');
  S.mt = 0; S.mi = 0; S.photo = 0; S.na = 6;
  startRound();
}
function startRound() {
  S.F.forEach(reset);
  S.pr = []; S.walls = []; S.tm = []; S.pa = []; S.imp = []; S.hst = 0; S.pkt = 4; S.fh = 0;
  S.time = 36; S.ph = 'intro'; S.pt = 1.8;
  if (S.np === 1) {
    const h = S.F[0], c = S.ch;
    if (c[0] === 1) { h.hp = h.ghp = 75; if (S.rd === 1) h.m = 100; }
    h.cdm = c[1] === 0 ? .7 : 1; h.dm = c[1] === 1 ? 1.2 : 1;
    if (c[2] === 1 && S.F[1].t === 7) S.F[1].hp = S.F[1].ghp = 80;
  }
  ann('ROUND ' + S.rd, '#ffffff', 700);
  later(1, () => { ann('¡A HACKEAR!', '#e1ff00', 500); snd('ok'); });
}
function endRound(w) {
  if (w) {
    w.wins++; w.win = 1;
    if (!w.cpu && w.tk < .5) { unlock(1); flt(w, '¡PERFECTO!', '#e1ff00'); }
    if (S.np === 1 && w.i === 0) S.pts += 500 + Math.ceil(S.time) * 20 + (w.tk < .5 ? 2000 : 0);
  }
  S.ph = 'end'; S.pt = 2.6; S.pr = []; S.tm = [];
}
function updFight(dt) {
  const [a, b] = S.F;
  if (S.hst > 0) { S.hst -= dt; drawFight(0); return; }
  if (S.slo > 0) { S.slo -= dt; dt *= .3; if (S.slo <= 0) S.sc.cameras.main.zoomTo(1, 200).pan(W / 2, H / 2, 200); }
  if (S.ph === 'intro') { S.pt -= dt; if (S.pt <= 0) S.ph = 'fight'; }
  for (let i = S.tm.length - 1; i >= 0; i--) { const t = S.tm[i]; t.t -= dt; if (t.t <= 0) { S.tm.splice(i, 1); t.fn(); } }
  step(a, b, dt); step(b, a, dt);
  if (!a.ko && !b.ko && Math.abs(a.x - b.x) < 46 && Math.abs(a.y - b.y) < 120) {
    const p = (46 - Math.abs(a.x - b.x)) / 2, s = a.x <= b.x ? -1 : 1;
    a.x = clampX(a.x + s * p); b.x = clampX(b.x - s * p);
  }
  if (S.ph === 'fight') {
    S.time -= dt;
    // musica
    S.mt -= dt;
    if (S.mt <= 0) { S.mt = S.stage === 7 ? .13 : .19; tone(ROOT[S.stage] * Math.pow(2, PAT[S.mi++ % 16] / 12), .12, 'square', .03); }
    // proyectiles
    for (let i = S.pr.length - 1; i >= 0; i--) {
      const p = S.pr[i];
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt;
      let dead = p.l <= 0 || p.x < -60 || p.x > W + 60 || p.y > H + 60;
      const o = S.F[1 - p.ow];
      if (!dead && !p.fx.ub) for (const w of S.walls) if (w.ow !== p.ow && Math.abs(p.x - w.x) < 16 && p.y > GR - 110) { dead = true; spark(p.x, p.y, 0x8d6e4f, 6); snd('blk'); }
      if (!dead) {
        const top = o.y - (o.cr ? 92 : 148);
        if (Math.abs(p.x - o.x) < p.w / 2 + 20 && p.y + p.h / 2 > top && p.y - p.h / 2 < o.y) { hurt(o, p.d, S.F[p.ow], p.fx); dead = true; }
      }
      if (!dead && !p.nc && !p.fx.ub) for (const q of S.pr) if (q !== p && q.ow !== p.ow && !q.nc && !q.fx.ub && Math.abs(q.x - p.x) < 22 && Math.abs(q.y - p.y) < 22) { q.l = 0; dead = true; spark(p.x, p.y, 0xffffff, 10); snd('blk'); }
      if (dead) S.pr.splice(i, 1);
      if (S.ph !== 'fight') break;
    }
    for (let i = S.walls.length - 1; i >= 0; i--) if ((S.walls[i].l -= dt) <= 0) S.walls.splice(i, 1);
    if (S.stage % 8 < 6 && (S.pkt -= dt) <= 0) for (const f of S.F) if (!f.ko && f.gr && Math.abs(f.x - 640) < 36) { boost(f, S.stage); S.pkt = 12; break; }
    // Nacho ayuda a Rafa
    if (b.t === 7) {
      S.na -= dt;
      if (S.na <= 0) { S.na = 7; S.fl = .35; snd('blk'); }
      if (!S.photo && b.hp < 50) { S.photo = 1; S.fl = .6; if (S.ch[2] !== 0) a.stun = 1; ann('¡FOTO DEL EQUIPO!', '#1abc9c', 900); snd('ctr'); }
    }
    if (S.time <= 0 && S.ph === 'fight') {
      S.time = 0;
      if (Math.abs(a.hp - b.hp) < .5) { ann('¡EMPATE!', '#ffffff', 1400); endRound(null); }
      else { ann('¡SE ACABÓ EL TIEMPO!', '#e1ff00', 1400); endRound(a.hp > b.hp ? a : b); }
    }
  } else if (S.ph === 'end') {
    S.pt -= dt;
    if (S.pt <= 0) {
      const w = S.F.find(f => f.wins >= 2);
      if (w) matchOver(w); else { S.rd++; startRound(); }
      return;
    }
  }
  drawFight(dt);
}
function drawFight(dt) {
  const [a, b] = S.F;
  const g = S.g; g.clear();
  stageFx(g, S.stage);
  for (const w of S.walls) { g.fillStyle(0x6d4c2f); g.fillRect(w.x - 14, GR - 105, 6, 105); g.fillRect(w.x + 8, GR - 105, 6, 105); g.fillStyle(0x8d6e4f); for (let y = GR - 98; y < GR; y += 20) g.fillRect(w.x - 14, y, 28, 7); }
  drawF(g, b, b.x, b.y); drawF(g, a, a.x, a.y); codeRain(g, a); codeRain(g, b);
  for (const p of S.pr) drawP(g, p);
  for (let i = S.pa.length - 1; i >= 0; i--) { const q = S.pa[i]; q.l -= dt; q.vy += 900 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.l <= 0) S.pa.splice(i, 1); else { g.fillStyle(q.c); g.fillRect(q.x - 3, q.y - 3, 6, 6); } }
  for (let i = S.imp.length - 1; i >= 0; i--) { const q = S.imp[i], z = 14 * q.s * (q.l / .12 + .4); q.l -= dt || .016; if (q.l <= 0) { S.imp.splice(i, 1); continue; } g.fillStyle(0xffffff); g.fillRect(q.x - z * 1.6, q.y - 3, z * 3.2, 6); g.fillRect(q.x - 3, q.y - z * 1.6, 6, z * 3.2); g.fillStyle(0xffe066); g.fillRect(q.x - z / 2, q.y - z / 2, z, z); }
  hud();
}
function hud() {
  const h = S.h; h.clear();
  h.fillStyle(0x000000, .5); h.fillRect(0, 0, W, 86); h.fillRect(0, 548, W, 52);
  S.F.forEach(f => {
    if (f.ghp > f.hp) f.ghp = Math.max(f.hp, f.ghp - 35 * S.dt); else f.ghp = f.hp;
    const L = f.i === 0, x0 = L ? 30 : 450, w = 320, gw = w * f.ghp / 100, hw = w * f.hp / 100;
    h.fillStyle(0x000000); h.fillRect(x0 - 3, 15, w + 6, 24);
    h.fillStyle(0x5a0f0f); h.fillRect(x0, 18, w, 18);
    h.fillStyle(0xffffff); h.fillRect(L ? x0 + w - gw : x0, 18, gw, 18);
    h.fillStyle(f.hp > 30 ? 0xe1ff00 : 0xff5050); h.fillRect(L ? x0 + w - hw : x0, 18, hw, 18);
    for (let k = 0; k < 2; k++) { h.fillStyle(k < f.wins ? 0xffd400 : 0x333333); h.fillCircle(L ? x0 + w - 10 - k * 18 : x0 + 10 + k * 18, 50, 6); }
    const mx = L ? 30 : 570;
    h.fillStyle(0x000000); h.fillRect(mx - 2, 556, 204, 14);
    h.fillStyle(f.m >= 100 ? (S.T * 8 % 2 < 1 ? 0xff6ec7 : 0xffffff) : 0x3498db); h.fillRect(mx, 558, 200 * f.m / 100, 10);
    for (let k = 0; k < 2; k++) {
      const cx = L ? 250 + k * 22 : 530 - k * 22, r = Math.max(0, f.cd[k]) / (k ? 4.5 : 2.2);
      h.fillStyle(0x000000); h.fillRect(cx - 9, 551, 18, 24);
      h.fillStyle(f.sil > 0 ? 0x555555 : r > 0 ? 0x34495e : 0x2ecc71); h.fillRect(cx - 7, 553 + 20 * r, 14, 20 * (1 - r));
    }
  });
  S.tt.setText(String(Math.ceil(Math.max(0, S.time)))).setColor(S.time < 10 ? '#ff5050' : '#ffffff');
  S.ptT.setText(S.np === 1 ? 'PUNTOS ' + S.pts : '');
  S.F.forEach((f, i) => S.cT[i].setText(f.cbt > 0 && f.cb >= 2 ? f.cb + ' GOLPES' : '').setScale(1 + Math.max(0, f.cbt - .7)));
}
function matchOver(w) {
  if (!w.cpu) {
    unlock(0); S.ach.t |= 1 << w.t;
    if (pc(S.ach.t) >= 4) unlock(7);
    if (S.F[1 - w.i].t === 7) unlock(3);
    save();
  }
  if (S.np === 1) {
    if (w.i === 0) {
      S.tw[w.t] = (S.tw[w.t] || 0) + 1; save();
      S.li++;
      if (S.li >= S.lad.length) go('end'); else if (S.li <= 3) go('cho', S.li - 1); else nextArcade();
    } else go('over');
  } else { S.tw[w.t] = (S.tw[w.t] || 0) + 1; save(); go('res', w); }
}

// ---------- Pantallas finales ----------
function initRes(w) {
  S.w = w; w.win = 1; w.face = 1;
  menuBg(S.bg);
  tx(W / 2, 90, '¡GANA ' + w.name + '!', 44, '#f2ff00').setShadow(0, 0, '#f2ff00', 14, false, true);
  tx(W / 2, 140, 'TEAM ' + TEAMS[w.t].n + ' · ' + TEAMS[w.t].c, 18, '#f7ffd8');
  tx(W / 2, 520, 'START · REVANCHA      BOTÓN 6 · CAMBIAR EQUIPOS', 16, '#ffffff');
}
function updRes(dt) {
  S.g.clear(); S.w.anim += dt; drawF(S.g, S.w, W / 2, 470, 1.5);
  if (pr('START1') || pr('START2')) { S.F.forEach(f => { f.wins = 0; }); go('vs'); }
  else if (pr('P1_6') || pr('P2_6')) go('sel');
}
function initOver() {
  menuBg(S.bg);
  tx(W / 2, 200, '¿CONTINUAR?', 50, '#f2ff00').setShadow(0, 0, '#f2ff00', 14, false, true);
  S.ct = tx(W / 2, 300, '9', 80, '#ffffff');
  tx(W / 2, 420, 'START 1 · SEGUIR HACKEANDO (LOS PUNTOS VUELVEN A 0)', 16, '#e1ff00');
  tx(W / 2, 446, 'BOTÓN 6 · CAMBIAR DE PERSONAJE', 14, '#b8c48d');
  rankTxt(addHS(), 480);
}
function updOver() {
  const n = 9 - Math.floor(S.st);
  S.ct.setText(String(Math.max(0, n)));
  if (pr('START1')) { S.pts = 0; nextArcade(); }
  else if (pr('P1_6')) { S.np = 1; go('sel'); }
  else if (n < 0) go('title');
}
function initEnd() {
  drawStage(S.bg, 6); S.bg.fillStyle(0x000000, .55); S.bg.fillRect(0, 0, W, H);
  S.fl = 1.2; snd('ko');
  tx(W / 2, 190, '¡FOTO CON EL EQUIPO PLATANUS!', 32, '#e1ff00');
  tx(W / 2, 224, 'CAMPEÓN: ' + S.hum.name + ' · TEAM ' + TEAMS[S.hum.t].n, 18, '#ffffff');
  const c = S.ch, e = c[2] === 1 ? ['FINAL: LA DEMO LOCAL', 'LA DEMO CORRIÓ EN TU LAPTOP... HASTA QUE SE APAGÓ.\nGANASTE IGUAL. PRÓXIMA VEZ: DEPLOY TEMPRANO.'] : c[0] === 0 ? ['FINAL: EL PITCH PERFECTO', 'DURMIERON, HICIERON DEPLOY Y LA DEMO CORRIÓ EN VIVO.\nEL JURADO PIDIÓ EL LINK.'] : ['FINAL: PRODUCTO EN VIVO, OJERAS EN VIVO', 'LA DEMO FUNCIONÓ EN PRODUCCIÓN.\nNADIE RECUERDA EL PITCH, TODOS RECUERDAN LAS OJERAS.'];
  tx(W / 2, 260, e[0], 17, '#ff6ec7');
  tx(W / 2, 302, e[1] + '\n' + (c[1] === 0 ? 'EL PIVOTE SALIÓ BIEN.' : 'DEFENDISTE LA IDEA HASTA EL FINAL.'), 13, '#f7ffd8');
  tx(W / 2, 580, 'START · VOLVER AL INICIO', 14, '#b8c48d');
  S.ach.e |= 1 << (c[2] === 1 ? 2 : c[0] === 0 ? 0 : 1);
  unlock(4); if (c[0] === 1) unlock(5); if (S.ach.e === 7) unlock(6);
  rankTxt(addHS(), 60);
  tx(W / 2, 128, 'FINALES DESCUBIERTOS: ' + pc(S.ach.e) + ' DE 3', 13, '#b8c48d');
  S.e = [mkF(0, S.hum.t, S.hum.lk, '', 0), mkF(1, 7, '1000', '', 0)];
  S.e.forEach(f => { f.win = 1; f.face = 1; });
}
function updEnd(dt) {
  const g = S.g; g.clear();
  S.e.forEach(f => { f.anim += dt; });
  drawF(g, S.e[1], 300, GR, 1.2); drawF(g, S.e[0], 420, GR, 1.4); nacho(g, 540, GR, 6, S.T % 2 < .1);
  banana(g, 660, 470, 40, 16);
  if (S.st > 1 && (pr('START1') || pr('START2'))) go('title');
}
