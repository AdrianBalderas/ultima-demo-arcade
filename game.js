// SEÑAL // 26
// Juego de peleas 1 vs 1. Cada luchador es un integrante (generico y personalizable) de un equipo
// ganador de Platanus Hack. Cada escenario es una sede. Jefes: Rafa (con Nacho en la camara) y El Deadline.

// Todo el juego va dentro de una función: así el minificador acorta todos los nombres (ahorra ~2 KB)
(() => {
// Atajos de Math (el minificador los deja de 1 letra)
const _mr = () => Math.random(), { min: _mn, max: _mx, sin: _ms, round: _mR, abs: _ma, PI: _mP, cos: _mc } = Math;
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
// look = piel, color de pelo, peinado (0 corto, 1 largo, 2 rizado, 3 cola, 4 gorra), lentes
const TEAMS = [
  { n: 'LITTLE DRAGONS', c: 'SANTIAGO 2024', h: 'NEXO ANDINO', col: 0x2563eb, ac: 0xffe066, st: 0, p: ['MONEDA DE FUEGO', 'EVOLUCIÓN', 'INTERÉS COMPUESTO'], m: ['1000', '2210', '0121', '3430', '1641'] },
  { n: 'HEDGIE', c: 'SANTIAGO 2025', h: 'MUT VERDE', col: 0x27ae60, ac: 0xffffff, st: 1, p: ['COPY TRADE', 'COBERTURA', 'VENTA EN CORTO'], m: ['2101', '0010', '3220', '1530', '4340'] },
  { n: 'RECORD.AI', c: 'SANTIAGO 2025', h: 'OJO FANTASMA', col: 0x3a3a3a, ac: 0xe8e8e8, st: 1, p: ['ESCANEO FACIAL', '¿CÓMO TE LLAMABAS?', 'RECUERDO TOTAL'], m: ['1001', '3111', '0321', '2031', '4241'] },
  { n: 'TRANQUERA', c: 'BUENOS AIRES 2026', h: 'PAMPERO', col: 0x2b2a26, ac: 0xefede6, st: 2, p: ['TRANQUERA CERRADA', '[REDACTADO]', 'REGLA VIOLADA'], m: ['1100', '2010', '0420', '3230', '1141'] },
  { n: 'DOMINIKITO', c: 'CDMX 2026', h: 'LÚMINA', col: 0x5c3cd5, ac: 0xffffff, st: 3, p: ['ELIGE TU CAMINO', 'CUENTO VIVO', 'PERFIL EMOCIONAL'], m: ['2000', '3111', '1220', '4031', '2340'] },
  { n: 'WOKI', c: 'BOGOTÁ 2026', h: 'CÓNDOR', col: 0xf2f2f2, ac: 0x111111, st: 4, p: ['SEÑAL LORA', 'SOS', 'RESCATE'], m: ['3000', '2110', '1221', '4430', '2541'] },
  { n: 'MUS3O', c: 'CARACAS 2026', h: 'ÁVILA', col: 0x8e2a1e, ac: 0xd9a441, st: 5, p: ['SALA NUEVA', 'MODO EXAMEN', 'PALACIO DE LA MEMORIA'], m: ['2010', '3131', '1220', '4031', '2340'] },
  { n: 'RAFA', c: 'EL ORGANIZADOR', h: 'EL CURADOR', col: 0xe1ff00, ac: 0x1b1b1b, st: 6, p: ['CAMBIO DE LOGÍSTICA', 'CRONOGRAMA', 'DE CERO A PRODUCTO'], m: ['1000'] },
  { n: 'EL DEADLINE', c: '36 HORAS', h: '00:00', col: 0xff3b3b, ac: 0xffffff, st: 7, p: ['TIC TAC', 'ÚLTIMO COMMIT', 'DEPLOY A LAS 4AM'], m: ['0000'] },
  { n: 'EL PLÁTANO', c: 'COMODÍN', h: 'EL COMODÍN', col: 0xffe135, ac: 0x6d4c2f, st: 6, p: ['CÁSCARA', 'POTASIO', 'LLUVIA DE PLÁTANOS'], m: ['1000', '3100', '0200', '4300', '2400'] },
];
TEAMS.forEach(t => { t.m = t.m.map((x, i) => x + '10201'[i]); });
const SELT = [0, 1, 2, 3, 4, 5, 6, 9], isTeam = t => t < 7 || t === 9;
const SN = ['SANTIAGO 2024', 'SANTIAGO 2025 · MUT, LAS CONDES', 'BUENOS AIRES 2026', 'CDMX 2026', 'BOGOTÁ 2026', 'CARACAS 2026', 'PLATANUS HQ', 'EL DEADLINE', 'SAN FRANCISCO · EL DESTINO'];
const SL = ['CORDILLERA · SANTIAGO', 'TORRE MUT · LAS CONDES', 'OBELISCO · BUENOS AIRES', 'ÁNGEL + LÍNEA 1 · CDMX', 'MONSERRATE · BOGOTÁ', 'EL ÁVILA · CARACAS', 'HQ PLATANUS', 'CIERRE DE CRONOGRAMA', 'GOLDEN GATE · SAN FRANCISCO'];
const ROOT = [110, 98, 123, 110, 92, 104, 130, 82, 98];
const PAT = [0, 0, 12, 0, 7, 0, 10, 12, 0, 0, 12, 0, 5, 7, 3, 5];
const PUNCH = { k: 'p', s: .05, a: .08, r: .14, rng: 80, d: 5, y: -124 };
const KICK = { k: 'k', s: .09, a: .1, r: .22, rng: 109, d: 8, y: -78 };

const S = { ch: [], ui: [], tw: {}, T: 0, pr: [], pa: [], walls: [], tm: [], imp: [], hst: 0 };
const ST = window.platanusArcadeStorage;

new Phaser.Game({
  type: Phaser.AUTO, width: W, height: H, parent: 'game-root', backgroundColor: '#0b0f03',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: W, height: H },
  scene: { create, update },
});

// ---------- Utilidades ----------
const rnd = (a, b) => a + _mr() * (b - a);
const clampX = x => _mx(40, _mn(W - 40, x));
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
  const t = S.sc.add.text(x, y, s, { fontFamily: 'ui-monospace, monospace', fontSize: sz + 'px', color: c, fontStyle: 'bold', stroke: '#000000', strokeThickness: fl ? 0 : _mx(3, sz / 5), align: 'center' }).setOrigin(ox, .5).setDepth(10);
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
    if (S.mute) return;
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
// Secuenciador synthwave: bajo, caja y arpegio cambian de energía al entrar al combate.
// No usa archivos ni red; el AudioContext se reanuda tras el primer botón del jugador.
function music() {
  const live = S.scr === 'title' || S.scr === 'sel' || S.scr === 'vs' || S.scr === 'fight' || S.scr === 'res';
  if (!live || S.mute) { S.mu = 0; return; }
  if (S.T < (S.mu || 0)) return;
  const fight = S.scr === 'fight', q = S.mb++ & 15, root = fight && S.stage !== undefined ? ROOT[S.stage] : 110;
  const bass = [0, 0, 7, 0, 5, 0, 10, 0, 0, 0, 7, 0, 3, 0, 5, 10][q];
  if (!(q & 1)) tone(root * Math.pow(2, (bass - 24) / 12), fight ? .18 : .25, 'sawtooth', fight ? .035 : .021);
  if (q === 4 || q === 12) tone(92, .035, 'square', .024, 55);
  if (fight && q % 4 === 2) tone(root * Math.pow(2, ([12, 15, 19, 22][(q >> 2) & 3]) / 12), .09, 'triangle', .018);
  if (fight && S.F && (S.F[0].m >= 100 || S.F[1].m >= 100) && !(q & 3)) tone(root * 4, .045, 'square', .018, root * 5);
  S.mu = S.T + (fight ? .15 : .23);
}

// ---------- Guardado ----------
async function load() {
  try {
    if (!ST) return;
    const b = await ST.get('phf-wins-v1');
    if (b && b.found && b.value && typeof b.value === 'object') for (const k in b.value) if (isTeam(+k) && typeof b.value[k] === 'number') S.tw[k] = b.value[k];
    if (S.scr === 'title') go('title');
  } catch (e) { /* sin guardado */ }
}
function save() { try { if (ST) ST.set('phf-wins-v1', S.tw); } catch (e) { /* sin guardado */ } }

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
  const dt = _mn(delta / 1000, .05);
  S.T += dt; S.st += dt; S.dt = dt;
  ({ title: updTitle, sel: updSel, vs: updVs, fight: updFight, res: updRes, over: updOver, end: updEnd, story: updStory, cho: updCho })[S.scr](dt);
  music();
  if (S.fl > 0) { S.fl -= dt; S.ov.setAlpha(_mx(0, _mn(1, S.fl * 2.5))); } else S.ov.setAlpha(0);
  S.c.p = Object.create(null);
}

// ---------- Luchadores ----------
function mkF(i, t, look, name, cpu) {
  const f = { i, t, look: typeof look === 'string' ? look.split('').map(Number) : look.slice(), name, cpu, wins: 0, m: 0, anim: _mr() * 9 };
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
  const ay = f.y + a.y, top = o.y - (o.cr ? 106 : 170);
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
    f => { f.hp = _mn(100, f.hp + 12); flt(f, 'SOS +12', '#ff5050'); snd('heal'); },
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
    f => { f.buff = 5; f.hp = _mn(100, f.hp + 6); flt(f, '+POTASIO', '#ffe135'); snd('heal'); },
    f => { const o = opp(f); for (let j = 0; j < 7; j++) later(j * .11, () => shoot(f, 'ban', { x: o.x + rnd(-80, 80), y: -20, vx: 0, vy: 180, g: 1400, d: 4, l: 3, nc: 1 })); }],
];

function cast(f, k) {
  f.cast = .3;
  if (k < 2) f.cd[k] = (k ? 4.5 : 2.2) * (f.cdm || 1); else { f.m = 0; chat('s'); hype(150); }
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
  return S.pr.some(p => p.ow !== f.i && _ma(p.x - f.x) < 220 && (p.x - f.x) * p.vx < 0);
}
function ai(f, o, dt) {
  f.ait -= dt;
  if (f.ait > 0 && f.aiI) { const r = Object.assign({}, f.aiI); f.aiI.b = [0, 0, 0, 0, 0, 0]; return r; }
  const lv = (S.lv || 0) + (f.t === 7 || f.t === 8 ? 1 : 0); // los jefes pelean un nivel más arriba
  f.ait = _mx(.05, rnd(.1, .24) - lv * .025);
  const I = { l: 0, r: 0, u: 0, d: 0, b: [0, 0, 0, 0, 0, 0] };
  const dx = o.x - f.x, dist = _ma(dx), tow = dx > 0 ? 'r' : 'l', away = dx > 0 ? 'l' : 'r';
  if (((o.atk && dist < 140) || incoming(f)) && _mr() < .25 + lv * .12) I[away] = 1;
  else if (dist > 115) {
    I[tow] = 1;
    if (f.cd[0] <= 0 && _mr() < .2 + lv * .06) I.b[2] = 1;
    else if (_mr() < .05) I.u = 1;
  } else {
    const r = _mr();
    if (_mr() < .4 - lv * .08) { f.aiI = Object.assign({}, I); return I; }
    if (r < .33) I.b[0] = 1; else if (r < .58) I.b[1] = 1; else if (r < .68 && f.cd[1] <= 0) I.b[3] = 1;
    else if (r < .8) I[away] = 1; else if (r < .86) I.u = 1; else if (r < .92) I.d = 1;
  }
  if (f.m >= 100 && _mr() < .5) I.b[4] = 1;
  f.aiI = Object.assign({}, I, { b: [0, 0, 0, 0, 0, 0] });
  return I;
}

