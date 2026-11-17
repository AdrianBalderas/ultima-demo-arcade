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
// look = piel, color de pelo, peinado (0 corto, 1 largo, 2 rizado, 3 cola, 4 gorra), lentes
const TEAMS = [
  { n: 'LITTLE DRAGONS', c: 'SANTIAGO 2024', h: 'NEXO ANDINO', col: 0x2563eb, ac: 0xffe066, st: 0, p: ['MONEDA DE FUEGO', 'EVOLUCIÓN', 'INTERÉS COMPUESTO'], m: ['1000'] },
  { n: 'HEDGIE', c: 'SANTIAGO 2025', h: 'MUT VERDE', col: 0x27ae60, ac: 0xffffff, st: 1, p: ['COPY TRADE', 'COBERTURA', 'VENTA EN CORTO'], m: ['1000'] },
  { n: 'RECORD.AI', c: 'SANTIAGO 2025', h: 'OJO FANTASMA', col: 0x3a3a3a, ac: 0xe8e8e8, st: 1, p: ['ESCANEO FACIAL', '¿CÓMO TE LLAMABAS?', 'RECUERDO TOTAL'], m: ['1000'] },
  { n: 'TRANQUERA', c: 'BUENOS AIRES 2026', h: 'PAMPERO', col: 0x2b2a26, ac: 0xefede6, st: 2, p: ['TRANQUERA CERRADA', '[REDACTADO]', 'REGLA VIOLADA'], m: ['1000'] },
  { n: 'DOMINIKITO', c: 'CDMX 2026', h: 'LÚMINA', col: 0x5c3cd5, ac: 0xffffff, st: 3, p: ['ELIGE TU CAMINO', 'CUENTO VIVO', 'PERFIL EMOCIONAL'], m: ['1000'] },
  { n: 'WOKI', c: 'BOGOTÁ 2026', h: 'CÓNDOR', col: 0xf2f2f2, ac: 0x111111, st: 4, p: ['SEÑAL LORA', 'SOS', 'RESCATE'], m: ['1000'] },
  { n: 'MUS3O', c: 'CARACAS 2026', h: 'ÁVILA', col: 0x8e2a1e, ac: 0xd9a441, st: 5, p: ['SALA NUEVA', 'MODO EXAMEN', 'PALACIO DE LA MEMORIA'], m: ['1000'] },
  { n: 'RAFA', c: 'EL ORGANIZADOR', h: 'EL CURADOR', col: 0xe1ff00, ac: 0x1b1b1b, st: 6, p: ['CAMBIO DE LOGÍSTICA', 'CRONOGRAMA', 'DE CERO A PRODUCTO'], m: ['1000'] },
  { n: 'EL DEADLINE', c: '36 HORAS', h: '00:00', col: 0xff3b3b, ac: 0xffffff, st: 7, p: ['TIC TAC', 'ÚLTIMO COMMIT', 'DEPLOY A LAS 4AM'], m: ['1000'] },
  { n: 'EL PLÁTANO', c: 'COMODÍN', h: 'EL COMODÍN', col: 0xffe135, ac: 0x6d4c2f, st: 6, p: ['CÁSCARA', 'POTASIO', 'LLUVIA DE PLÁTANOS'], m: ['1000'] },
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
  S.fx = this.add.graphics().setDepth(7); S.spr = [];
  this.textures.once('addtexture-bg', () => { S.bgi = this.add.image(400, 300, 'bg').setDisplaySize(W, H).setDepth(-1).setVisible(false); });
  this.textures.addBase64('bg', 'data:image/webp;base64,' + 'UklGRkAMAABXRUJQVlA4IDQMAAAQTQCdASrQAJwAPyF6sVItJ6SrsPb+aaAkCWxpzldGHuweXpyT41BTvNPme9t6bdw_z0zlXSePX6xH_Jd3LblIP_IEYeLqm_d_oglT_JyZaOV36ZN3tyLxJuvi3DsMtEMHYxi6LM4O91jV7sPx2GFJl+Aiia+Ti4G4+K5KGAcgoIsiyYmMDtN5KogkkK0N9H9pjtds3U5QvYA56pntDb2ltNhy1OJh3DrLtLEsxgqFhPAl+wCFzFqergWOddxnb1pQHFOomyt4gQO55pt41Fr_2OUemzbEWpSWH5w_tKEF7anvYsuEwEtHzwglclX+UHC_pUL3cxjZ98Qki7y0Q9AiV3O0mcxn68OgXQer9tIbqZuG+40fRYKyV296tXAFZSQzgLGhMBQoYmskcI+GNJCfHszJkiMujkxif44qMgMwOu9kFG7+E1FLPS7n2_AqaDCmAZjLfcn8H1TvPpQuFq79NDVGXrGziBLQUTUs3JsKSWK69EWljIbaGVeixvyJemHlDpyb7hLXtCbo5WJyOGXVj8AMTxtg3kzrDJNFeHpr1nV4ifwfcN+0zz+cZ9gT5oaA4_lrDbHyrvrVL7GVdVqmffQsQYRrgPVjqDV5oFFnqtFuM9rH4a7w18QwvQok2SeHyXm10SrDBufYb_Wmj6x1KL4MMo_03lJvhG0vO0Bh0GqXtnCVGeLaL4RlyVkt8xVl8H2NRWBhdz+lWMAUO6f5H2ldktLUi8GeMF4Cg6GUdGYsPpBHKi8X0xd_V5bM1F0eYsV06Qt6KxIkv0_OP6_oOM00NuummOfo8FgyCjJintPS6O8M+ndurSK75tJ86l0AAPnRyOATv3mBS5y9mcPPVjvFydTEfLvxkaJNTrbyansMcz0agUzgkPqyqICnhebgdPqTI2+_IAtMPx0Msdk9S4woh0iDh6ZM4l9Qdk+ZRWSRR6VlmALKcmObL3sMI6_RmTVo80siBlne4Sm1vNMKIrxZbGUjjxVmg3beSdTLbA_btrSil6V9Uet8Tf+Wu_0LQbosBZxD2z117N7NWJ4YHSKTGuRFO79MAC7rRevNM6CahRscxABjob8oo6nE7GL_m4bs0pBTNMQQB0hK3qzz68bxsE7iqr_quQeNmLRd5Ihhj3eoQbOleHpT8PCAEGWXHpmWxPJwj7Zods0S8FblolJhN+d44LdTH482LGTW_RtElgrPkZ8sLXgF+lV7jDigcjRZSUqxRA+NBdUkeMLiyCLc06div1_uk2Tkmj1zcuuytEU4zKRGRFS78rXbSQ3AIlFHH5V4K7RN1ovkn8uSQHdzyMyLERms5rgjj+3K4llDS5AGj0ATk2A7RbQee2i4ngn+ZQoEfBR8akgSqJ2YFCZwvOqP44VxxarDUlpu4NBn7BkT8qPOu9V3xEzCEDaTIYuQpD6IZiLutqms2H+8w6hk8gN2CpASOrazDWibZ28aHmPpn_Csc_tTqxzTGxGNR4AK6jZoRuJa9eWSlgoJ5RlQI3TcKDTBroXPVg+k2X4Ei+weAL53sMgufbjzp93dyZVFevtwg7LozY9i8LWeCD9CG+CNvzhKXFjqJnCZwhdD8q0QRQbz9q4TixRHDdvFv3fbks8UyuNKeVKkiPjd1qzqhQnXC2V6mcYB0FaM9vrcxY986dim7vO45JYFACe+hBprDV_oIcuUSS82qnQuw47IDX8wAhi5VZn4MZYLK7M9ih6cDyKE5bniexYXRPuG0QahB9NL8gTv_5g1nTEapEgyklQ1t2q6wXWNNe8S_50RYKCOagHyVWsTRBaWLxdHC4mQyb1mxWKYnFVYjAIAZ53wEP9rLKZjqDoDxOaTbmQ+UgTpc8AH7UhCadtEBEgYRxT_3cT6tld5VNNeASXaF86fr0OGdFTjk1EjxUi24CpVseL2QOZMIClytNMuiQIbnUbv8CEigwxIOHdBwJ7gC_qxHodo6iQUeHVhoHFLx08KJiSwzPnGNtFHTnBqRy0TAdSH1LHRviRnoGN9nDxXiNrKKmOCTPn9giOxgsYVDLjdoNqi4NvtbVjHG6n3274jG19jQ1hpp_XHgENWNuJuOUJHofdkeuoZwomktwZehDtHO897X2PwTTqnGSFoMMod77sObwjhbS_PcCxqdTFPOJQd08J1at_CNehuNdk25RdHRMAbD+Aqvd20xQaFJKeMacJfGYb8UrLsDeCvsz2YoQ1z8y6sjwcOLTpq48U3fJvvV563lneUWgx_t_Y2Lw43coxkxmhumQe80vemAVDY5lNKdoqDBuu9BRl0f2LP9ge1mWc_4Ln0eGGvvMbe_Qudo3LWo62FBb6fPjX8sKXnoVdWjT4BLUUFpZAqH2rG6NCBsMhBgIrLkwMnOgv1OCJBHLvBRJh1yC8Tixo4qd2G0YhXVtOl_bNRZuku8vFT3YhJQtcE5kmIhukIHBzivi16PAxFh7uSiKKX2q95AW1LDl_wsH6F+RX+fo7lZ9ae1JyPmfGy3QR_we1Bp2MKlmOvspKo5AkKqzX7_xmU0N3V8tzSLSppU6cWJYUdlMIBhrc2+My0ChBmMywhibS336Oef7R10AnoVUMY6MgRMrGuXT2zuNqoNriolypZCOKgoNWCXWv5ouW5Vxeh7Q_7oM6qsHyPB+FFMOYRQSMF4mDbSm1S04e8fb1R3aQyqVA43DuWLU3FH+equgx6bDxymUiUvNkQ1CS1O8XicfU4X1FbeFPULq1F5AxQMSQgN6n3zkDb1pLcODlk5piXUco65hg777hcUD2eg2qRIpejd4NTiMT7ViZ_HshqG_GofDmXJOrkSq6i8RhVoPvQ4we20cyIzwRSvAvqbtLgLEEp4PtdzaoYoTHf6aiRxund3QU2+z20M+o65+ywaNX4U+gCdswGRsE51V_fyTTuFFqf+Qr+3xzBcoAjMSyMvnlZKnP6q4uS3DUhLMvnXW6ZCbUVwYuFgadTR6yAcTWuPWKs31UA_bdQA_w+N8mwuoHezIT+LrWmxypOPuqXLV5girjk4M33wc5Ytk2_dw4xkfbgCuDcxGz+IH0_J0Cyb_l7hNQCqEQPhqWCrkNiM1j4aerAYCnDSdQ9cjYqq_VPw56h1fUAXVNFYxAtKy+nDuESRhCq9vrENNpuy7vWCtqui+KkGOnK27kZxWzC4KFWp9NsQKy8N14RoWxAwz8Nt8MfuDk6GCYJlmipstAvv5QrHba2H76HNF0SkJm1m3h_4Y+lK2IWtGRQkgLrSyJYv1l_qvqFsAsWErsraDn+DZKGpxeuvzeBmKrN5XdxQ66XE9ZeKCorPM_NeIAsC1kZLVu_DTvo4lyYGUeIvW5gKqjC6wvo0K0ewA5uFhtTvt0kH5cuzys_OFi5gh3gkTnbNSH2OfvWykx6neUGTL84_WLw0xCFCDbVZtnpKPBODJYhNAt+1emgQxI3YmlHkr3o0Y9xK7aKD__cFryqazs65PdV3wqTRPOPrqqmjwdv3z9o6Emlp8mkCQmgxO6g_CjDRwOmLifcEthytFbaqCwXEsRKWD12wLDHm2stWPgN71aKmdytQtG_QXGfbCV2JcyTFK9AdP5KPGfpHl9QqbJ+WAi9w80c82dthpL+qL+c+RS50MCCGALxq3UUYyKoSXWlM7tU4qVE_HaDrojt_5NPTNnbI_RZGQspRU6PtwjlJEAuESDXwn6Rerv_FrcQRbrNalEkXIYKMj551xtEE5b0sGjhEBHvEx19a+600kvPWgv7sHvwSmr_HQlOlC0_43Wai30g9rh5W1huPFUI5X1EcJQTXXZ204tUB85GEOZ9F7YH9Cc0e8+I73kCSr2cqpZiy1blsDkqv4t5rphrxX3NJehz8R8R+7ytse81ZhoMmI6Fw8yXMSL2jrDa7w2we0LY69E_Hcvs6+0xEJ6zKjdWWMcnyK7GtFFAILSeJGvrszmrWsm_I9PXlxgJ5ppwTkx953xRavPd9J9msuUGcpI1AXk64pyoVJfisaxbNqhFaJnZHNm7o3kMQKGgc6Foz2Yk7R_6JM8mAzMHsAAxrNg8SqA1xgABozvCIOVc6_YmczfVb18lq4Ckpyh8BSccxqj1_nkH5wl7DzNCifrIPgyHB0zsxFkTL8gcRUMKY2daKZ8BIRZN4eBgGCAopf+WTWwTuvTOkmKdXmQGcItkz38zXTgWDEOF8bdgAAAA'.replace(/_/g, '/'));
  const im = new Image();
  im.onload = () => {
    for (const t of [0, 1, 2, 3, 4, 5, 6, 7, 9]) {
      const tex = this.textures.createCanvas('f' + t, 280, 82), x = tex.getContext(), c = TEAMS[t].col;
      x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, 280, 82), q = d.data;
      // la chaqueta morada toma el color del equipo, conservando luces y sombras
      for (let i = 0; i < q.length; i += 4) if (q[i] > q[i + 1] * 1.2 && q[i + 2] > q[i + 1] * 1.3 && q[i + 2] > 50) { const l = (q[i] + q[i + 2]) / 300; for (let j = 0; j < 3; j++) q[i + j] = _mn(255, (40 + (c >> 16 - j * 8 & 255) * .85) * l); }
      x.putImageData(d, 0, 0); tex.refresh();
      for (let k = 0; k < 4; k++) tex.add(k + 1, 0, k * 70, 0, 70, 82);
      tex.setFilter(1);
    }
    S.rdy = 1;
  };
  im.src = 'data:image/png;base64,' + 'iVBORw0KGgoAAAANSUhEUgAAARgAAABSCAMAAAC45DsAAAADAFBMVEWRd18FAwfdrntmM3woLEeIQKf39_UREB1AJkZ4OpLRxr10X04fHDCYRrpSKmG1k3D_AP8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD5CxumAAAAEXRSTlP_____________________ACWtmWIAAAwySURBVHja7ZzteqQoEIWhUQFB9P6vds8ptNNJ1FjY82R3n+kfszPZdDW8nPqgwDbLf_41_xGr5j_PZTTmL5i91zAn8xfMgWTGv2D2JDP+Ccn8H8CAzK+BsYu3_14wgwm_A8bWl7_9aWLm3VMIkIxJvwHGr2DsO7C8HY0t44jM9Btg7Htm1G7m7D1dLoMZ3+9LvwLGNr3vAAzI_IEQcxlMfhcY38rlEEzn_0RiuAgmp5CTfwcYk5VkznXmoRjv_S+BAZSQ5ke+HXuTN7Dk1TyzPwCTM_Ryb8FovjVdJ_OYQ7od+K1PCYaMXmjQa9gDk+870pEaL43Sz4_HYzb3q5hEOw_lu3JIJqdH2OeS7_mRDWG_RLsw28CFxoTu7tRczoGEH9oCzswPs6vXCuZedWjMfl65AiY86Et3wYQS+1iSvntiDWnO+1y6e4Ixs8kht4HJwTkEzYcpN8GE4krBH5PufTkRzDzvcMl3PWmGgueUWsCUUrKLxvgQonv+9KFXD6kU18dpcgGGSMf1fR+di1OknxwoMmf40QPLgnf2bxbM+BDX1ruSw9Cn3jlnHsn7GDbNIHUrA4UrLgLDhD8AKPbTFCGdqce_J6B6HAf3EOaZzgwD+EWsyWPYCrt7oRcDyYydj6TOSmWKcZKBp3k2kAwmJgJMSZdaAHhyNATBxMgZ0jBfE3_Yh0RfMfOB0kDGe+eI0QFTlSup5EYuEdEuTuCSYA4z04PBWCKnURCkZq5ZJBnY0_XMQkVM9XFI_VScWMY_JOwEC+z7nYMQXEF8S_gvAMaYkKNm8TAp7Zq4wKUjPhZ6mcEm73I5BYPRY_xwboeklkzCWkeJnEiemjML+OAmmOCAIsKNMK5Q5D9+cVKi7CXkHr8BMFhWLIubCvJACCw1PQJv81aAZoyh1QR7Vr8lQBCAeAGmLzRDK058yQeVK4XsJvrPxPiyAcGccrV2QpR+htAMuY4jIlOfoVmfU_G1gmkreemcwwAXMsZNMQQ9GCytQ4SC9F1iDAiwInMpQdMxc8G7ns7DaCWbnnCtTVB65i3gTFDogFn0IDyFXHJ3g8sSy4ie32CYJClAPZgsJZnHgKRiNYHTEzD48fXoDxMFPj0x5Jas6JDiLY7JDJKZ0zCGKVpYCiGvW4E2MDGAC8jAoaBHjEgPJhQscu8Rv5nWEHIR_ZgyMyepSEkCBsGTwcVnf7mrhDQYWRA6+LEZhxJd9hlLfE8w6BOgFzoWRj0JfK4BDAMDRtI7LNk4hN4zUQXiUXi0KzYzhkJ_jJ05KWrl3uXimMzTOMKNA93YrwVMW+TNCWqZR6kXJ+bcA_Wb87wGIQdGPJZZJjhKmVllcppQh7giBR5COZJvyYrdFWJtoB8ngBmxQEVaU1LxtnEJeaReuLYUi5NypKjBRO5tIrOJRxxHvcHIx8LMKRwpeOtDrXxBKbqkKH+mCYHOoBmEyYzwZaxuviEY5AEKZhgZXrBQheU3fEALJpSuiIGQ4ZeQ3+KRpcQ3rwsGlYqVFM2KDpTdcP29WIGABfV5ZrgcU6Y5qXlbuGCBs2XknR0LcJQOQC_TU3fwSmCd2peM8DfOZWKmClHBRcCwMQkyhT49RXMdDF94hwvFcD6jVO_ISblJMCRgg2TqyIITmcBC_viMBjCsdWOxAX45zKF2IVjIK3w6UDLQDEMVk1pSVKjYSkx05z4Jl3FGWlrB6Os6pDhLwYxjrLtZR8yyO1CDEQho5FDJg8nTWt04XbijZLA5l83RVBS7rMC4hMYf+h7EMlQuohdtrp5Yv2c_M8AkxwKJ2xGC4Qz1zfC6m6klUfBr9Hb6VGC9E6dAFTsoFpn7V+4hehzDjtBLfQGzVZ5YsJhD7gAXaD_1sjlhsbkEiifqwcADPFIKHWlOvr2Hh1CDQo0V86gAgyxER8wCxox0oSeYqPp89HMQam3NbowvKKj8s4Wwl2TNjz16VljMScPgXTMYjwiDQIoSbRxVODMrF9ejVYyFoROJH3G_pSEzo9FG6YMqGgUCZmuiB1YfRQ8GNXiPThGVbLy2XfsiPLYaYunhlJquaC0GUeghLRq7Bpj1BC72Ci5yWJhrayuzpPoIuNwz6cHAjfoea9Sx_2Hz1NgGh4czyKFpZoz+9ilmYv3c2ZqRCAbL7_10_ZLemlDXEMVqFy76MUWndiWPrd8EIDVHorJv6pdJd1damJa29H4IMAgrfgu9+BvKIuuuSsaEtJ4qeDZyPNooKBpf1m0v_P5Q+WI+YRtR19nQgCXWriaywjo3veKik9PCNVVbW7CBcstlx0615yJN4goGdYN_KXAmV5SNKsynYEDdSsbnXp2NpKHSb1hYzuvBTME+ybBYdHWm_WUwae0SdzILlpn9UzIsyFUxRvbDlcuaJyHFqOzGR4aWWDt3qwn9mWqBN0tkYacXioEf1aJNZQVSkZl0Xs5tnlUd+_KaGBO4G6Af1fbH6t+6Sgad78ijk5hlWrVTq_cl6F4uLnl5u32C0UXwTupvulKo7eewNZb7ve21OfEBchEweRNNp1tttozZ7lj9oJNFU5PBVhhFJou6FQyieQuYztu1x1Ubd2ELGLvba3PIBe+mgkUxdADxqU7nSdxRk4tfF0sMZWWYQcmMNOQrGM6uhCYuSB4VjGUThpuNZ2f58pYAQpN8xNb11mGtf9PMqZcOOL2Rm6XVkOX8VGRQM6PWgFQ2MC1XEWXsG5hQ23drpNI0qkqoXHJ17DqeXE+LNQfWU43eQVxyBSMGvaqPAjDc26wtqqYm+HNNZAhyNOwkVPF2yvXWZsdEwh7KE4fU4UoycmKCQ6Qggll7tasVRcMAcPMrmEYuVP0m2upLIpk0A81lMExoXGj_IRi7pgUFGDacC3v9H4LpnsFGIRiescUKhhuTpc2T8rYoBFTBOL_wuoO_fErQS2jAjFa_XsHUxHJ9TrzsIcUvfHgVTGetlgzDd2Zbfq0PW8F8qBWTkbyEzfu8eyXpDIyoq2ympBD32ijTv1z1eXFJKfSuO1MUV4pk2w7m1ZUIxtWEnbDxPriXYw7G4p73i8WUxJiNTHcZTP9xk_U5ps09s0YxH4Npu2xcj6I2MH55JmyeyWvA9MsrmCz3PstaBV8e26q7T2CWrQJW4N3MqPPZF8G8gKk3lgpjr1GcXX_MqJKwtb5_ppbrvvTFkzphtGXu6yH8PWDs8gTDXEe3SMmobjtsQ7EvM+DPdFNa4lcwud6DXs1cl8zda72fwIgJuZNycF3pBExcvoGpnUTvs3ZjsLrSqxMqE9PGt2sGk7cC6Glimn44f78Cpvs0w9w1kPGfA6fXtWb6_qWsb83Wchb1FF0f452nT74v7Lr514P5bKnuvC6v_vSMMc3ZWnrFCm805w6Qv4Y7mZFaz988sMlM00d_uJLdOheXdlvmx3XO33+mntHavLhrRnpDTXWM316rdu6BkcT6dfQyOKsdVW24fjXToJjWp01sParz69G3vwPGCmL7bZKUpdKNvg_GN4QqfwMMqcohZoXzMxlzus7f2Xp1VvK53lW2X59l1Ce3evqxtJ4S523Lly88g2BOV_q75rx2RvX05RuXJjD1PngrmLrOmzvZt4PJajB82Z0Q3gSm_XETW8ngDqnPNxRz5Io1jqqC3p7+5YyoAcydJ_3WKLNUQLYZzD7XmvJUeXIvLtSdpB7MrQe3NiLVmW4oZm8UXnWKclzhtoK59SzxGmRI6CcyJ2D245y3CleqDXR_uK1sOTRb7pPZtNMKZv+dcp_0sl4OqxXLINNQ2d8EI1Emmf3McgWMPdSaV4E5_l2FndfnZm9+jYMoBo+F2Z8K4GMwR4vjL5+x2tPzWO9bwOSbXzCBj7X4uhnYonRO7taa41H7k57TlSGkfHpPyFp1kJFacbn7RQq4TJ2qnO04z2owWO6je5zXRhfmZM9CPzWpVQxDw3L7e_OGoVK23XB8h9SceMEhs0tRM5kxnM2j4d5D8_PEe2AWn86ukJrDr+s6WmzvL95YNz98QZ3sUhfdw2ndG8AMKxgSUoNJ49wdp5owXrmTygcjhvOcpfwuSD5pYd6gmPHDnBJMOoGJZ4tPLX4awRlASvkc3ZeXPOoxv0Ex66SN3pXMCRg8Az0Ml2bEe_snAE21M15kw+dGhnd8R+3GdjzFbI7i0_Fwx8tkzn_rSXi46EYqeV2zePx__wH9SvIVvHZN7wAAAABJRU5ErkJggg=='.replace(/_/g, '/');
  S.ov = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff).setDepth(30).setAlpha(0);
  go('title');
  load();
}

