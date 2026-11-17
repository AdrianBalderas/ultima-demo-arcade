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
  S.bgi = this.add.image(0, 0, 'b0').setOrigin(0).setDepth(-1).setVisible(false);
  this.textures.addBase64('b0', 'data:image/webp;base64,' + 'UklGRugFAABXRUJQVlA4INwFAACwIACdASqQAE0APz2EtFSvqKSjMze9wfAniWwAsR+rE9uDNuPvNKHuJudservCdZZcaVxUN3xZlG63s+SgJsu28agPvropERtjD27Hz+fVWafh5YgUUqAxzLEJYIs+EsSNKtieXaCZ9mJXr3WicTZYAbz4NIQsHnJpMK0OSVUcxSZAXOxtY3fpDKWtnG3jROtpiRv0_1qiVuViVP1PUMP2U6Me4W7cX9IYvKL8siL2i8q0D4e9BvlGLSvxtpPOZyuc4rb1xrQwGrTLbMuihdj_Qcih2ZJtvtkAw8hhH8gpNGS6X9VEXRGrwgsnCqlsAbOokaC0GjCUgB9pj3MT8WndCKIm43TpEIWpb15JvQAAYLsJsGqKa0udin1XM28f916MXei_O5XCgPDkDzmN_uuXkAFEsUqCZcAliCXK4x19_jtyTs3SausSJtXcGPQBHt+88GML2s7nWr0ihGXuTVAMjQ0e1IzANtYcvlH38_11hVeLyoHNIRTblk0LE6lIvzVK44zr+LPzH6D43qVLoykWRuK0p8yjSdS3s4I2_cc7Ck54RmOx+bXFNESOZnsc_IWQvxYR65vrvi4eSCJS8kPw33ycDmTNeZGGgSTTVHp1_zB316npX8UkvsfM5xqQFP8vx_m4vIWb11KKcDJhaBrbbzbOXgOoFav58fHVvDWpz5Exl_mItHdPFqlClTLjfZZxpKhze9FhtoLXjS9KkoPA6yIMPA3ojqxWt3xLVKQMRtVcJ3Pb_YYpbv6_5FWj0rKuFw7zEiEC+o9ZV8nbKWLH+No3FbemtEuOCfhkPGLNABXr8RM3F6qAsl0FVb7IY0A0HlMBcM8gRk21QiMCm7Sll01NA6K4zHTvULxJMYe2Ucbf7KbZeTwkd3pJV6xHWuHEUKPsXucGCiAikFcgMB2SmFYMFi__ZTyrFBdOwNugmcJqKB_jIuECq7GacErAtd8LMlwIuOJorTJum2tlFKtgg88DC8YvTNRrxoqz6FT_rn7mAXAkxC5ekf5bTSYbiO65FuWTmpru0GMqckR0pxYc1tz42M0w+k3KTbMnncV7hwg5oP8mZxmm0ZJpIvczuRhWzXuaRr27iDb+WcDS9fN7UhBOD8x1mtNLZ0YaGzZer_yHrqJpxvNZryuUb3qmUjxcXE2UFQ_bb8Zdd4wsl3kOjRz+8zLc+g1YwlT5+wiBL7TeBLF9MZzmw9lKOmZbrzX98d6CPRFP5eHprdGUhGMgHLQ_hicH6eZHe1UX5rQ+rY0C2dXEQKc3jkNJpXqWQtgHwIKAfvSF+ecFM6+oU6tQoUX7QamRwisqEKy5DjWX2q75SmkSSz_BonSKkgCgsJDJa7ZxaRlAiY8b9oib3F5Sv2NWpF3cooQBwqQVXnKH7W9lFo0JnE3eaa2Om_OK5sW7FxtIhnSzOxpalwU8ELYj656JdDARqXuf5Z4PRMVrNoQXqzqAZP2HZ0FYIOUvCEDJp+dTQyY7JGQ7nz2bKS5iafjIsXv4fg1qbVfvYvfy8nddzdnBKbgPBUkqv4ALQPJtOWAuj6Og8nu9DSAfe2lpVFuetdWqgu1HFgyVl5Qwa+SybFByGQgfKNKodsxe6I3AhF1CZdRmAhKAZ5ofB+T20jYlqhvfDjS1EBGjw1MiXOqsc1Akif5o01YRRYrSvzdLnwS+kL5DJzoAqfTxewWGpXGeaHhL3hk1wSeFXaEtC6aLBsUQghmdGrxTcisMyoOv4E3+5GKBEYFQTjeKD9h30fuyl++vhpST_qSwDAQdvTk71pB+A0MZfOs6m76atwEdc7fEcx3UjeY7CitFu2UOEgruEfIFSXjQzvWJBJL04tRAdhNR2LYVL0h9P+1mck1ZRd3_uI+SLnmHDVOWMvNgu4Y0ysyOBykO2_LFdFeRXxnAB958GSZM9DqVKnayEZm5cblprzHq4fgtWChOIibR6n8p_zs43U0CR7PRtWtrwCgR+HOsUxK3DMS56ZWkC5FAmfQBKufgelgAAAA='.replace(/_/g, '/'));
  this.textures.addBase64('b1', 'data:image/webp;base64,' + 'UklGRp4HAABXRUJQVlA4IJIHAADQJQCdASqQAE0APyl0rlcuJqQjvd29UcAlCWwArk8ALMdXPqvNZ5Z7St33RT4Po_27HmW85_zm99L9ADpmsSfkxNlPnDTS+ZPp+3GjjiuIPVOr9ZfTr8tRk0pIzyGIFHWvRgdZ2wiev_7YoaV_10fsJ22Ke6jMpE0yKzZjfhiAqR_xDHagQHv9H31YyX2kVteAwfuLqD6dLo7UkYJPBDaFEZ_l1FP8GROUOwXwdHVdyyodTbWOIvG0752oxVHMakdHNjiJKGiCVJnRXGhoNnTO+v5efuFSW1YOexYfdQfm3Re368J16hdQGxp6yNR38FsNSsFyBTJ3YsKqHZHavuvkuFRSUCM6y95H5I+xTtqM536+uvv1vPn6PLaQ152OC6tS5yUoJjdk+6XGXPyK4aPU+XZzEBGrIAD+RF+AeG8DoSBsPhjUsTuf5zTL4pHez_e760mC4yS268dNjNipjy4wOfkz3aZ09E5bFUEAmMKJvdw6hKCgigHPi+LwJXnIooeTmN5xORRDxIZUcPD4EbbE2ZS84oInFXatyLOtHWEL0iCh8e6hFncBJyf7vYTclzTN3B5zsYYBjAhuLdmYZGE7KfZjfcz0XBMMYmUw+Go7ANFXcXrn9X1p_phCSDdJe0LIdSE4apNhNZEuELz3r3T18mg07SOReCqng_RYsdB6I34SFqFyxLdj2t_mwYt4iijfagepQ7KqFKLjyml3yPwVh6F6SKOK9jAtdLgMpDkD2h0I2Ni1OOBRfCI39HiRVt+r5TUV4ADmNc0z8gINQM89rUpuJWutLGoA1fgvYvKE0sNjq5o4MMExAEVEwJsqc6nwanqt2RPD54m1kg+Uwsto_yw722BAYDmSxPNK_Zd1Bg3UNKZ92gXYgSjMnSKh9kHJ1sU9UfwgQ47GLlTir6Qa30TxXBFlbiE+slPC6i5jmDzbvG36n5n8DglolqAt4FfC25wpa3ulO0hji2vPYen8t2_JpMyX_RcyopOiswYQLH4KiSCEjWxl856nuyKtN6lq7qbGVpgoYaqLSLSb7ckRtAuXU0dl_0tsN_ZbT7dcm7d+hLl2DjRMkZtCMLA9ngX9caUn4WG_Xadj4A8GVJ0qTlP1F6LD1v2aQ2hYySTWehXGxuNHMvlWORQklzFLSkv4G3RFNPwV+qfngck1q0jrCtYVIiHLR1k6fCRNO15+HahlADTM8EkfFrR1o3mqGq2oYf84F0DnzB+snY2nOFXXQrKJNZOOWvO1X054a0CL1dozLRQgkzUNap34cGIw1mMDZB1B1Am4JImdQN0O7svnkfaM_Z9X0hIKu15ZrTjiDz1L3YU08ZciG4VC+3cmcc+t4oMVQuNqNGwEiT7k13FSJiIzke4zyYXObGRkOe7FQYU4KFcbwoPJvvWwiKmRiNW5IlNa28FBQyp2bMX3Qzp5yn_T71XjsU5_l+2jGYknBdRSxTcxbZnNgw2vRuo9Ly2EIiQyfjJZf_qpA8xTU8WyM9GEW9o0IS6Qwngzx7gRR7tK5k+WMYSyIP0zmWcXUOynThOVw8agoHsxnksleALwXhWR3qlvIoLJRFHdFy10zWqgEGMrrdTBML1BLZ8uetm2vVBBApzBRlchNn3qUS8ZKl7pKgRILsPjLWhDFSCL+8tyXy39k9YGiH5Q70HxI2K5LSl39MWFkvmWFkVsI2Y9NEw+NRwFvbWHHHaYovAmmSTfNaqtITcuDIEDQyWVv0NUxNhDXCMbCC_wSTUZuPw0nW6PEBvCzIsGCTRHgvdJqlbS9D5r364IcOmvYp7lWi7lHSAjZN6T3qQzR5S09ULTSMntzKncArGSqCMxZ6NjVJRREOTCxkRpeXzFVJ48nOW0yLbHa0HFYkXDPZKv6v_lFve7aMUWGhi3E9L+vR9KrvH7xsJZRzSirY5w5E8kJl+x_xz9RDlyMDP1FeIUnwbaDjWLZacY0BSL_mqHWmol3lbcQvhGFBqpVaS90_DTP7lT0AfxjKfUfSekLXiKZEBTMw8mla8mzu2x9jKae2zQVdiiW1M+0SWwoTg7eulGsNKyjiDpq8OslSrlp8yaHqQ82I04+x45wNecHIhH4YOrkHF+j29qwUuO9Im0p1Dg72YJGKXVDlCnGN_jJyl9wvIuywudzBMPthmIv7PSmVFzLwox0yi19K653YbiwrzXgaht2yhUAQzoFB2XWyuC3cW+fYggDr7GpYux5DcjZYZZjNhU5bTwIskv1yqiEIYVIXKxUyNv0Ng73P4UNEWHI+9hhAy+kL5Yl2Po1U8O86TKMTOjYyf7oXNH64UucXM5Gx+KEU4quf36N1fO5KHqjyE5OnfH4a8Mu6yPRJznKtZ8UlJlkNj7jRTOeJ3kER61y5PJ0uyYx90xnz8ANDYC6KBqrL8408emzLUnZavixPzzBX4I4RHjIwHCNvU1qpmOtkeKQm9RZjxBJ7RaTsvm_FUYHgXrTtog9d+I5orWy5p21r_4t40WHn46HgsUgwFCdFdkaokih6V+CWJ3mONTzcMRgN3HHsCVubTWIcPtCEIUIrA2h7XDsjAeppzmRoODNU3s23iI9SX1N84jLt2stu4AAAA='.replace(/_/g, '/'));
  this.textures.addBase64('b2', 'data:image/webp;base64,' + 'UklGRiAFAABXRUJQVlA4IBQFAACQHACdASqQAE0APy2CslSuqSSjNraOwdAliWwAuzPkE2DDrS89w9meGwwPZvCr66rVWXhDU3ysqTSSGyhoNLmqUlec0Yo7YPEVjVPT317sG58fO3lZos1SnCvkHSmqGoBsnd78PKDmh_PQp6lBiiZajFhgi6MZ+rUYImfNzrE6RGILq_m9EtE4yeB_wRm5XAu5BMlc1jHkdrcLYJOTDslkgDBGxMU5zvDIrrd33ehF5H3wfB4IARCGMEXQJ1ZDs1f+_QAEhXftsKATTBu0NSAUfrMHIyovhD8JpuppGezX7Ygzis4FqVZlFHCFAAAA_MMQ9eIP9Da33WeOYelBUXd_kl02dR8QWoS4+513G6G9CnZjEp7Jj3URjTs1_EHUeskuFDUmHoeN3s1K9jnYkSro0jtlgg2IO3e6Qmk28NHiIzQ4J7eCWRCSSpFONtY43jIpmnIuuwSoZK0ylLgcfdrEE74tT812JDUiuKRsVmldsVWM94dQnhDkrsQkWJHlP0nu0uSvLfH+mWyuFWTXzNOxDG1QkFfK8e+nkSrT9RiEN0YMrgVMK1LM2mm0azV_W86CWPCfhzj1EmjQwzNBmkwynUwfJWIUlj0NQ2Zcg7FGnSbHuI5hukqUuLBQEjrYHteG_0jzXuHaUKhGoFfVxr_DRZwYKzKpDoRxlgYXSm3OVAUiPKa4dEcUmPgbasW8OveOQLqfEfdvwohg09VCetQdCHVG0G85sOZkE4glitvtcIpRQ_tNJJEaZJmCCg26cgBgk3OBOemWm_pYpi6nqlIeXf7CqERm5gt+AMhzOqB5WmJedsmEa62QyRqCA7IdLq8ggSDFBSu4cJlir2KjZzbrEZulxKIOaQdAeIAwhQuggqK5PR0u+M3h4nDYVf_bZDV0wnX2hcyOkbLGUc2DBzztPnVTaKq2h8fvNL1M__L0WTAaKF4OkAmtPw6RYh6Ggl_Yw6YvhtqqipRVldUzADZZIXI3zDU10qQAPaQcPYroUr2WUOj+uEHSXg98NiZqprfkeznERIHtzyJfNLdfvuCDuDDRGPPKg6B92itvFG7KlET5MLAI8TzbYJ5gDj0KOxAdK3cUcvW_WdTReLS6qgQDTXQ8zHFBe_Os2WCs2n39f0CTPZ5MstZxId2QJ+duDypRVdboy__pY3tRMfwGDeJ+0f0NPSPYiJmB5gmRQUe_fJvib6HkzWYn9dVZkz7linUwED_D1IvZKyXvFlt20_VBrGLeUbky8YSJI4rqwGU5HQ3D13rmZzsH_7v9MDdk0PdWIYiVY58id1NBq3T2yI9yjLk3OfVIYb2BcO41unj_qu_b3lrK4vklwf3XYeZ6LucD1ejSOfjVVNxVXagvR39ToLHBuqq3aV0kFfTKu1vce9DnBJzLNHTYO3wEZ1qAM8B4R77nVLXl_Pzl8YNLb5TUEjdVwOrfLS1ixypnXt32UYHqr2fP_7cQUFMgricZ_GoS5K_JJA4MLnJFX2T7P1IYu18BfQfFQdmQA2hQOKb86hHcU9Iv4SYVrLveWZyCNQGkS+lAMucLIaBoUMPp0SWpHdxdtZnpgF4AacKBeLnsdu7hqbZK9vm3N8rKq9vPCPCtdg7JAwYT8NkVLrIxHX+MDo++rX855br0qiLYMYitBQHQlfvm2_KE7A_BkgkRDGNbHlTACyD151JRHbZb93oS0JNjjQfrWiLb9HY6RZ906XtxzlwsS8NxXCNmjJbjquVMAAAA'.replace(/_/g, '/'));
  this.textures.addBase64('b3', 'data:image/webp;base64,' + 'UklGRo4FAABXRUJQVlA4IIIFAADwHgCdASqQAE0APzF6slSupySjNhjO2dAmCWxdgFgZ9Gt2VRoOCv6TdxBz4DlAUtFQ41EcTSGqmjYf7soPanK0itkvoxP1m7EUC4MTEOHkdDdZgTRI8Tzf0QflpRhaUXEME2rhevOPz5s7+pQ6Wtp65aYZs94g96JbvsOEFQpccZRVzIuhahwf90dBfaKUr72mphMVRwduSDx+XKGRfXTxRLNfJb7R4GtEg8Zs1A179K+Bvl4vV+snkfE54qYy6nQLk6MV0iCyGWSb71sjcI8zr487zdlZgqvgd2p_BJ2Gb5LBA3e32ln0lmsazeD6gk3OSZKpfCEIpXxoJ_QzyXdAAP7vp5kMbGyXdwsLuhgpeGhhDz4KDt0eCpkLYW9egg7nQHWdDCy_cLWiga4bVLwVqhgWPjZomvBv3vlaYTwEddgoygllnsSeY0iozSgswbIO512Rk00WeWP0e1KHsWgiUYto0YSk3qKKcofWf6wHKHGVSgKwoiCTntybA7GsHg1IEpockNpBuzn58eBAGn0iTXuQCh7BIvgtV3okY8yUymjqQFzOwPZSDq211NgyZRDpQoqx_TmfYP_yZByRSEmV7xdfTgHqO+sfHLl+h+Cgrqr22E3cVO3RmFcMlhzembraN52ynq7N1YUXc77F9dmjnQ+FZephAWv6RiuHXWJu9+zuV4bXjNZWg7J9v0m0Nz1fcaB5HT3oLFFc2bLoKn3D1CgzQcYLtXE_AfqKHBOJQTZdWaBOx_5P1Sxzu1PqZIF+BNd4HFmSB5eeS2nO3hxYrJIydsRNc_cJblzj9ODqhKflvfv0_BvdIA3Uu4DYDWw8Bu9QxfxLcY8tjDLJ5DAm34SZv4KxZ_QUK1hK1jfHQmQv7K7a69Xr6+Lpr+Fj3Y+SmbY+5ra7RYECXYfyKE6a5F61XRAjCClVqIWraKBXRBLAtE2avuLhSq0w3lprnTxrzoG+TqTF6rwBkvYrYXbLn0zOBWEyZ7swWqL3fizETo4KXhyyiD8vtsFtIXTMD2Muy0TRtHDuLGx54oa+qufvYpAcuQTQSeIhJMM2an6B38THG54Ps2yiyRWcxwDl8HaRrb6Cqph0KwnGbtxLxCbXA9ui7be2U02MZthDPKx9kGckjwuUmx3XqVzWlOOb5EUOyMF8sF2_GsOnXbfThiDMlEh82Fg1jRP1yBUhhXdB7pWUyDGlOLOMg5fHRqhrBD8PSYawpwFRKrUgIaMY2a6zbpOMTxjG5Ngs+OvAnQft8VGgHyZSFhqqpfN_q6rd5HlCjHIXMKC8VsZ0OVma6zvV99zoimpMw+CjHHyl+M3x5oEIt6WUH8tGGc3lzX0gPMLJDiXlMgXUR5Ax4+tttrxFcSeFpdptqU7PFxO0CxRkfEHeoKsKWHAI3q1YXxyEHXdFlq6vYzdXZNH_zt7wYEM6ez+msgEbmexGHSS4i08DS_RmrpLZT3WzqonZvLh34rHzw6olz8z8JSv1EyO8kGe4xTMkKc99MJH4sZWjIoPxFhBKBdbviR_1nUWRbzL_T18VuM3KKpwE+fso5MxCrxxkw6mTVlHzK3cVZ9_88c0eak+KLolOXGQqbaAG49gCPyZFTVZ0VSeC_2Wj_jJGtFA_eU+G_d8ckC5qYLFARa_CtCGP2dg1ObhPDqI9a5b_5eAznJqQhaAFLRTz9YGLDij4kcMVEeq7Vngjcpg7VVGsFkjqwjEMQokcF8kixIpvh0fFlH4TiO8c8mfP5EBPuCMHAIEUOTx4E8ulgtwzlCR4iKMEK6p1EK71U4gjT9BwPGZCQSFDF57oxlA2Y_k5U7a3CX8OG5RKUNLEpFX3PqVOacTJWFPoYWLfh8Pype0ldLAXYLYVZx42Akvqp9XHgND0AAA='.replace(/_/g, '/'));
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
  S.bg.clear(); S.g.clear(); S.h.clear(); S.fx.clear(); S.bgi.setVisible(false);
  ({ title: initTitle, sel: initSel, vs: initVs, fight: initFight, res: initRes, over: initOver, end: initEnd, story: initStory })[s](arg);
}