function step(f, o, dt) {
  if (f.ko) { f.dz += dt; f.mx = _mn(1, _mx(0, (f.dz - .5) / 1.1)); }
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
            if (a.heal) f.hp = _mn(100, f.hp + (before - o.hp) * .7);
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
    hurt(f, _mx(20, d * 2), o, { stun: .6 });
    return;
  }
  if (fx.bonus) d += (100 - o.hp) * .25;
  if (f.buff > 0) d *= 1.4;
  d *= f.dm || 1;
  const dir = o.x >= f.x ? 1 : -1;
  if (o.blk && !fx.ub) {
    d *= .15; o.kx = dir * 140; spark(o.x - dir * 20, o.y - 100, 0xffffff, 5); snd('blk');
    if (_mr() < .3) chat('b');
  } else {
    if (o.sh > 0) d *= .5;
    o.hs = .22; o.kx = dir * 240; o.fl = .12; o.atk = null;
    f.cb = f.cbt > 0 ? f.cb + 1 : 1; f.cbt = .9;
    if (f.cb > 2 && f.cb & 1) flt(f, ['¡BIEN!', '¡GENIAL!', '¡BRUTAL!', '¡ÉPICO!'][_mn(3, f.cb - 3 >> 1)], '#ff6ec7');
    if (!S.fh) { S.fh = 1; flt(f, '¡PRIMER COMMIT!', '#e1ff00'); }
    hype(d * 6 | 0, f); if (f.cb === 3) chat('c'); S.hy = .45;
    if (d >= 8 && _mr() < .6) ono(o.x - dir * 30, o.y - 150);
    if (d >= 8) { S.sl = .14; S.slx = o.x; S.sly = o.y - 110; }
    if (f.cb >= 4 && f.cb % 4 === 0) { o.kx = dir * 520; o.iv = .5; o.hs = .3; }
    if (fx.stun) o.stun = fx.stun;
    if (fx.inv) { o.inv = fx.inv; flt(o, '¿EH?', '#c39bd3'); }
    if (fx.sil) { o.sil = fx.sil; flt(o, '[REDACTADO]', '#aaaaaa'); }
    if (fx.slow) o.slow = fx.slow;
    if (fx.slip) flt(o, '¡SE RESBALÓ!', '#ffe135');
    if (fx.drain) o.m = _mx(0, o.m - fx.drain);
    if (fx.time) { S.time = _mx(1, S.time - fx.time); flt(o, '-3 SEG', '#e1ff00'); }
    spark(o.x, o.y - 95, 0xffe066); snd('hit'); S.hst = d >= 12 ? .12 : .06; S.imp.push({ x: o.x - dir * 18, y: o.y - 100, l: .12, s: d >= 12 ? 1.6 : 1 });
    if (d >= 12) S.sc.cameras.main.shake(120, .006);
  }
  o.hp = _mx(0, o.hp - d); o.tk += d;
  f.m = _mn(100, f.m + d * .9); o.m = _mn(100, o.m + d * .5);
  if (o.hp <= 0) {
    o.ko = 1; o.gr = 0; o.vy = -420; o.kx = dir * 260;
    ann('¡DEPLOYADO!', '#ff6ec7', 1400); snd('ko'); chat('k'); hype(600, f); S.hy = 1.4; S.sl = .5; S.slx = o.x; S.sly = o.y - 110; S.sc.cameras.main.shake(300, .012).zoomTo(1.3, 250).pan(o.x, o.y - 100, 250); S.slo = 1.2;
    endRound(f);
  }
}

// ---------- La final se transmite EN VIVO: espectadores y un chat que reacciona a la pelea ----------
// Ningún juego de peleas usa al público como sistema: aquí el chat comenta lo que haces
// y cada 1,500 espectadores nuevos alguien "dona un café" que llena tu súper.
const CU = [['NACHO_CAM', '#ff6ec7'], ['RAFA_OFICIAL', '#e1ff00'], ['DEV_CDMX', '#39ff88'], ['JUEZ_3', '#29e6ff'], ['ANON42', '#ff9b3d'], ['TEAM_WOKI', '#ffffff']];
const CM = {
  i: ['¿QUIÉN GANA?', 'EL DEADLINE VIENE...', '¿ALGUIEN TIENE CAFÉ?', 'SALUDOS DESDE BOGOTÁ', 'ESTE ESCENARIO ESTÁ BRUTAL', 'YA SE ME CAYÓ EL WIFI'],
  c: ['ESE COMBO', 'NO MANCHES', 'CLIP IT', '+1 AL PITCH', 'ESO NO PASA EL CODE REVIEW'],
  k: ['GG', 'DEPLOYADO JAJA', 'F EN EL CHAT', 'GG WP'],
  b: ['QUÉ DEFENSA', 'BLOQUEÓ TODO'],
  s: ['¡¡SÚPER!!', '¿ESO ES LEGAL?', 'RAFA REVISA ESO'],
};
function chat(k, m) {
  const u = CU[_mr() * CU.length | 0], a = CM[k];
  S.cq.push([u[0] + ': ' + (m || a[_mr() * a.length | 0]), u[1]]);
  if (S.cq.length > 4) S.cq.shift();
  S.cl.forEach((t, i) => { const q = S.cq[i]; t.setText(q ? q[0] : '').setColor(q ? q[1] : '#fff'); });
}
function hype(n, f) {
  const a = S.vw; S.vw += n;
  if (f && (S.vw / 1500 | 0) > (a / 1500 | 0)) { f.m = _mn(100, f.m + 30); chat(0, 'DONÓ UN CAFÉ A ' + f.name + ': +SÚPER'); }
  S.vT.setText('● EN VIVO · ' + S.vw.toLocaleString('es-MX') + ' VIENDO');
}
// Onomatopeyas de cómic en los golpes fuertes
const JP = (c => (c.font = '20px sans-serif', c.measureText('ドン').width !== c.measureText('\u0fff\u0fff').width))(document.createElement('canvas').getContext('2d'));
function ono(x, y) {
  const t = S.sc.add.text(x + rnd(-30, 30), y + rnd(-20, 10), (JP ? ['ドン!', 'バキッ!', 'ズガン!', 'ドカッ!', 'ゴッ!'] : ['¡PAF!', '¡ZAS!', '¡PUM!', '¡CRAC!', '¡TOING!'])[_mr() * 5 | 0], { fontFamily: 'Impact, sans-serif', fontSize: '54px', color: '#ffffff', stroke: '#0a0a0a', strokeThickness: 7 }).setOrigin(.5).setDepth(16).setAngle(rnd(-18, 18)).setScale(.4);
  S.sc.tweens.add({ targets: t, scale: 1, duration: 90 });
  S.sc.tweens.add({ targets: t, alpha: 0, delay: 380, duration: 250, onComplete: () => t.destroy() });
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
  if (_ma(f.vx) > 1) return 'walk';
  return 'idle';
}

// Sombra con cambio de tono (mas oscura y fria) y luz (mas clara y calida)
function shd(c) { return lerpC(lerpC(c, 0x2a1b4a, .35), 0, .15); }
function lit(c) { return lerpC(c, 0xfff2c4, .3); }

// Un emblema grande hace legible a cada campeón desde la pantalla del arcade.
function heroMark(g, f, x, y, s) {
  if (f.ko || f.t > 6) return;
  const t = f.t, C = TEAMS[t].col, A = TEAMS[t].ac, r = 62 * s, yy = y - 95 * s;
  g.fillStyle(C, .12); g.fillCircle(x, yy, r);
  g.lineStyle(3 * s, A, .62);
  if (t === 0) { g.lineBetween(x - r, yy + r / 2, x, yy - r); g.lineBetween(x, yy - r, x + r, yy + r / 2); }
  else if (t === 1) { g.strokeRect(x - r / 2, yy - r / 2, r, r); g.lineBetween(x - r / 2, yy, x + r / 2, yy); }
  else if (t === 2) { g.strokeCircle(x, yy, r / 2); g.fillStyle(A, .55); g.fillCircle(x, yy, r / 7); }
  else if (t === 3) { g.lineBetween(x, yy - r, x + r, yy); g.lineBetween(x + r, yy, x, yy + r); g.lineBetween(x, yy + r, x - r, yy); g.lineBetween(x - r, yy, x, yy - r); }
  else if (t === 4) { for (let k = -1; k < 2; k++) g.lineBetween(x - r / 2, yy + k * 18 * s, x + r / 2, yy + k * 18 * s); }
  else if (t === 5) { g.lineBetween(x - r, yy + r / 2, x, yy - r / 2); g.lineBetween(x, yy - r / 2, x + r, yy + r / 2); g.lineBetween(x - r / 2, yy + r / 3, x + r / 2, yy + r / 3); }
  else { g.strokeRect(x - r / 2, yy - r / 2, r, r); g.lineBetween(x - r / 2, yy - r / 2, x + r / 2, yy + r / 2); }
}