function go(s, arg) {
  clr();
  S.scr = s; S.st = 0; S.flat = s !== 'vs' && s !== 'fight';
  S.bg.clear(); S.g.clear(); S.h.clear(); S.fx.clear(); if (S.bgi) S.bgi.setVisible(false);
  ({ title: initTitle, sel: initSel, vs: initVs, fight: initFight, res: initRes, over: initOver, end: initEnd, story: initStory, cho: initCho })[s](arg);
}

function update(time, delta) {
  const dt = _mn(delta / 1000, .05);
  S.T += dt; S.st += dt; S.dt = dt; S.spn = 0;
  ({ title: updTitle, sel: updSel, vs: updVs, fight: updFight, res: updRes, over: updOver, end: updEnd, story: updStory, cho: updCho })[S.scr](dt);
  for (let i = S.spn; i < S.spr.length; i++) S.spr[i].setVisible(false);
  music();
  if (S.fl > 0) { S.fl -= dt; S.ov.setAlpha(_mx(0, _mn(1, S.fl * 2.5))); } else S.ov.setAlpha(0);
  S.c.p = Object.create(null);
}

// ---------- Luchadores ----------
function mkF(i, t, look, name, cpu) {
  const f = { i, t,  name, cpu, wins: 0, m: 0, anim: _mr() * 9 };
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

// Luchadores ilustrados: una hoja con 4 poses (guardia, golpe, patada, golpeado) recoloreada por equipo
function drawF(g, f, X, Y, sc = 1) {
  if (f.t === 8) return drawClock(g, f, X, Y, sc);
  const ps = pose(f), fc = f.face, a = f.anim;
  if (!f.ko) { const k = _mx(.3, 1 - (GR - f.y) / 300); g.fillStyle(0x000000, .35 * k); g.fillEllipse(X, Y + (GR - f.y) + 2, 90 * sc * k, 14 * sc * k); }
  heroMark(g, f, X, Y, sc);
  if (f.sh > 0) { g.lineStyle(3, 0x2ecc71, .7); g.strokeCircle(X, Y - 90 * sc, 100 * sc); }
  if (f.ctr > 0) { g.lineStyle(4, 0x75aadb, .5 + _ms(S.T * 20) * .3); g.strokeRect(X - 45 * sc, Y - 195 * sc, 90 * sc, 195 * sc); }
  if (f.buff > 0) { g.fillStyle(0xff7b29, .18 + _ms(S.T * 15) * .08); g.fillCircle(X, Y - 90 * sc, 95 * sc); }
  if (S.rdy) {
    let o = S.spr[S.spn++];
    if (!o) S.spr.push(o = S.sc.add.image(0, 0, 'f0').setOrigin(.5, 1).setDepth(6));
    const k = sc * 2.6;
    o.setTexture('f' + f.t, ps === 'punch' || ps === 'cast' ? 2 : ps === 'kick' ? 3 : ps === 'hurt' || f.ko ? 4 : 1)
      .setPosition(X, Y + 2 - (ps === 'win' ? _ma(_ms(a * 6)) * 12 : 0))
      .setScale(k, k * (ps === 'crouch' ? .68 : ps === 'idle' ? 1 + _ms(a * 4) * .012 : 1))
      .setFlipX(fc < 0).setVisible(true).setAlpha(_mx(0, 1 - _mx(0, f.mx - .25) * 1.3))
      .setAngle(fc * (f.ko ? -78 : ps === 'block' || ps === 'wind' ? -6 : ps === 'walk' ? _ms(a * 12) * 2 : ps === 'jump' ? -8 : 0));
    f.fl > 0 ? o.setTintFill(0xffffff) : f.mx > 0 ? o.setTint(0x00ff66) : o.clearTint();
  }
  if (f.stun > 0) for (let k = 0; k < 3; k++) { g.fillStyle(0xffe066); g.fillRect(X + _mc(S.T * 6 + k * 2.1) * 22 * sc - 3, Y - 215 * sc + _ms(S.T * 6 + k * 2.1) * 6, 6, 6); }
  if (f.inv > 0) { g.fillStyle(0xc39bd3); g.fillRect(X - 3, Y - 230 * sc + _ms(S.T * 8) * 4, 6, 10); }
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

// Trama de manga impreso: puntos que se agrandan hacia arriba del cielo
function trama(g) { g.fillStyle(0, .1); for (let y = 0; y < GR; y += 8) for (let x = (y & 8) / 2; x < W; x += 8) g.fillCircle(x, y, 2.4 * (1 - y / GR)); }
// Fondo ilustrado (una sola imagen); cada sede lo tiñe con su color y lo voltea para variar
const TN = [0xffffff, 0x8fa4ff, 0xfff0c0, 0xffc8a8, 0xb8ffd0, 0xffe890, 0xe8ff80, 0xff6a6a, 0xffd0a0];
function drawStage(g, id) { if (S.bgi) S.bgi.setVisible(true).setTint(TN[id]).setFlipX(id & 1); }
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
  S.F.forEach((f, i) => { f.anim += dt; drawF(S.g, f, 200 + i * 400, 500, 1.5); });
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
  let g = S.g; g.clear(); S.fx.clear();
  stageFx(g, S.stage);
  for (const w of S.walls) { g.fillStyle(0x6d4c2f); g.fillRect(w.x - 14, GR - 105, 6, 105); g.fillRect(w.x + 8, GR - 105, 6, 105); g.fillStyle(0x8d6e4f); for (let y = GR - 98; y < GR; y += 20) g.fillRect(w.x - 14, y, 28, 7); }
  for (const f of S.F) { g.fillStyle(0xfff6d0, .14); g.fillEllipse(f.x, GR + 4, 190, 30); } // círculo de luz bajo cada luchador
  // viñeta de manga: en golpes fuertes y KO el fondo se vuelve papel con líneas de velocidad hacia el impacto
  if (S.sl > 0) {
    g.fillStyle(0xfdf8ec, _mn(1, S.sl * 4)); g.fillRect(0, 0, W, H);
    g.fillStyle(0x111111); for (let k = 0; k < 44; k++) { const a = k * .1428 + S.T, r = 70 + (k * 37) % 50; g.fillTriangle(S.slx + _mc(a) * r, S.sly + _ms(a) * r, S.slx + _mc(a - .03) * 900, S.sly + _ms(a - .03) * 900, S.slx + _mc(a + .03) * 900, S.sly + _ms(a + .03) * 900); }
  }
  drawF(g, b, b.x, b.y, 1.15); drawF(g, a, a.x, a.y, 1.15); g = S.fx; codeRain(g, a); codeRain(g, b);
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