function update(time, delta) {
  const dt = _mn(delta / 1000, .05);
  S.T += dt; S.st += dt; S.dt = dt; S.spn = 0;
  ({ title: updTitle, sel: updSel, vs: updVs, fight: updFight, res: updRes, over: updOver, end: updEnd, story: updStory })[S.scr](dt);
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
  if (k < 2) f.cd[k] = (k ? 4.5 : 2.2) * (f.cdm || 1); else { f.m = 0; hype(150); }
  if (isTeam(f.t)) chat(0, f.name + ' USA ' + TEAMS[f.t].p[k] + ', DE SU PROYECTO ' + TEAMS[f.t].c);
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

function drawF(g, f, X, Y, sc = 1) {
  if (f.t === 8) return drawClock(g, f, X, Y, sc);
  const ps = pose(f), fc = f.face, a = f.anim;
  if (!f.ko) { const k = _mx(.3, 1 - (GR - f.y) / 300); g.fillStyle(0x000000, .35 * k); g.fillEllipse(X, Y + (GR - f.y) + 2, 90 * sc * k, 14 * sc * k); }
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

// Fondos ilustrados por sede: 0 Santiago, 1 Buenos Aires, 2 CDMX, 3 El Deadline.
// Las sedes sin fondo propio reusan el más parecido con otro tinte; el piso se dibuja con código.
const BI = [0, 0, 1, 2, 0, 2, 3, 3, 2], TN = [0xffffff, 0x8fa4ff, 0xffffff, 0xffffff, 0xb8ffd0, 0xfff0a0, 0xe8ff60, 0xffffff, 0xffc090];
const FC = [0x6b7486, 0x5c6478, 0xb9bec8, 0x8a6f6a, 0x55705e, 0x9a8a6a, 0x3a3a24, 0x2a0a12, 0x8a6a5a];
function drawStage(g, id) {
  S.bgi.setTexture('b' + BI[id]).setDisplaySize(W, 432).setVisible(true).setTint(TN[id]);
  g.fillStyle(FC[id]); g.fillRect(0, 432, W, H - 432); g.fillStyle(0, .25); g.fillRect(0, 432, W, 10);
  g.lineStyle(2, 0, .25); for (let k = -12; k <= 12; k++) g.lineBetween(400 + k * 34, 432, 400 + k * 110, H);
  g.fillStyle(0xffffff, .25); g.fillRect(0, 432, W, 2);
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
  if (id % 8 < 6) { if (!(S.pkt > 0)) { g.fillStyle(0xf2ff00, .18 + _ms(S.T * 6) * .1); g.fillCircle(640, GR - 30, 44); g.fillStyle(0xffffff, .8); g.fillCircle(640, GR - 30, 9 + _ms(S.T * 9) * 3); } nacho(g, 745, GR - 4, 2.4, fl, -1); } else nacho(g, 750, GR - 4, 2.4, fl);
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
      S.li = 0; go('story');
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
function quote(f) {
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
// ---------- Pantalla: VS ----------
function initVs() {
  drawStage(S.bg, S.stage);
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
  if (JP && S.F[1].t > 6 && S.F[1].t < 9) for (const [x, y] of [[640, 220], [700, 330], [610, 420]]) tx(x, y, 'ゴゴゴ', 30, '#9b59d0').setAngle(-12);
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
  drawStage(S.bg, S.stage);
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
  // cintillo de TV: quién es cada campeón y con qué ganó su sede
  if (S.rd === 1) S.F.forEach((f, i) => { const T = TEAMS[f.t]; for (const [y, z, c] of [[106, 12, '#ffffff'], [122, 10, '#ffd36a']]) S.sc.tweens.add({ targets: tx(i ? 770 : 30, y, y < 110 ? (isTeam(f.t) ? 'CAMPEÓN ' : '') + T.c : 'TRAE: ' + T.p.join(' · '), z, c, i), alpha: 0, delay: 5000, duration: 600 }); });
  if (S.np === 1) {
    const h = S.F[0];
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
      if (!S.photo && b.hp < 50) { S.photo = 1; S.fl = .6; a.stun = 1; ann('¡FOTO DEL EQUIPO!', '#1abc9c', 900); snd('ctr'); }
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
  drawF(g, b, b.x, b.y, 1.15); drawF(g, a, a.x, a.y, 1.15); g = S.fx;
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
      if (S.li >= S.lad.length) go('end'); else nextArcade();
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
  tx(W / 2, 270, 'FINAL: LA DEMO CORRIÓ EN VIVO', 17, '#ff6ec7');
  tx(W / 2, 302, '36 HORAS, 5 PELEAS Y EL DEADLINE VENCIDO.\nEL CHAT PIDIÓ EL LINK.', 13, '#f7ffd8');
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