function drawF(g, f, X, Y, sc = 1) {
  if (f.t === 8) return drawClock(g, f, X, Y, sc);
  const U = 5 * sc, fc = f.face, T = TEAMS[f.t], L = f.look, t = f.t;
  X = _mR(X / U) * U; Y = _mR(Y / U) * U;
  const ps = pose(f), W8 = 0xffffff, sk = f.fl > 0 ? W8 : SK[L[0]], hc = HC[L[1]], hs = L[2];
  const sh = f.fl > 0 ? W8 : T.col, sh2 = shd(sh), dk = 0x15151f;
  const pa = f.fl > 0 ? W8 : t === 9 ? 0xe6c200 : lerpC(T.col, 0x1d1430, .72);
  // complexion: 0 slim, 1 medium, 2 broad
  const bd = L[4] === undefined ? 1 : L[4], tw = [9, 10, 12][bd], tl = -(tw >> 1), lw = bd === 2 ? 4 : 3;
  const gl = L[3] || t === 2 || t === 6;
  if (!f.ko) { const k = _mx(.3, 1 - (GR - f.y) / 300); g.fillStyle(0x000000, .28 * k); g.fillEllipse(X, Y + (GR - f.y) + 2, 70 * sc * k, 12 * sc * k); }
  heroMark(g, f, X, Y, sc);
  if (f.sh > 0) { g.lineStyle(3, 0x2ecc71, .7); g.strokeCircle(X, Y - 75 * sc, 85 * sc); }
  if (f.ctr > 0) { g.lineStyle(4, 0x75aadb, .5 + _ms(S.T * 20) * .3); g.strokeRect(X - 40 * sc, Y - 155 * sc, 80 * sc, 155 * sc); }
  if (f.buff > 0) { g.fillStyle(0xff7b29, .18 + _ms(S.T * 15) * .08); g.fillCircle(X, Y - 75 * sc, 80 * sc); }
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
    const bob = ps === 'idle' ? _mR(_ms(f.anim * 4) * .6) : 0;
    // legs: stance with legs apart
    if (ps === 'jump') { B(-4, -14, lw, 5, pa); B(1, -15, lw, 5, pa); shoe(-4, -10, lw + 1); shoe(1, -11, lw + 1); }
    else if (ps === 'kick') { B(-4, -10, lw, 8, pa); shoe(-5, -2, lw + 1); B(1, -14, 10, 3, pa); R(11, -15, 2, 4, sh); R(13, -15, 1, 4, W8); }
    else if (cr) { B(-6, -5, lw + 1, 3, pa); B(2, -5, lw + 1, 3, pa); shoe(-7, -2, lw + 2); shoe(2, -2, lw + 2); }
    else {
      const s = ps === 'walk' ? _mR(_ms(f.anim * 12) * 2) : 0;
      B(-5 + s, -10, lw, 8, pa); B(2 - s, -10, lw, 8, pa); shoe(-6 + s, -2, lw + 1); shoe(2 - s, -2, lw + 1);
    }
    const b = cr + bob + (ps === 'jump' ? -4 : 0), y = d => d + b, x = d => d + ln, Q = (a, c, w, h, k) => R(x(a), y(c), w, h, k);
    // behind the body: cape (Dominikito), tail (Little Dragons), antenna (WOKI), hood (Rafa)
    if (t === 4) Q(tl - 2, -19, 3, 15, lerpC(sh, 0x2e168f, .5));
    if (t === 0) { Q(tl - 3, -13, 3, 2, sh); Q(tl - 5, -15, 2, 2, sh); if (!ol) Q(tl - 6, -16, 1, 1, 0xffe066); }
    if (t === 5) { Q(tl, -28, 1, 8, dk); if (!ol) Q(tl, -29, 1, 1, S.T % 1 < .5 ? 0xff3b3b : 0x661111); }
    if (t === 7) Q(-6, -22, 3, 3, sh2);
    // torso: open jacket in team color with inner shirt
    B(x(tl), y(-20), tw, 9, sh);
    if (!ol) {
      if (t === 9) { Q(tl + 2, -17, 1, 1, 0x8a6a1f); Q(tl + tw - 3, -14, 1, 1, 0x8a6a1f); Q(-1, -19, 1, 1, 0x8a6a1f); }
      else Q(-1, -20, 3, 8, t === 1 ? W8 : lerpC(T.ac, W8, .25));
      if (t === 1) Q(0, -19, 1, 6, 0xc0392b);
      if (t === 3) { Q(tl + 1, -20, 1, 9, T.ac); Q(tl + tw - 2, -20, 1, 9, T.ac); }
      if (t === 0) { Q(tl + 1, -17, 1, 1, lit(sh)); Q(tl + 2, -14, 1, 1, lit(sh)); }
      if (t === 5) { Q(tl, -16, tw, 1, 0x111111); Q(tl, -13, tw, 1, 0x111111); }
      if (t === 7) { Q(-2, -16, 1, 1, dk); Q(-1, -15, 3, 1, dk); Q(2, -16, 1, 1, dk); }
      for (let k = 0; k < tw; k++) Q(tl + k, -11, 1, 1, t === 3 ? (k & 1 ? T.ac : dk) : dk);
    }
    // head with ear
    B(x(-4), y(-29), 9, 9, sk);
    if (!ol) {
      Q(-2, -25, 1, 2, shd(sk));
      const hurt = ps === 'hurt', mad = ps === 'punch' || ps === 'kick' || ps === 'cast' || ps === 'wind';
      if (hurt) { Q(0, -24, 2, 1, dk); Q(3, -24, 2, 1, dk); Q(3, -22, 2, 2, 0x5a1f1f); }
      else {
        Q(0, -26, 2, 3, W8); Q(3, -26, 2, 3, W8); Q(1, -26, 1, 3, dk); Q(4, -26, 1, 3, dk); Q(1, -26, 1, 1, W8); Q(4, -26, 1, 1, W8);
        if (mad) { Q(0, -27, 1, 1, hc); Q(1, -26, 1, 1, hc); Q(3, -26, 1, 1, hc); Q(4, -27, 1, 1, hc); }
        else { Q(0, -27, 2, 1, hc); Q(3, -27, 2, 1, hc); }
        Q(ps === 'win' ? 2 : 3, -22, ps === 'win' ? 3 : 2, 1, 0x7a3b2e);
      }
      Q(-1, -23, 1, 1, lerpC(sk, 0xff6b6b, .4));
      if (gl && !hurt) {
        Q(-1, -26, 7, 1, dk);
        const l1 = t === 6 ? 0xff3355 : t === 2 ? 0xffffff : 0x9fb4c8, l2 = t === 6 ? 0x33e0ff : l1;
        Q(0, -25, 2, 1, l1); Q(3, -25, 2, 1, l2);
      }
      if (t === 2) { Q(-2, -24, 1, 2, 0xe8e8e8); if ((S.T * 3 | 0) % 4 === 0) R(x(-4), y(-29 + ((S.T * 30) | 0) % 9), 9, 1, 0xffffff); }
      if (f.sil > 0) Q(2, -23, 4, 2, 0x000000);
    }
    // hair
    const H2 = (dx, dy, w, h) => Q(dx, dy, w, h, hc);
    if (t === 9) {
      Q(-5, -32, 11, 3, sh); Q(-5, -29, 2, 10, sh); Q(-3, -33, 6, 1, sh);
      Q(0, -36, 2, 3, 0x6d4c2f); Q(1, -37, 2, 1, 0x6d4c2f);
      Q(tl - 1, -22, 2, 4, sh); Q(tl + tw - 1, -22, 2, 4, sh);
    }
    else if (hs === 0) { H2(-4, -30, 9, 2); H2(-4, -28, 2, 3); }
    else if (hs === 1) { H2(-5, -30, 10, 2); H2(-5, -28, 3, 10); }
    else if (hs === 2) { H2(-6, -33, 12, 5); H2(-6, -28, 3, 4); }
    else if (hs === 3) { H2(-4, -30, 9, 2); H2(-4, -28, 2, 2); H2(-7, -29, 3, 2); H2(-8, -28, 2, 6); }
    else { Q(-4, -31, 9, 2, sh2); Q(3, -30, 4, 1, sh2); H2(-4, -29, 2, 2); }
    if (!ol && hs !== 4 && t !== 9) Q(-1, hs === 2 ? -33 : -30, 3, 1, lit(hc));
    // team signature accessory
    if (t === 0) { R(x(-2), y(-32 - (hs === 2 ? 2 : 0)), 2, 2, 0xfff1c1); R(x(2), y(-32 - (hs === 2 ? 2 : 0)), 2, 2, 0xfff1c1); }
    if (t === 1) { H2(-7, -30, 3, 2); H2(-8, -28, 3, 2); H2(-7, -26, 2, 2); }
    if (t === 5) { Q(-5, -32, 11, 3, 0xf5f5f5); Q(-4, -33, 9, 1, 0xf5f5f5); Q(4, -30, 3, 1, 0x111111); }
    if (t === 6) { Q(-5, -32, 10, 2, 0xd9a441); Q(-1, -33, 2, 1, 0xd9a441); }
    if (t === 7 && !ol) { Q(-5, -27, 1, 4, dk); Q(-5, -23, 6, 1, dk); Q(1, -23, 1, 1, 0xff3b3b); }
    // Siluetas de campeón: cada sede se reconoce aun cuando la pelea está llena de efectos.
    if (!ol) {
      if (t === 0) { Q(-6, -34, 2, 3, 0xff7a3d); Q(5, -34, 2, 3, 0xff7a3d); Q(-7, -17, 1, 5, 0x53d8ff); }
      if (t === 1) { Q(-6, -31, 2, 5, 0x7bffb4); Q(5, -31, 2, 5, 0x7bffb4); Q(-3, -19, 6, 1, 0x7bffb4); }
      if (t === 2) { Q(-5, -26, 2, 2, 0xff4f81); Q(5, -26, 2, 2, 0xff4f81); Q(-2, -18, 4, 1, 0x53d8ff); }
      if (t === 3) { Q(tl - 2, -19, 2, 8, 0xff7a9d); Q(tl + tw, -19, 2, 8, 0xff7a9d); }
      if (t === 4) { Q(tl - 4, -25, 2, 11, 0xff4f81); Q(tl + tw + 2, -25, 2, 11, 0xff4f81); }
      if (t === 5) { Q(tl - 3, -21, 2, 10, 0x76f2ce); Q(tl + tw + 1, -21, 2, 10, 0x76f2ce); }
      if (t === 6) { Q(-6, -34, 12, 1, 0xffbb55); Q(-4, -36, 2, 2, 0xffbb55); Q(2, -36, 2, 2, 0xffbb55); }
      if (t === 7) Q(-2, -18, 4, 1, 0xd8ff2f);
    }
    // arms: always on guard, fists up
    const guard = () => { Q(1, -16, 3, 2, sh2); Q(4, -17, 2, 2, sk); Q(3, -19, 3, 2, sh); Q(5, -22, 2, 4, sh); Q(5, -24, 2, 2, sk); };
    if (ps === 'punch') { Q(1, -16, 3, 2, sh2); Q(4, -17, 2, 2, sk); R(1, y(-20), 9, 2, sh); R(10, y(-21), 3, 3, sk); }
    else if (ps === 'cast') { R(1, y(-20), 8, 2, sh); R(9, y(-21), 2, 3, sk); R(1, y(-17), 7, 2, sh2); R(8, y(-18), 2, 2, sk); }
    else if (ps === 'win') { Q(1, -16, 3, 2, sh2); Q(4, -17, 2, 2, sk); R(3, y(-27), 2, 8, sh); R(3, y(-30), 2, 3, sk); }
    else if (ps === 'block') { R(4, y(-27), 2, 8, sh); R(4, y(-28), 2, 2, sk); R(6, y(-25), 2, 6, sh2); }
    else if (ps === 'hurt') { Q(-7, -21, 2, 5, sh); Q(-8, -23, 2, 2, sk); }
    else if (ps === 'wind') { Q(1, -16, 3, 2, sh2); R(-7, y(-19), 5, 2, sh); R(-9, y(-20), 2, 3, sk); }
    else guard();
  };
  // pass 1: very dark purple outline (not pure black); pass 2: colors (green while turning into code)
  const OC = f.fl > 0 ? W8 : f.mx > 0 ? 0x003b1a : 0x0a0a0a;
  const gone = (dx, dy) => f.mx > .25 && ((dx * 7 + dy * 13 + ((S.T * 14) | 0)) & 7) / 8 < (f.mx - .25) * 1.4;
  body((dx, dy, w, h) => { if (w * h > 2 && !gone(dx, dy)) { g.fillStyle(OC); g.fillRect(X + (fc > 0 ? dx - 1 : -dx - w - 1) * U, Y + (dy - 1) * U, (w + 2) * U, (h + 2) * U); } }, 1);
  body((dx, dy, w, h, c) => { if (gone(dx, dy)) return; g.fillStyle(f.mx > 0 ? lerpC(c, 0x00ff66, _mn(1, f.mx * 1.6)) : c); g.fillRect(X + (fc > 0 ? dx : -dx - w) * U, Y + dy * U, w * U, h * U); }, 0);
  if (ps === 'punch') { g.fillStyle(W8, .45); g.fillRect(X + (fc > 0 ? 2 : -11) * U, Y - 20 * U, 9 * U, 2 * U); }
  if (ps === 'cast') { g.fillStyle(T.col, .5); g.fillCircle(X + fc * 12 * U, Y - 19 * U, 4 * U); }
  if (f.stun > 0) for (let k = 0; k < 3; k++) { g.fillStyle(0xffe066); g.fillRect(X + _mc(S.T * 6 + k * 2.1) * 22 * sc - 3, Y - 175 * sc + _ms(S.T * 6 + k * 2.1) * 6, 6, 6); }
  if (f.inv > 0) { g.fillStyle(0xc39bd3); g.fillRect(X - 3, Y - 190 * sc + _ms(S.T * 8) * 4, 6, 10); }
}

// ---------- Efecto "se vuelve código": el luchador vencido se deshace en una lluvia de 0 y 1 ----------
function glyph(g, x, y, one) {
  if (one) g.fillRect(x, y, 2, 8);
  else { g.fillRect(x - 2, y, 6, 2); g.fillRect(x - 2, y + 6, 6, 2); g.fillRect(x - 2, y, 2, 8); g.fillRect(x + 2, y, 2, 8); }
}
function codeRain(g, f) {
  if (!(f.mx > 0)) return;
  const fade = f.dz < 2.4 ? 1 : _mx(0, 1 - (f.dz - 2.4) * 1.5);
  if (fade <= 0) return;
  const cx = f.x - f.face * 40;
  for (let k = 0; k < 16; k++) {
    const x = _mR(cx - 80 + k * 10), sp = 140 + (k * 53) % 90;
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
  for (let k = 0; k < 12; k++) g.fillRect(X + _mc(k * .5236) * r * .68 - 2, cy + _ms(k * .5236) * r * .68 - 2, 4, 4);
  g.lineStyle(5 * sc, 0x111111);
  g.lineBetween(X, cy, X + _mc(f.anim * 6) * r * .65, cy + _ms(f.anim * 6) * r * .65);
  g.lineBetween(X, cy, X + _mc(f.anim * .6) * r * .42, cy + _ms(f.anim * .6) * r * .42);
  g.fillStyle(0x111111); g.fillRect(X - 22 * sc, cy - 22 * sc, 14 * sc, 6 * sc); g.fillRect(X + 8 * sc, cy - 22 * sc, 14 * sc, 6 * sc);
  if (ps === 'punch' || ps === 'cast') { g.fillStyle(0xff3b3b); g.fillRect(X + (f.face > 0 ? r - 6 : -r - 44) * 1, cy, 50 * sc, 12 * sc); }
  if (f.stun > 0) { g.fillStyle(0xffe066); g.fillRect(X + _mc(S.T * 6) * 30 - 3, cy - r - 14, 6, 6); }
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
  else if (id === 2) { f.hp = _mn(100, f.hp + 20); flt(f, '¡BOOST MATE: +20 VIDA!', '#f2ff00'); }
  else if (id === 3) { f.buff = 6; flt(f, '¡BOOST CALAVERA: MÁS DAÑO!', '#f2ff00'); }
  else if (id === 4) { f.m = 100; flt(f, '¡BOOST CHIVA: SÚPER LISTO!', '#f2ff00'); }
  else if (id > 7) { f.cd = [0, 0]; f.m = 100; flt(f, '¡BOOST AVIÓN: TODOS LOS PODERES!', '#f2ff00'); }
  else { f.cd = [0, 0]; f.m = _mn(100, f.m + 40); flt(f, '¡BOOST GUACAMAYA: PODERES LISTOS!', '#f2ff00'); }
}

function nacho(g, x, y, s, flash, d = 1) {
  const R = (dx, dy, w, h, c) => { g.fillStyle(c); g.fillRect(x + (d > 0 ? dx : -dx - w) * s, y + dy * s, w * s, h * s); };
  R(-4, -10, 3, 10, 0x2d3047); R(1, -10, 3, 10, 0x2d3047); R(-5, -20, 10, 10, 0x1abc9c);
  R(-4, -27, 8, 7, 0xe0ac69); R(-4, -28, 8, 2, 0x1b1b1b); R(-5, -27, 2, 3, 0x1b1b1b);
  R(2, -19, 4, 2, 0xe0ac69); R(3, -25, 7, 5, 0x111111); R(9, -24, 2, 3, 0x555555); R(4, -26, 2, 1, 0x111111);
  if (flash) { g.fillStyle(0xffffff, .9); g.fillCircle(x + d * 12 * s, y - 22 * s, 9 * s); }
}

function banana(g, x, y, r, w) {
  g.lineStyle(w, 0xffe135); g.beginPath(); g.arc(x, y, r, _mP * .12, _mP * .88, false); g.strokePath();
  g.fillStyle(0x6d4c2f);
  g.fillCircle(x + _mc(_mP * .12) * r, y + _ms(_mP * .12) * r, w * .3);
  g.fillCircle(x + _mc(_mP * .88) * r, y + _ms(_mP * .88) * r, w * .3);
}

function drawP(g, p) {
  const x = p.x, y = p.y, d = p.vx >= 0 ? 1 : -1;
  switch (p.k) {
    case 'fire': g.fillStyle(0xff5b1a); g.fillRect(x - 10, y - 10, 20, 20); g.fillStyle(0xffe066); g.fillRect(x - 5, y - 5, 10, 10); if (_mr() < .5) spark(x - d * 10, y, 0xff9b3d, 1); break;
    case 'arrow': g.fillStyle(0x2ecc71); g.fillRect(x - 14, y - 3, 22, 6); g.fillTriangle(x + d * 16, y, x + d * 4, y - 10, x + d * 4, y + 10); break;
    case 'scan': g.fillStyle(0x66ddff, .8); g.fillRect(x - 30, y - 4, 60, 8); g.fillStyle(0xffffff); g.fillRect(x - 30, y - 1, 60, 2); break;
    case 'q': case 'quiz':
      g.fillStyle(p.k === 'q' ? 0x8e44ad : 0xffffff); g.fillRect(x - 12, y - 14, 24, 28);
      g.fillStyle(p.k === 'q' ? 0xffffff : 0x8e44ad); g.fillRect(x - 5, y - 9, 10, 3); g.fillRect(x + 3, y - 9, 3, 8); g.fillRect(x - 2, y - 2, 5, 3); g.fillRect(x - 2, y + 5, 4, 4); break;
    case 'red': g.fillStyle(0x000000); g.fillRect(x - 20, y - 7, 40, 14); g.lineStyle(2, 0xffffff); g.strokeRect(x - 20, y - 7, 40, 14); break;
    case 'book': g.fillStyle(0x8e5a2f); g.fillRect(x - 11, y - 8, 22, 16); g.fillStyle(0xffffff); g.fillRect(x - 9, y - 6, 18, 2); g.fillStyle(0xe84393); g.fillRect(x - 1, y - 8, 2, 16); break;
    case 'buddy': { const s = _mR(_ms(S.T * 20) * 2); g.fillStyle(0x9c7cf6); g.fillRect(x - 10, y - 14, 20, 14); g.fillRect(x + d * 6 - 4, y - 22, 10, 10); g.fillStyle(0xffffff); g.fillRect(x + d * 8, y - 19, 3, 3); g.fillStyle(0x2d3047); g.fillRect(x - 8 + s, y, 5, 6); g.fillRect(x + 3 - s, y, 5, 6); break; }
    case 'heart': g.fillStyle(0xff3b8d); g.fillCircle(x - 8, y - 6, 11); g.fillCircle(x + 8, y - 6, 11); g.fillTriangle(x - 18, y - 2, x + 18, y - 2, x, y + 18); break;
    case 'wave': g.lineStyle(4, 0xf5c400); for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x - d * 20, y, 12 + k * 10, d > 0 ? -.8 : _mP - .8, d > 0 ? .8 : _mP + .8, false); g.strokePath(); } break;
    case 'rock': g.fillStyle(0x7f8c8d); g.fillRect(x - 10, y - 10, 20, 20); g.fillStyle(0x4d5656); g.fillRect(x - 10, y + 4, 20, 6); break;
    case 'pillar': g.fillStyle(0xe8e0d0); g.fillRect(x - 18, y - 40, 36, 80); g.fillStyle(0xbdb5a3); g.fillRect(x - 10, y - 34, 4, 70); g.fillRect(x + 6, y - 34, 4, 70); g.fillRect(x - 22, y - 44, 44, 8); break;
    case 'clip': g.fillStyle(0x8d6e4f); g.fillRect(x - 10, y - 13, 20, 26); g.fillStyle(0xffffff); g.fillRect(x - 7, y - 8, 14, 18); g.fillStyle(0x888888); g.fillRect(x - 4, y - 15, 8, 4); break;
    case 'clock': g.fillStyle(0xffffff); g.fillCircle(x, y, 13); g.lineStyle(3, 0x111111); g.strokeCircle(x, y, 13); g.lineBetween(x, y, x + _mc(S.T * 12) * 9, y + _ms(S.T * 12) * 9); break;
    case 'robot': g.fillStyle(0x95a5a6); g.fillRect(x - 30, y - 30, 60, 60); g.fillStyle(0xe1ff00); g.fillRect(x - 18, y - 16, 10, 8); g.fillRect(x + 8, y - 16, 10, 8); g.fillStyle(0x34495e); g.fillRect(x - 15, y + 8, 30, 6); g.fillRect(x - 3, y - 42, 6, 12); break;
    case 'peel': g.fillStyle(0xffe135); g.fillRect(x - 14, y - 2, 28, 6); g.fillRect(x - 14, y - 8, 6, 6); g.fillRect(x + 8, y - 8, 6, 6); g.fillRect(x - 3, y - 10, 6, 8); g.fillStyle(0x6d4c2f); g.fillRect(x - 2, y - 13, 4, 3); break;
    case 'ban': g.fillStyle(0xffe135); g.fillRect(x - 10, y - 2, 20, 6); g.fillRect(x - 14, y - 7, 5, 6); g.fillRect(x + 9, y - 7, 5, 6); g.fillStyle(0x6d4c2f); g.fillRect(x - 15, y - 9, 3, 3); g.fillRect(x + 12, y - 9, 3, 3); break;
    case 'hand': g.fillStyle(0x111111); g.fillRect(x - 16, y - 3, 32, 6); g.fillTriangle(x + d * 22, y, x + d * 10, y - 8, x + d * 10, y + 8); break;
  }
}

/* Escenarios descartados: pertenecen a la dirección anterior y ya no se usan.
// ---------- Escenarios ----------
function P(a) { const o = []; for (let i = 0; i < a.length; i += 2) o.push({ x: a[i], y: a[i + 1] }); return o; }
function sky(g, a, b) {
  S.hz = b;
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
  seed = sd; g.fillStyle(S.hz, .3); g.fillRect(0, 0, W, y0);
  for (let x = -10; x < W;) {
    const w = 30 + rr() * 45, h = mn + rr() * (mx - mn);
    g.fillStyle(c); g.fillRect(x, y0 - h, w, h); g.fillStyle(lerpC(c, 0xffffff, .3)); g.fillRect(x, y0 - h, w, 3); g.fillStyle(lerpC(c, 0, .25)); g.fillRect(x + w - 7, y0 - h, 7, h);
    if (win) for (let yy = y0 - h + 8; yy < y0 - 8; yy += 14) for (let xx = x + 6; xx < x + w - 8; xx += 12) if (rr() < .55) { g.fillStyle(win); g.fillRect(xx, yy, 5, 6); }
    x += w + 4;
  }
}
function ground(g, c, line) {
  for (let i = 0; i < 4; i++) { g.fillStyle(lerpC(c, 0xffffff, i * .05)); g.fillRect(0, GR + i * 20, W, 20); }
  g.lineStyle(2, lerpC(c, 0, .4), .7);
  for (let k = -12; k <= 12; k++) g.lineBetween(400 + k * 34, GR, 400 + k * 95, H);
  for (const y of [536, 556, 584]) g.lineBetween(0, y, W, y);
  g.fillStyle(line); g.fillRect(0, GR, W, 4); g.fillStyle(0xffffff, .3); g.fillRect(0, GR + 4, W, 2);
}
function snow(g, pk) { g.fillStyle(0xffffff); for (let i = 0; i < pk.length; i += 2) g.fillTriangle(pk[i], pk[i + 1], pk[i] - 26, pk[i + 1] + 28, pk[i] + 26, pk[i + 1] + 28); }
function tower(g, x, c, win) { g.fillStyle(c); g.fillRect(x, 150, 40, 290); g.fillTriangle(x, 150, x + 40, 150, x + 20, 115); g.fillStyle(win); for (let y = 160; y < 430; y += 12) g.fillRect(x + 4, y, 32, 3); }


function legacyDrawStage(g, id) { return;
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
    g.fillStyle(0x5a0f1a); for (let k = 0; k < 12; k++) g.fillRect(400 + _mc(k * .5236) * 150 - 5, 230 + _ms(k * .5236) * 150 - 5, 10, 10);
    ground(g, 0x220810, 0xff3b3b);
  }
  cyberStage(g, id);
}

// Cada sede se conserva reconocible, pero se ve como un distrito de una misma ciudad nocturna.
function cyberStage(g, id) {
  const C = [0x53d8ff, 0x7bffb4, 0xff7a9d, 0xff4fb0, 0x76f2ce, 0xffbb55, 0xd8ff2f, 0xff3b6b, 0xb088ff][id] || 0xff4f81;
  g.fillStyle(0x070817, id === 7 ? .12 : .31); g.fillRect(0, 0, W, GR);
  // Ventanas, carteles y cableado dan profundidad sin cargar imágenes externas.
  for (let i = 0; i < 10; i++) {
    const x = (i * 89 + id * 31) % 780, h = 48 + (i * 47 + id * 29) % 150;
    g.fillStyle(0x0a0c20, .82); g.fillRect(x, GR - h - 35, 54, h);
    g.fillStyle(C, .45); g.fillRect(x + 5, GR - h - 28, 43, 3);
    for (let y = GR - h - 16; y < GR - 44; y += 16) { g.fillStyle(C, (i + y / 16) % 3 ? .38 : .78); g.fillRect(x + 9, y, 7, 4); g.fillRect(x + 30, y + 5, 10, 3); }
  }
  g.lineStyle(1, C, .38); for (let x = 24; x < W; x += 106) { g.lineBetween(x, 92, x + 42, GR - 45); g.lineBetween(x + 42, GR - 45, x + 105, 130); }
  g.fillStyle(C, .12); g.fillTriangle(0, 120, 105, 150, 0, 370); g.fillTriangle(W, 120, W - 105, 150, W, 370);
  // Emblema abstracto por ciudad: cordillera, torre, río, sol, antena, avila, HQ, deadline y puente.
  g.lineStyle(3, C, .74);
  if (id === 0) { for (let x = 80; x < 260; x += 44) g.lineBetween(x, 255, x + 23, 190 - (x % 3) * 10); }
  else if (id === 1) { g.strokeRect(620, 150, 72, 140); g.lineBetween(656, 115, 656, 150); }
  else if (id === 2) { for (let k = 0; k < 4; k++) g.lineBetween(60, 210 + k * 12, 230, 180 + k * 12); }
  else if (id === 3) { g.strokeCircle(620, 210, 45); g.lineBetween(575, 210, 665, 210); g.lineBetween(620, 165, 620, 255); }
  else if (id === 4) { g.lineBetween(130, 270, 170, 145); g.lineBetween(170, 145, 210, 270); g.lineBetween(145, 205, 195, 205); }
  else if (id === 5) { g.lineBetween(600, 260, 650, 130); g.lineBetween(650, 130, 700, 260); g.lineBetween(615, 218, 685, 218); }
  else if (id === 6) { g.strokeRect(570, 150, 120, 105); g.lineBetween(570, 190, 690, 190); }
  else if (id === 7) { g.strokeCircle(400, 230, 86); for (let k = 0; k < 8; k++) g.lineBetween(400, 230, 400 + _mc(k * .785) * 86, 230 + _ms(k * .785) * 86); }
  else { g.lineBetween(545, 270, 640, 150); g.lineBetween(640, 150, 735, 270); }
}

*/
// ---------- Afiche de madrugada: una sede, una tinta, un símbolo ----------
/* Dirección anterior: mismo skyline para todas las sedes.
function legacyPaperStage(g, id) {
  const C = [0x326b84, 0x3e8871, 0xc94f5a, 0xd67c38, 0x518b79, 0xc48b32, 0xb3a02b, 0xb74350, 0x78629a][id] || 0xc94f5a, I = 0x201a20, P = 0xf2e3bf, A = lerpC(C, P, .35), sx = id & 1 ? 608 : 192;
  g.fillStyle(P); g.fillRect(0, 0, W, H); g.fillStyle(C, .16); for (let x = 18; x < W; x += 34) for (let y = 105 + (x % 3) * 7; y < GR; y += 27) g.fillRect(x, y, 5, 5);
  g.fillStyle(I); g.fillRect(0, 0, W, 88); g.fillStyle(C); g.fillRect(0, 84, W, 4); g.fillStyle(C, .32); g.fillCircle(sx, 188, 116); g.fillStyle(A, .75); g.fillCircle(sx + 8, 180, 93);
  g.fillStyle(I, .88); for (let x = -20; x < W; x += 70) { const h = 42 + (x + id * 31) % 105; g.fillRect(x, GR - h, 56, h); }
  g.fillStyle(I); g.lineStyle(7, I);
  if (id === 0) { g.fillTriangle(0, 350, 168, 128, 338, 350); g.fillTriangle(210, 350, 390, 176, 575, 350); g.lineBetween(55, 285, 325, 226); }
  else if (id === 1) { g.fillRect(574, 132, 110, 212); g.fillStyle(C); g.fillRect(596, 156, 66, 16); g.fillRect(596, 202, 66, 16); g.fillRect(596, 248, 66, 16); }
  else if (id === 2) { g.fillCircle(178, 222, 106); g.fillStyle(P); g.fillCircle(178, 222, 68); g.fillStyle(I); g.fillCircle(178, 222, 19); }
  else if (id === 3) { g.fillRect(595, 150, 50, 198); g.fillTriangle(570, 150, 620, 96, 670, 150); g.fillStyle(C); g.fillRect(605, 174, 30, 122); }
  else if (id === 4) { g.fillTriangle(42, 350, 196, 106, 352, 350); g.lineStyle(6, C); g.lineBetween(94, 298, 298, 208); g.lineBetween(94, 298, 94, 244); g.lineBetween(298, 208, 298, 244); }
  else if (id === 5) { g.fillTriangle(462, 350, 620, 104, 778, 350); g.fillStyle(C); g.fillTriangle(520, 304, 620, 146, 720, 304); }
  else if (id === 6) { g.fillRect(536, 128, 184, 178); g.fillStyle(P); g.fillRect(556, 152, 144, 26); g.fillRect(556, 202, 144, 26); banana(g, 244, 236, 74, 18); }
  else if (id === 7) { g.fillCircle(400, 220, 112); g.fillStyle(P); g.fillCircle(400, 220, 82); g.lineStyle(9, I); g.lineBetween(400, 220, 400, 150); g.lineBetween(400, 220, 462, 242); }
  else { g.lineStyle(11, I); g.lineBetween(488, 326, 640, 128); g.lineBetween(640, 128, 792, 326); g.lineStyle(5, C); g.lineBetween(488, 326, 792, 326); }
  g.fillStyle(I); g.fillRect(0, GR, W, H - GR); g.fillStyle(C); g.fillRect(0, GR, W, 7); for (let x = -70; x < W; x += 88) { g.fillStyle(P, .1); g.fillTriangle(x, GR + 10, x + 34, GR + 10, x + 90, H); }
}
*/
// Trama de manga impreso: puntos que se agrandan hacia arriba del cielo
function trama(g) { g.fillStyle(0, .1); for (let y = 0; y < GR; y += 8) for (let x = (y & 8) / 2; x < W; x += 8) g.fillCircle(x, y, 2.4 * (1 - y / GR)); }
function drawStage(g, id) {
  const C = [0x326b84, 0x3e8871, 0xc94f5a, 0xd67c38, 0x40845b, 0x248aaa, 0xd0a52e, 0xc84c50, 0xd06d3f][id] || 0xc94f5a, S = [0xa8d9ef, 0xb9e4ee, 0xf4d0cf, 0xffd46d, 0x9fd1bd, 0x9bd9e9, 0xffdf7c, 0xf4c3b8, 0xa8d5ed][id] || 0xf2e3bf, F = [0x496f5b, 0x5f746d, 0x627987, 0x9b7042, 0x487159, 0x3d7d69, 0x79652c, 0x6c4d50, 0x397b9e][id] || 0x201a20, I = 0x201a20, L = lerpC(S, 0xffffff, .5), sun = id & 1 ? 626 : 164;
  g.fillStyle(S); g.fillRect(0, 0, W, H); g.fillStyle(L, .78); g.fillCircle(sun, 152, 58); g.fillStyle(0xffffff, .32); for (let k = 0; k < 3; k++) g.fillEllipse(48 + (k * 247 + id * 61) % 690, 105 + (k & 1) * 46, 118, 24);
  g.fillStyle(I); g.fillRect(0, 0, W, 84); g.fillStyle(C); g.fillRect(0, 80, W, 4);
  if (id === 0) { g.fillStyle(0x668cab); g.fillTriangle(0, 400, 180, 122, 365, 400); g.fillTriangle(250, 400, 485, 164, 720, 400); g.fillStyle(0xf5f6f1); g.fillTriangle(132, 195, 180, 122, 228, 195); g.fillTriangle(430, 220, 485, 164, 540, 220); g.lineStyle(4, 0xc84c50); g.lineBetween(42, 255, 412, 184); g.fillStyle(0xc84c50); g.fillRect(214, 196, 38, 22); }
  else if (id === 1) { g.fillStyle(0x58727a); g.fillRect(562, 110, 108, 292); g.fillStyle(0xd0f1ed); for (let y = 132; y < 380; y += 30) g.fillRect(580, y, 72, 11); g.fillStyle(0x5d9c82); g.fillRect(0, 350, W, 62); g.fillStyle(0x2b5554); g.fillRect(90, 312, 220, 42); }
  else if (id === 2) { g.fillStyle(0x83bfda); g.fillRect(0, 336, W, 116); g.fillStyle(0xffffff, .58); for (let y = 358; y < 440; y += 24) g.fillRect(0, y, W, 5); g.fillStyle(0xefede3); g.fillTriangle(355, 412, 432, 412, 408, 104); g.fillStyle(0xcfcfc5); g.fillTriangle(408, 104, 432, 412, 408, 412); g.fillStyle(0xb9614f); g.fillRect(0, 428, W, 24); }
  else if (id === 3) { g.fillStyle(0xffd46d); g.fillRect(0, 84, W, GR - 84); g.fillStyle(0xffe676, .88); g.fillCircle(612, 158, 86); g.fillStyle(0xffffff, .28); g.fillEllipse(144, 152, 154, 22); g.fillEllipse(272, 194, 108, 18); g.fillStyle(0xc94f5a); g.fillTriangle(0, 466, 402, 286, 800, 466); g.lineStyle(4, 0xf7dd7c, .7); for (let x = 38; x < W; x += 108) g.lineBetween(402, 300, x, 458); g.fillStyle(0x7b8580); for (let x = 20; x < W; x += 64) g.fillRect(x, 304 + (x % 3) * 11, 42, 102); g.fillStyle(0xb66742); g.fillRect(480, 382, 98, 15); g.fillRect(490, 368, 78, 14); g.fillStyle(0xf8efc9); g.fillRect(518, 174, 22, 194); g.fillRect(506, 204, 46, 14); g.fillStyle(0xf3c94d); g.fillCircle(529, 108, 8); g.fillTriangle(529, 116, 518, 150, 540, 150); g.fillStyle(0xfff1a8); g.fillTriangle(524, 122, 474, 108, 521, 145); g.fillTriangle(534, 122, 584, 108, 537, 145); g.fillStyle(0x263b45); g.fillRect(45, 334, 250, 64); g.fillStyle(0xc94f5a); g.fillRect(55, 343, 230, 41); g.fillStyle(0xf8efc9); for (let x = 69; x < 268; x += 32) g.fillRect(x, 350, 19, 13); g.fillStyle(0x263b45); g.fillCircle(85, 394, 10); g.fillCircle(253, 394, 10); g.fillStyle(0xc94f5a); g.fillCircle(72, 312, 21); g.lineStyle(4, 0xf8efc9); g.lineBetween(59, 321, 59, 304); g.lineBetween(59, 304, 72, 318); g.lineBetween(72, 318, 85, 304); g.lineBetween(85, 304, 85, 321); }
  else if (id === 4) { g.fillStyle(0x4d8961); g.fillTriangle(0, 400, 184, 104, 370, 400); g.fillTriangle(252, 400, 440, 156, 630, 400); g.fillStyle(0x72a878); g.fillTriangle(0, 418, 210, 226, 430, 418); g.fillStyle(0xf8f4e7); g.fillRect(438, 228, 212, 128); g.fillTriangle(414, 228, 544, 132, 674, 228); g.fillStyle(0x3a6960); for (let x = 464; x < 630; x += 42) g.fillRect(x, 258, 20, 42); g.lineStyle(7, 0xf8f4e7); g.lineBetween(544, 132, 544, 82); g.lineBetween(526, 105, 562, 105); }
  else if (id === 5) { g.fillStyle(0x3e865c); g.fillTriangle(0, 396, 190, 152, 415, 252); g.fillTriangle(270, 396, 515, 126, 800, 382); g.fillStyle(0x5fa169); g.fillTriangle(0, 424, 235, 256, 500, 424); g.lineStyle(9, 0x315c49); for (let x = 100; x < W; x += 220) { g.lineBetween(x, 426, x, 318); g.lineBetween(x, 332, x - 35, 300); g.lineBetween(x, 332, x + 38, 302); } }
  else if (id === 6) { g.fillStyle(0xf0cc5b); g.fillRect(486, 132, 224, 250); g.fillStyle(0xf7edd0); for (let y = 154; y < 338; y += 42) g.fillRect(510, y, 176, 22); g.fillStyle(0x326b84); g.fillRect(532, 154, 36, 160); g.fillRect(622, 154, 36, 160); banana(g, 238, 236, 82, 22); }
  else if (id === 7) { g.fillStyle(0xf8f3e6); g.fillRect(174, 108, 452, 298); g.lineStyle(5, 0xc84c50); g.strokeRect(174, 108, 452, 298); g.fillStyle(0xc84c50); for (let y = 145; y < 280; y += 38) g.fillRect(208, y, 152, 14); g.fillStyle(0xc84c50); g.fillCircle(500, 250, 90); g.fillStyle(0xf8f3e6); g.fillCircle(500, 250, 66); g.lineStyle(8, 0x201a20); g.lineBetween(500, 250, 500, 198); g.lineBetween(500, 250, 544, 272); }
  else { g.fillStyle(0x64adcb); g.fillRect(0, 340, W, 130); g.lineStyle(13, 0xd06d3f); g.lineBetween(0, 314, W, 314); for (const x of [214, 586]) { g.fillStyle(0xd06d3f); g.fillRect(x - 16, 130, 32, 214); g.lineStyle(7, 0xd06d3f); g.lineBetween(x - 54, 166, x + 54, 166); g.lineBetween(x - 16, 130, x - 76, 314); g.lineBetween(x + 16, 130, x + 76, 314); } }
  g.fillStyle(F); g.fillRect(0, GR, W, H - GR); g.fillStyle(C); g.fillRect(0, GR, W, 7); for (let x = 24; x < W; x += 62) { g.fillStyle(L, .22); g.fillRect(x, GR + 34 + (x % 3) * 9, 30, 4); }
}

function stageFx(g, id) {
  // El público se limita al suelo: no tapa el paisaje ni el hito de la sede.
  const j = S.hy > 0 ? S.hy : 0;
  for (let i = 0; i < 34; i++) {
    const x = i * 24 + (i & 1) * 9, y = GR - 20 + (i % 3) * 6 + _ms(S.T * 6 + i * 1.7) * 2 - j * 22 * (i % 3) / 2;
    g.fillStyle(0x0c0c14, .9); g.fillRect(x - 8, y, 16, GR - y); g.fillCircle(x, y - 6, 7);
    if (j > .2 && !(i % 3)) { g.fillRect(x - 12, y - 22, 3, 15); g.fillRect(x + 9, y - 22, 3, 15); }
    if (i % 5 === 2) { g.fillStyle(0xffffff, .5 + _ms(S.T * 9 + i) * .4); g.fillRect(x + 6, y - 15, 3, 4); }
  }
  if (id === 7 && _mr() < .08) { g.fillStyle(0xff3b3b, .3); g.fillRect(0, rnd(0, GR), W, rnd(3, 14)); }
  const fl = (S.T % 4) < .12;
  if (id % 8 < 6) { if (!(S.pkt > 0)) { g.fillStyle(0xf2ff00, .18 + _ms(S.T * 6) * .1); g.fillCircle(640, GR - 30, 44); prop(g, id); } nacho(g, 745, GR - 4, 2.4, fl, -1); } else nacho(g, 750, GR - 4, 2.4, fl);
}


// ---------- Identidad: afiche de madrugada, no interfaz neón ----------
const Y = 0xe5ad31, CY = 0x326b84, PK = 0xc94f5a, IV = 0x201a20, CR = 0xf2e3bf;
function menuBg(g) {
  g.fillStyle(CR); g.fillRect(0, 0, W, H); g.fillStyle(IV); g.fillTriangle(0, 0, 330, 0, 0, H); g.fillTriangle(W, 0, 470, 0, W, H);
  g.fillStyle(PK, .82); g.fillRect(0, 472, W, 72); g.fillStyle(CY, .84); g.fillTriangle(145, 0, 400, 432, 655, 0);
  for (let i = 0; i < 13; i++) { g.fillStyle(IV, .12); g.fillCircle(46 + i * 58, 72 + (i % 3) * 26, 5 + i % 4); }
  g.fillStyle(IV); g.fillRect(24, 20, 82, 4); g.fillRect(W - 106, 20, 82, 4); g.fillRect(0, H - 18, W, 6);
}

// ---------- Pantalla: titulo ----------
function initTitle() {
  const g = S.bg;
  menuBg(g);
  tx(42, 36, 'PLATANUS HACK [26]', 16, '#f2e3bf', 0);
  tx(758, 36, 'SANTIAGO · 36 HORAS', 11, '#f2e3bf', 1);
  tx(W / 2, 92, 'CAMPEONATO DE LA DEMO', 13, '#201a20');
  tx(W / 2, 150, 'ÚLTIMA DEMO', 58, '#201a20').setShadow(4, 4, '#c94f5a', 0, false, true);
  tx(W / 2, 204, 'NO HAY PITCH SIN PELEA', 12, '#201a20');
  g.fillStyle(IV); g.fillRect(178, 238, 440, 42); g.fillStyle(PK); g.fillRect(188, 244, 420, 30); g.fillStyle(IV); g.fillRect(198, 286, 400, 42); g.fillStyle(CY); g.fillRect(208, 292, 380, 30);
  S.b1 = tx(W / 2, 258, 'START 1 · CAMPAÑA', 19, '#f2e3bf');
  S.b2 = tx(W / 2, 306, 'START 2 · VERSUS', 19, '#f2e3bf');
  tx(W / 2, 370, '7 CREDENCIALES · 7 CAMPEONES · 1 DEMO', 11, '#201a20');
  S.demo = [mkF(0, 4, TEAMS[4].m[1], '', 0), mkF(1, 2, TEAMS[2].m[2], '', 0)]; S.demo[0].face = 1; S.demo[1].face = -1;
}
function updTitle(dt) {
  S.g.clear();
  S.g.lineStyle(4, CY, .8); S.g.lineBetween(78, 500, 355, 454); S.g.lineStyle(4, PK, .8); S.g.lineBetween(722, 500, 445, 454);
  S.demo.forEach((f, j) => { f.anim += dt; drawF(S.g, f, j ? 590 : 210, 590, 1.32); });
  S.b1.setAlpha(S.T % 1 < .6 ? 1 : .55);
  if (pr('START1')) { snd('ok'); S.np = 1; go('sel'); }
  else if (pr('START2')) { snd('ok'); S.np = 2; go('sel'); }
}

// ---------- Pantalla: seleccion ----------
function initSel() {
  const g = S.bg;
  menuBg(g); g.fillStyle(IV); g.fillRect(92, 14, 616, 34); g.fillStyle(CR, .96); g.fillRect(40, 56, 320, 510); g.fillRect(440, 56, 320, 510); g.lineStyle(4, CY); g.strokeRect(40, 56, 320, 510); g.lineStyle(4, PK); g.strokeRect(440, 56, 320, 510);
  tx(W / 2, 32, 'MESA DE ACREDITACIONES · ELIGE TU CREDENCIAL', 13, '#f2e3bf');
  S.sel = [0, 1].map(i => {
    const s = { ph: i < S.np ? 0 : 9, t: i ? 6 : 4, cx: 200 + i * 400 };
    s.lk = TEAMS[s.t].m[0].split('').map(Number);
    s.d = mkF(i, s.t, s.lk, '', 0);
    tx(s.cx, 58, 'JUGADOR ' + (i + 1), 18, i ? '#c94f5a' : '#326b84');
    s.tT = tx(s.cx, 120, '', 24); s.tC = tx(s.cx, 148, '', 13, '#51424c');
    s.tP = tx(s.cx, 196, '', 12, '#201a20');
    s.tN = tx(s.cx, 488, '', 24, '#201a20');
    s.tH = tx(s.cx, 545, '', 12, '#201a20');
    return s;
  });
  if (S.np === 1) tx(600, 300, 'MODO CAMPAÑA\n\n3 CREDENCIALES DE SEDE,\nLUEGO RAFA\nY LA ÚLTIMA DEMO.', 15, '#201a20');
}
function updSel(dt) {
  S.g.clear();
  let ready = 0;
  S.sel.forEach((s, i) => {
    if (s.ph === 9) return;
    const P = i ? 'P2_' : 'P1_';
    if (!s.ph) {
      const d = pr(P + 'D') || pr(P + 'R') ? 1 : pr(P + 'U') || pr(P + 'L') ? 7 : 0;
      if (d) { s.t = SELT[(SELT.indexOf(s.t) + d) % 8]; s.lk = TEAMS[s.t].m[0].split('').map(Number); snd('sel'); }
      if (pr(P + '1') || pr(i ? 'START2' : 'START1')) { s.ph = 3; s.name = TEAMS[s.t].n; snd('ok'); }
    } else if (pr(P + '6')) s.ph = 0;
    if (s.ph === 3) ready++;
    const T = TEAMS[s.t];
    for (let j = 0; j < 8; j++) { const k = SELT[j]; S.g.fillStyle(TEAMS[k].col, k === s.t ? 1 : .35); S.g.fillRect(s.cx - 138 + j * 35, 60, 29, 26); if (k === s.t) { S.g.lineStyle(3, 0xffffff); S.g.strokeRect(s.cx - 140 + j * 35, 58, 36, 30); } }
    s.tT.setText((s.ph === 0 ? '◄ ' : '') + T.n + (s.ph === 0 ? ' ►' : '')).setColor('#' + T.col.toString(16).padStart(6, '0'));
    s.tC.setText(T.c + ' · ' + T.h);
    s.tP.setText('SEDE · ' + SN[T.st] + '\n3 · ' + T.p[0] + '\n4 · ' + T.p[1] + '\n5 · SÚPER: ' + T.p[2]);
    s.d.t = s.t; s.d.look = s.lk; s.d.anim += dt; s.d.win = s.ph === 3 ? 1 : 0;
    drawF(S.g, s.d, s.cx, 438, 1.15);
    s.tN.setText(s.ph ? '¡LISTO!' : '');
    s.tH.setText(s.ph ? 'ESPERANDO...  (6 ATRÁS)' : '▲▼ ELIGE TU EQUIPO · BOTÓN 1 OK');
  });
  if (ready === S.np) {
    const a = S.sel[0];
    S.hum = { t: a.t, lk: a.lk.slice(), name: a.name };
    if (S.np === 2) {
      const b = S.sel[1];
      S.F = [mkF(0, a.t, a.lk, a.name, 0), mkF(1, b.t, b.lk, b.name, 0)];
      S.stage = _mr() < .5 ? TEAMS[_mr() < .5 ? a.t : b.t].st : [0, 1, 2, 3, 4, 5, 6, 8][_mr() * 8 | 0]; S.lv = 0;
      go('vs');
    } else {
      S.lad = SELT.filter(x => x !== a.t).sort(() => _mr() - .5).slice(0, 3).concat([7, 8]);
      S.li = 0; S.ch = []; go('story');
    }
  }
}
function nextArcade() {
  const t = S.lad[S.li], h = S.hum, T = TEAMS[t];
  S.F = [mkF(0, h.t, h.lk, h.name, 0), mkF(1, t, T.m[(_mr() * T.m.length) | 0], T.n, 1)];
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
// Intro tipo cómic: 3 viñetas antes de la primera pelea (botón 1 = siguiente, START = saltar)
const STY = [
  [0, 'PLATANUS HACK 26 · 7 SEDES', '7 EQUIPOS GANARON SU SEDE.\nTODOS QUIEREN LA FOTO CON EL EQUIPO PLATANUS.'],
  [6, 'PLATANUS HQ · VIERNES 20 DE NOVIEMBRE', 'RAFA: «LA FINAL ES EN SANTIAGO.\nSOLO UN EQUIPO SALE EN LA FOTO.»'],
  [7, 'SANTIAGO, CHILE · 36 HORAS', ''],
];
function initStory() {
  const m = (i, t, l) => mkF(i, t, l, '', 1);
  S.sf = [0, 1, 2, 3, 4, 5, 6].map(t => m(0, t, TEAMS[t].m[0]));
  S.sr = m(0, 7, TEAMS[7].m[0]); S.sd = m(1, 8, TEAMS[8].m[0]); S.sh = m(0, S.hum.t, S.hum.lk);
  panel(0);
}
function panel(k) {
  clr(); S.sp = k; S.st = 0; S.flat = 0;
  const P = STY[k], g = S.bg;
  drawStage(g, P[0]); g.fillStyle(0, .3); g.fillRect(0, 0, W, H);
  g.fillStyle(0, .85); g.fillRect(0, 0, W, 52); g.fillRect(0, 482, W, 118);
  tx(W / 2, 26, P[1], 18, '#e1ff00');
  tx(W / 2, 528, P[2] || 'TU EQUIPO: ' + TEAMS[S.hum.t].n + '. 5 PELEAS EN 36 HORAS.\nCADA DECISIÓN CAMBIA EL FINAL.', 17);
  tx(W - 12, 584, k + 1 + '/3 · BOTÓN 1 SIGUE · START SALTA', 10, '#b8c48d', 1);
}
function updStory(dt) {
  const g = S.g, k = S.sp, d = (f, x, y, s, fc) => { f.anim += dt; f.face = fc; drawF(g, f, x, y, s); };
  g.clear();
  if (!k) S.sf.forEach((f, i) => d(f, 130 + i * 90, 452 + (i & 1) * 22, 1, i < 3 ? 1 : i > 3 ? -1 : 1));
  else if (k < 2) d(S.sr, 400, 478, 1.9, 1);
  else { d(S.sh, 240, 478, 1.7, 1); d(S.sd, 560, 478, 1.7, -1); }
  if (S.st > .3 && pr('START1')) return nextArcade();
  if (S.st > .3 && pr('P1_1') || S.st > (k > 1 ? 7 : 5)) k < 2 ? panel(k + 1) : nextArcade();
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
  if (S.st > 1.2 && (pr('P1_1') || pr('START1'))) { S.ch[S.ck] = S.cs; snd('ok'); nextArcade(); }
}

// ---------- Pantalla: VS ----------
function initVs() {
  drawStage(S.bg, S.stage); trama(S.bg);
  S.bg.fillStyle(0x000000, .55); S.bg.fillRect(0, 0, W, H);
  const [a, b] = S.F;
  a.face = 1; b.face = -1;
  [a, b].forEach((f, i) => {
    const x = 200 + i * 400, T = TEAMS[f.t];
    tx(x, 70, f.name, 30, i ? '#c94f5a' : '#e5ad31');
    tx(x, 104, isTeam(f.t) ? 'TEAM ' + T.n + ' · ' + T.c : T.c, 14, '#f7ffd8');
    tx(x, 150, '«' + quote(f) + '»', 12, '#ffffff');
  });
  if (S.np === 1) tx(W / 2, 30, HR[S.li] + (S.li === 3 ? ' (NACHO EN LA CÁMARA)' : ''), 16, '#ffffff');
  S.vsT = tx(W / 2, 290, 'VS', 64, '#ffffff');
  if (JP && S.F[1].t > 6) for (const [x, y] of [[640, 220], [700, 330], [610, 420]]) tx(x, y, 'ゴゴゴ', 30, '#9b59d0').setAngle(-12);
  // Ficha de ronda impresa: tinta azul, roja y papel, sin el marco neón anterior.
  const g = S.bg;
  g.fillStyle(CY); g.fillRect(0, 0, 18, H); g.fillStyle(PK); g.fillRect(W - 18, 0, 18, H); g.fillStyle(CR); g.fillRect(28, 516, W - 56, 70); g.fillStyle(IV); g.fillRect(38, 526, W - 76, 50);
  for (let y = 74; y < 490; y += 58) { g.fillStyle(PK); g.fillRect(8, y, 10, 24); g.fillStyle(CY); g.fillRect(W - 18, y + 24, 10, 24); }
  tx(W / 2, 544, 'RONDA DE DEMO · A 2 DE 3 CAÍDAS', 22, '#f2e3bf');
  tx(W / 2, 570, 'ESCENARIO: ' + SN[S.stage], 12, '#f2e3bf');
}
function updVs(dt) {
  S.g.clear();
  S.F.forEach((f, i) => { f.anim += dt; drawF(S.g, f, 200 + i * 400, 480, 1.9); });
  S.vsT.setScale(1 + _ms(S.T * 8) * .08);
  if (S.st > 2.8 || pr('START1') || pr('START2')) go('fight');
}

// ---------- Pantalla: pelea ----------
function initFight() {
  drawStage(S.bg, S.stage); trama(S.bg);
  S.rd = 1; S.F.forEach(f => { f.wins = 0; f.m = 0; });
  S.F.forEach((f, i) => {
    const L = !i, T = TEAMS[f.t];
    tx(L ? 30 : 770, 58, f.name, 16, '#ffffff', L ? 0 : 1);
    tx(L ? 30 : 770, 75, isTeam(f.t) ? 'TEAM ' + T.n : T.c, 11, '#' + T.col.toString(16).padStart(6, '0'), L ? 0 : 1);
    tx(L ? 30 : 770, 588, '3 ' + T.p[0] + ' · 4 ' + T.p[1] + ' · 5 ' + T.p[2], 10, '#f7ffd8', L ? 0 : 1);
  });
  S.tt = tx(W / 2, 32, '36', 34, '#ffffff');
  tx(W / 2, 104, SL[S.stage], 11, '#201a20');
  S.cT = [tx(130, 120, '', 24, '#ff6ec7'), tx(670, 120, '', 24, '#ff6ec7')];
  if (S.stage === 6) tx(675, 145, '36:00', 30, '#e1ff00');
  S.photo = 0; S.na = 6;
  S.vw = 800 + (S.li || 0) * 700; S.cq = []; S.ct = 2;
  S.cl = [0, 1, 2, 3].map(i => tx(770, 166 + i * 15, '', 11, '#fff', 1)); S.vT = tx(W / 2, 80, '', 10, '#ff5050'); hype(0);
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
    // curva: el CPU pega suave al inicio y fuerte en los jefes; a los jefes les cuesta más bajarles vida
    const o = S.F[1], B = o.t === 7 || o.t === 8;
    o.dm = B ? 1 : .7 + S.li * .12; if (B) h.dm *= .85;
  }
  // 5: aviso de controles en el primer round de la primera pelea
  if (!S.li && S.rd === 1) S.sc.tweens.add({ targets: tx(W / 2, 262, '1 GOLPE · 2 PATADA · 3/4 PODERES · 5/6 SÚPER\nCAMINA HACIA ATRÁS PARA BLOQUEAR', 18), alpha: 0, delay: 4500, duration: 600 });
  ann('ROUND ' + S.rd, '#ffffff', 700);
  later(1, () => { ann('¡A HACKEAR!', '#e1ff00', 500); snd('ok'); });
}
function endRound(w) {
  if (w) {
    w.wins++; w.win = 1;
    if (!w.cpu && w.tk < .5) flt(w, '¡PERFECTO!', '#e1ff00');
  }
  S.ph = 'end'; S.pt = 2.6; S.pr = []; S.tm = [];
}
function updFight(dt) {
  const [a, b] = S.F;
  S.hy -= dt; S.sl -= dt;
  if ((S.ct -= dt) < 0) { S.ct = rnd(2.5, 5); chat('i', _mr() < .3 && 'VAMOS ' + (_mr() < .5 ? a : b).name); hype(rnd(10, 60) | 0); }
  if (S.hst > 0) { S.hst -= dt; drawFight(0); return; }
  if (S.slo > 0) { S.slo -= dt; dt *= .3; if (S.slo <= 0) S.sc.cameras.main.zoomTo(1, 200).pan(W / 2, H / 2, 200); }
  if (S.ph === 'intro') { S.pt -= dt; if (S.pt <= 0) S.ph = 'fight'; }
  for (let i = S.tm.length - 1; i >= 0; i--) { const t = S.tm[i]; t.t -= dt; if (t.t <= 0) { S.tm.splice(i, 1); t.fn(); } }
  step(a, b, dt); step(b, a, dt);
  if (!a.ko && !b.ko && _ma(a.x - b.x) < 46 && _ma(a.y - b.y) < 120) {
    const p = (46 - _ma(a.x - b.x)) / 2, s = a.x <= b.x ? -1 : 1;
    a.x = clampX(a.x + s * p); b.x = clampX(b.x - s * p);
  }
  if (S.ph === 'fight') {
    S.time -= dt;
    // musica
    // proyectiles
    for (let i = S.pr.length - 1; i >= 0; i--) {
      const p = S.pr[i];
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt;
      let dead = p.l <= 0 || p.x < -60 || p.x > W + 60 || p.y > H + 60;
      const o = S.F[1 - p.ow];
      if (!dead && !p.fx.ub) for (const w of S.walls) if (w.ow !== p.ow && _ma(p.x - w.x) < 16 && p.y > GR - 110) { dead = true; spark(p.x, p.y, 0x8d6e4f, 6); snd('blk'); }
      if (!dead) {
        const top = o.y - (o.cr ? 106 : 170);
        if (_ma(p.x - o.x) < p.w / 2 + 20 && p.y + p.h / 2 > top && p.y - p.h / 2 < o.y) { hurt(o, p.d, S.F[p.ow], p.fx); dead = true; }
      }
      if (!dead && !p.nc && !p.fx.ub) for (const q of S.pr) if (q !== p && q.ow !== p.ow && !q.nc && !q.fx.ub && _ma(q.x - p.x) < 22 && _ma(q.y - p.y) < 22) { q.l = 0; dead = true; spark(p.x, p.y, 0xffffff, 10); snd('blk'); }
      if (dead) S.pr.splice(i, 1);
      if (S.ph !== 'fight') break;
    }
    for (let i = S.walls.length - 1; i >= 0; i--) if ((S.walls[i].l -= dt) <= 0) S.walls.splice(i, 1);
    if (S.stage % 8 < 6 && (S.pkt -= dt) <= 0) for (const f of S.F) if (!f.ko && f.gr && _ma(f.x - 640) < 36) { boost(f, S.stage); S.pkt = 12; break; }
    // Nacho ayuda a Rafa
    if (b.t === 7) {
      S.na -= dt;
      if (S.na <= 0) { S.na = 7; S.fl = .35; snd('blk'); }
      if (!S.photo && b.hp < 50) { S.photo = 1; S.fl = .6; if (S.ch[2] !== 0) a.stun = 1; ann('¡FOTO DEL EQUIPO!', '#1abc9c', 900); snd('ctr'); }
    }
    if (S.time <= 0 && S.ph === 'fight') {
      S.time = 0;
      if (_ma(a.hp - b.hp) < .5) { ann('¡EMPATE!', '#ffffff', 1400); endRound(null); }
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
  for (const f of S.F) { g.fillStyle(0xfff6d0, .14); g.fillEllipse(f.x, GR + 4, 190, 30); } // círculo de luz bajo cada luchador
  // viñeta de manga: en golpes fuertes y KO el fondo se vuelve papel con líneas de velocidad hacia el impacto
  if (S.sl > 0) {
    g.fillStyle(0xfdf8ec, _mn(1, S.sl * 4)); g.fillRect(0, 0, W, H);
    g.fillStyle(0x111111); for (let k = 0; k < 44; k++) { const a = k * .1428 + S.T, r = 70 + (k * 37) % 50; g.fillTriangle(S.slx + _mc(a) * r, S.sly + _ms(a) * r, S.slx + _mc(a - .03) * 900, S.sly + _ms(a - .03) * 900, S.slx + _mc(a + .03) * 900, S.sly + _ms(a + .03) * 900); }
  }
  drawF(g, b, b.x, b.y, 1.15); drawF(g, a, a.x, a.y, 1.15); codeRain(g, a); codeRain(g, b);
  for (const p of S.pr) drawP(g, p);
  for (let i = S.pa.length - 1; i >= 0; i--) { const q = S.pa[i]; q.l -= dt; q.vy += 900 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.l <= 0) S.pa.splice(i, 1); else { g.fillStyle(q.c); g.fillRect(q.x - 3, q.y - 3, 6, 6); } }
  for (let i = S.imp.length - 1; i >= 0; i--) { const q = S.imp[i], z = 14 * q.s * (q.l / .12 + .4); q.l -= dt || .016; if (q.l <= 0) { S.imp.splice(i, 1); continue; } g.fillStyle(0xffffff); g.fillRect(q.x - z * 1.6, q.y - 3, z * 3.2, 6); g.fillRect(q.x - 3, q.y - z * 1.6, 6, z * 3.2); g.fillStyle(0xffe066); g.fillRect(q.x - z / 2, q.y - z / 2, z, z); }
  hud();
}
function hud() {
  const h = S.h; h.clear();
  for (let k = 0; k < 8; k++) { h.lineStyle(9, 0, .065); h.strokeRect(k * 9, k * 9, W - k * 18, H - k * 18); }
  h.fillStyle(0x070813, .72); h.fillRect(0, 0, W, 86); h.fillRect(0, 548, W, 52); h.fillRect(W - 330, 156, 320, 66);
  h.fillStyle(PK); h.fillRect(364, 8, 16, 4); h.fillStyle(CY); h.fillRect(420, 8, 16, 4); h.fillStyle(CR); h.fillRect(384, 8, 32, 4);
  S.F.forEach(f => {
    if (f.ghp > f.hp) f.ghp = _mx(f.hp, f.ghp - 35 * S.dt); else f.ghp = f.hp;
    const L = f.i === 0, x0 = L ? 30 : 450, w = 320, gw = w * f.ghp / 100, hw = w * f.hp / 100;
    const tc = TEAMS[f.t].col, ac = TEAMS[f.t].ac;
    h.fillStyle(0x000000); h.fillRect(x0 - 3, 15, w + 6, 24);
    h.fillStyle(0x311320); h.fillRect(x0, 18, w, 18);
    h.fillStyle(lerpC(tc, 0xffffff, .58)); h.fillRect(L ? x0 + w - gw : x0, 18, gw, 18);
    h.fillStyle(f.hp > 30 ? tc : 0xff5050); h.fillRect(L ? x0 + w - hw : x0, 18, hw, 18);
    h.fillStyle(0xffffff, .4); h.fillRect(L ? x0 + w - hw : x0, 20, hw, 4); h.fillStyle(0, .25); h.fillRect(L ? x0 + w - hw : x0, 32, hw, 4);
    for (let k = 0; k < 2; k++) { h.fillStyle(k < f.wins ? 0xffd400 : 0x333333); h.fillCircle(L ? x0 + w - 10 - k * 18 : x0 + 10 + k * 18, 50, 6); }
    const mx = L ? 30 : 570;
    h.fillStyle(0x000000); h.fillRect(mx - 2, 556, 204, 14);
    h.fillStyle(f.m >= 100 ? (S.T * 8 % 2 < 1 ? ac : 0xffffff) : lerpC(tc, 0x4fe7ff, .35)); h.fillRect(mx, 558, 200 * f.m / 100, 10);
    for (let k = 0; k < 2; k++) {
      const cx = L ? 250 + k * 22 : 530 - k * 22, r = _mx(0, f.cd[k]) / (k ? 4.5 : 2.2);
      h.fillStyle(0x000000); h.fillRect(cx - 9, 551, 18, 24);
      h.fillStyle(f.sil > 0 ? 0x555555 : r > 0 ? 0x34495e : 0x2ecc71); h.fillRect(cx - 7, 553 + 20 * r, 14, 20 * (1 - r));
    }
  });
  S.tt.setText(String(Math.ceil(_mx(0, S.time)))).setColor(S.time < 10 ? '#ff5050' : '#ffffff');
  S.F.forEach((f, i) => S.cT[i].setText(f.cbt > 0 && f.cb >= 2 ? f.cb + ' GOLPES' : '').setScale(1 + _mx(0, f.cbt - .7)));
}
function matchOver(w) {
  if (!w.cpu) save();
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
  tx(W / 2, 420, 'START 1 · SEGUIR HACKEANDO', 16, '#e1ff00');
  tx(W / 2, 446, 'BOTÓN 6 · CAMBIAR DE PERSONAJE', 14, '#b8c48d');
}
function updOver() {
  const n = 9 - Math.floor(S.st);
  S.ct.setText(String(_mx(0, n)));
  if (pr('START1')) nextArcade();
  else if (pr('P1_6')) { S.np = 1; go('sel'); }
  else if (n < 0) go('title');
}
function initEnd() {
  drawStage(S.bg, 6); S.bg.fillStyle(0x000000, .85); S.bg.fillRect(0, 0, W, H);
  S.fl = 1.2; snd('ko');
  tx(W / 2, 190, '¡FOTO CON EL EQUIPO PLATANUS!', 32, '#e1ff00');
  tx(W / 2, 224, 'CAMPEÓN: ' + S.hum.name + ' · TEAM ' + TEAMS[S.hum.t].n, 18, '#ffffff');
  const c = S.ch, e = c[2] === 1 ? ['FINAL: LA DEMO LOCAL', 'LA DEMO CORRIÓ EN TU LAPTOP... HASTA QUE SE APAGÓ.\nGANASTE IGUAL. PRÓXIMA VEZ: DEPLOY TEMPRANO.'] : c[0] === 0 ? ['FINAL: EL PITCH PERFECTO', 'DURMIERON, HICIERON DEPLOY Y LA DEMO CORRIÓ EN VIVO.\nEL JURADO PIDIÓ EL LINK.'] : ['FINAL: PRODUCTO EN VIVO, OJERAS EN VIVO', 'LA DEMO FUNCIONÓ EN PRODUCCIÓN.\nNADIE RECUERDA EL PITCH, TODOS RECUERDAN LAS OJERAS.'];
  tx(W / 2, 260, e[0], 17, '#ff6ec7');
  tx(W / 2, 302, e[1] + '\n' + (c[1] === 0 ? 'EL PIVOTE SALIÓ BIEN.' : 'DEFENDISTE LA IDEA HASTA EL FINAL.'), 13, '#f7ffd8');
  tx(W / 2, 580, 'START · VOLVER AL INICIO', 14, '#b8c48d');
  tx(W / 2, 128, 'LA SEÑAL QUEDA EN TU EQUIPO', 13, '#b8c48d');
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
})();
