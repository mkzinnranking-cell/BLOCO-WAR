// @ts-nocheck
// ============ ÁUDIO PROCEDURAL (WebAudio) com espacialização 3D ============
let ctx: AudioContext | null = null;
let master, comp, musicG, sfxG, ambG, revIn, nb;
const vols = { master: 0.8, music: 0.5, sfx: 0.9 };
let lis = { x: 0, y: 0, z: 0 };
let voices = 0;
let music = { on: false, intensity: 0, step: 0, next: 0, timer: 0 };
let ambNodes = null;

function setP(p, v) {
  if (p.positionX) { p.positionX.value = v.x; p.positionY.value = v.y; p.positionZ.value = v.z; } else p.setPosition(v.x, v.y, v.z);
}
function bus(pos, send = 0.22) {
  if (!ctx) return null;
  const g = ctx.createGain();
  if (pos) {
    const p = ctx.createPanner();
    p.panningModel = 'equalpower'; p.distanceModel = 'inverse'; p.refDistance = 7; p.rolloffFactor = 1.25; p.maxDistance = 500;
    setP(p, pos); g.connect(p); p.connect(sfxG);
  } else g.connect(sfxG);
  if (send > 0) { const s = ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(revIn); }
  return g;
}
function noise(t, dur, dest, type, f0, f1, g0, q = 1, delay = 0) {
  const src = ctx.createBufferSource(); src.buffer = nb; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t + delay); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + delay + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + delay); g.gain.linearRampToValueAtTime(g0, t + delay + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t + delay, Math.random() * 1.5); src.stop(t + delay + dur + 0.05);
}
function tone(t, dur, dest, wave, f0, f1, g0, delay = 0) {
  const o = ctx.createOscillator(); o.type = wave;
  o.frequency.setValueAtTime(f0, t + delay); o.frequency.exponentialRampToValueAtTime(Math.max(10, f1), t + delay + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(g0, t + delay); g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
  o.connect(g); g.connect(dest); o.start(t + delay); o.stop(t + delay + dur + 0.05);
}
function dist(pos) { if (!pos) return 0; const dx = pos.x - lis.x, dy = pos.y - lis.y, dz = pos.z - lis.z; return Math.sqrt(dx * dx + dy * dy + dz * dz); }
function ok(pos, max = 220) { if (!ctx || voices > 40) return false; if (pos && dist(pos) > max) return false; return true; }
function voice(d) { voices++; setTimeout(() => voices--, d * 1000 + 100); }

const SHOT = {
  pistol: { lp: 2600, d: 0.14, th: 190, tg: 0.5, cr: 4200, g: 0.9 },
  smg: { lp: 3000, d: 0.12, th: 170, tg: 0.5, cr: 4800, g: 0.8 },
  rifle: { lp: 2200, d: 0.22, th: 120, tg: 0.9, cr: 3600, g: 1 },
  shot: { lp: 1400, d: 0.38, th: 90, tg: 1.3, cr: 2500, g: 1.15 },
  lmg: { lp: 1800, d: 0.2, th: 100, tg: 1.1, cr: 3000, g: 1.1 },
  snipe: { lp: 1500, d: 0.7, th: 70, tg: 1.5, cr: 3300, g: 1.3 },
};

export const A = {
  init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }
    master = ctx.createGain(); comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    musicG = ctx.createGain(); sfxG = ctx.createGain(); ambG = ctx.createGain();
    musicG.connect(master); sfxG.connect(master); ambG.connect(master);
    const len = ctx.sampleRate * 2; nb = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = nb.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const rl = ctx.sampleRate * 1.4; const ib = ctx.createBuffer(2, rl, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const x = ib.getChannelData(c); for (let i = 0; i < rl; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 3); }
    const conv = ctx.createConvolver(); conv.buffer = ib; revIn = ctx.createGain(); revIn.connect(conv);
    const rg = ctx.createGain(); rg.gain.value = 0.55; conv.connect(rg); rg.connect(sfxG);
    A.applyVolumes(); A.startAmbient(); A.startMusic();
  },
  applyVolumes(v) { if (v) Object.assign(vols, v); if (!ctx) return; master.gain.value = vols.master; musicG.gain.value = vols.music * 0.6; sfxG.gain.value = vols.sfx; ambG.gain.value = vols.sfx * 0.7; },
  listener(pos, yaw) {
    if (!ctx) return; lis = pos; const L = ctx.listener;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    if (L.positionX) { L.positionX.value = pos.x; L.positionY.value = pos.y; L.positionZ.value = pos.z; L.forwardX.value = fx; L.forwardY.value = 0; L.forwardZ.value = fz; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0; }
    else { L.setPosition(pos.x, pos.y, pos.z); L.setOrientation(fx, 0, fz, 0, 1, 0); }
  },
  shot(snd, pos) {
    if (!ok(pos, 400)) return; const t = ctx.currentTime; const p = SHOT[snd.k] || SHOT.rifle; const dd = dist(pos);
    const sup = snd.sup ? 0.35 : 1; const big = snd.big ? 1.25 : 1; const hi = snd.hi ? 1.3 : 1;
    voice(1.2);
    if (dd > 90) { // tiro distante: abafado e atrasado
      const b = bus(pos, 0.6); const dl = dd / 340; noise(t, 0.6, b, 'lowpass', 900, 150, 0.8 * p.g, 0.7, dl); tone(t, 0.3, b, 'sine', 90, 40, 0.8, dl); return;
    }
    const b = bus(pos, snd.sup ? 0.1 : 0.3);
    noise(t, p.d * 0.5 * big, b, 'highpass', p.cr * hi, p.cr * 0.6, 0.7 * p.g * sup, 0.8);
    noise(t, p.d * big, b, 'lowpass', p.lp * sup, 200, 1.2 * p.g * sup, 0.9);
    tone(t, 0.12 * big, b, 'sine', p.th * big, 38, p.tg * sup);
    if (snd.k === 'snipe' || snd.k === 'shot') noise(t, p.d * 2.2, b, 'lowpass', 600, 80, 0.6, 0.7, 0.03);
    if (snd.sup) noise(t, 0.08, b, 'bandpass', 5000, 3000, 0.25, 2);
  },
  reload(cat, pos, rl) {
    if (!ok(pos, 50)) return; const t = ctx.currentTime; const b = bus(pos, 0.1); voice(rl + 0.5);
    const click = (d, f = 1800, g = 0.5) => { noise(t, 0.04, b, 'bandpass', f, f * 0.6, g, 3, d); tone(t, 0.03, b, 'square', f * 0.7, f * 0.4, g * 0.15, d); };
    if (cat === 'pump') { for (let i = 0; i < 4; i++) click(i * 0.38 + 0.05, 1400, 0.4); return; }
    click(rl * 0.12, 1500, 0.6); noise(t, 0.12, b, 'lowpass', 900, 300, 0.35, 1, rl * 0.18);
    click(rl * 0.55, 1100, 0.7); tone(t, 0.06, b, 'triangle', 220, 110, 0.35, rl * 0.55);
    click(rl * 0.85, 2200, 0.6); click(rl * 0.9, 1700, 0.5);
  },
  bolt(pos) { if (!ok(pos, 60)) return; const t = ctx.currentTime, b = bus(pos, 0.1); noise(t, 0.05, b, 'bandpass', 1400, 900, 0.5, 3, 0.1); noise(t, 0.05, b, 'bandpass', 1900, 1300, 0.5, 3, 0.3); },
  empty(pos) { if (!ok(pos, 40)) return; const t = ctx.currentTime; noise(t, 0.03, bus(pos, 0), 'bandpass', 2400, 1800, 0.4, 4); },
  swap(pos) { if (!ok(pos, 40)) return; const t = ctx.currentTime, b = bus(pos, 0.05); noise(t, 0.08, b, 'bandpass', 700, 500, 0.4, 2); noise(t, 0.04, b, 'bandpass', 2000, 1500, 0.4, 3, 0.12); },
  step(pos, surf = 'concrete', run = false) {
    if (!ok(pos, 45)) return; const t = ctx.currentTime, b = bus(pos, surf === 'metal' ? 0.25 : 0.06); const g = run ? 0.5 : 0.3; voice(0.3);
    if (surf === 'dirt') noise(t, 0.09, b, 'lowpass', 700, 300, g * 1.2, 0.7);
    else if (surf === 'grass') { noise(t, 0.12, b, 'bandpass', 1500, 900, g * 0.7, 0.6); }
    else if (surf === 'metal') { noise(t, 0.06, b, 'bandpass', 2500, 1500, g * 0.8, 2); tone(t, 0.12, b, 'triangle', 900 + Math.random() * 200, 700, g * 0.2); }
    else if (surf === 'wood') noise(t, 0.08, b, 'bandpass', 700, 400, g * 1.1, 1.5);
    else { noise(t, 0.06, b, 'bandpass', 1600 + Math.random() * 300, 700, g, 1.2); }
  },
  jump(pos) { if (!ok(pos, 30)) return; noise(ctx.currentTime, 0.12, bus(pos, 0), 'lowpass', 600, 300, 0.3); },
  explosion(pos, size = 1) {
    if (!ctx) return; const t = ctx.currentTime; const dd = dist(pos); const b = bus(pos, 0.5); voice(2.5); const dl = Math.min(1.2, dd / 600);
    noise(t, 1.6 * size, b, 'lowpass', 1400, 50, 2.2, 0.7, dl); tone(t, 1.0 * size, b, 'sine', 80, 25, 2, dl);
    noise(t, 0.3, b, 'highpass', 3000, 1000, 0.8, 1, dl); noise(t, 2.2, b, 'lowpass', 400, 60, 0.9, 1, dl + 0.1);
  },
  whistle(pos) { if (!ok(pos, 300)) return; const t = ctx.currentTime, b = bus(pos, 0.3); tone(t, 1.6, b, 'sine', 1800, 500, 0.25); noise(t, 1.5, b, 'bandpass', 2200, 700, 0.15, 6); },
  hit(mat, pos) {
    if (!ok(pos, 60)) return; const t = ctx.currentTime, b = bus(pos, 0.12);
    if (mat === 'metal') { noise(t, 0.05, b, 'bandpass', 3000, 2000, 0.6, 4); tone(t, 0.25, b, 'triangle', 2400, 1800, 0.12); if (Math.random() < 0.4) tone(t, 0.3, b, 'sine', 3200, 1400, 0.1, 0.02); }
    else if (mat === 'wood') noise(t, 0.07, b, 'bandpass', 800, 400, 0.6, 1.5);
    else if (mat === 'flesh') { noise(t, 0.08, b, 'lowpass', 500, 200, 0.7, 1); }
    else if (mat === 'dirt') noise(t, 0.08, b, 'lowpass', 800, 300, 0.5, 1);
    else { noise(t, 0.05, b, 'bandpass', 2400, 1200, 0.5, 2); noise(t, 0.08, b, 'lowpass', 900, 400, 0.3, 1); }
  },
  whiz(pos) { if (!ok(pos, 30)) return; const t = ctx.currentTime; noise(t, 0.14, bus(pos, 0), 'bandpass', 3500, 1200, 0.5, 6); },
  hitmark(head) { if (!ctx) return; const t = ctx.currentTime, b = bus(null, 0); tone(t, 0.06, b, 'square', head ? 1800 : 1200, head ? 1500 : 900, 0.12); if (head) tone(t, 0.1, b, 'sine', 2600, 2200, 0.12, 0.03); },
  hurt() { if (!ctx) return; const t = ctx.currentTime, b = bus(null, 0.05); noise(t, 0.2, b, 'lowpass', 500, 150, 0.8); tone(t, 0.2, b, 'sine', 120, 60, 0.6); },
  heart() { if (!ctx) return; const t = ctx.currentTime, b = bus(null, 0); tone(t, 0.12, b, 'sine', 60, 40, 0.7); tone(t, 0.12, b, 'sine', 55, 35, 0.5, 0.18); },
  throw(pos) { if (!ok(pos, 40)) return; noise(ctx.currentTime, 0.25, bus(pos, 0), 'bandpass', 600, 1600, 0.35, 1); },
  pin(pos) { if (!ok(pos, 30)) return; const t = ctx.currentTime; const b = bus(pos, 0); noise(t, 0.04, b, 'bandpass', 3000, 2000, 0.5, 4); tone(t, 0.1, b, 'triangle', 2200, 1800, 0.12, 0.05); },
  bounce(pos) { if (!ok(pos, 50)) return; const t = ctx.currentTime, b = bus(pos, 0.15); noise(t, 0.04, b, 'bandpass', 2000, 1200, 0.4, 3); tone(t, 0.08, b, 'triangle', 1400, 900, 0.2); },
  smoke(pos) { if (!ok(pos, 60)) return; noise(ctx.currentTime, 2.5, bus(pos, 0.1), 'highpass', 4000, 2500, 0.3, 0.7); },
  pickup() { if (!ctx) return; const t = ctx.currentTime, b = bus(null, 0); tone(t, 0.08, b, 'square', 600, 900, 0.1); tone(t, 0.1, b, 'square', 900, 1200, 0.1, 0.08); },
  click() { if (!ctx) return; tone(ctx.currentTime, 0.05, bus(null, 0), 'square', 900, 700, 0.07); },
  ui(ok2 = true) { if (!ctx) return; const t = ctx.currentTime, b = bus(null, 0.1); tone(t, 0.12, b, 'triangle', ok2 ? 500 : 300, ok2 ? 900 : 200, 0.15); },
  radio(pos) { if (!ctx) return; const t = ctx.currentTime, b = bus(pos, 0); noise(t, 0.12, b, 'bandpass', 1800, 1500, 0.35, 3); tone(t, 0.06, b, 'sine', 1200, 1200, 0.1, 0.12); noise(t, 0.08, b, 'bandpass', 1800, 1500, 0.3, 3, 0.7); },
  beep() { if (!ctx) return; tone(ctx.currentTime, 0.1, bus(null, 0), 'square', 1000, 1000, 0.08); },
  plant() { if (!ctx) return; const t = ctx.currentTime, b = bus(null, 0); for (let i = 0; i < 3; i++) tone(t, 0.07, b, 'square', 1500, 1500, 0.1, i * 0.12); },
  jingle(win) {
    if (!ctx) return; const t = ctx.currentTime, b = bus(null, 0.4); const n = win ? [392, 494, 587, 784] : [330, 311, 262, 196];
    n.forEach((f, i) => { tone(t, 0.5, b, win ? 'triangle' : 'sawtooth', f, f, 0.18, i * 0.18); });
  },
  alarmLoop(pos, secs = 8) { // sirene espacial
    if (!ok(pos, 300)) return; const t = ctx.currentTime, b = bus(pos, 0.3); voice(secs);
    const o = ctx.createOscillator(); o.type = 'sawtooth'; const f = o.frequency;
    for (let i = 0; i < secs; i++) { f.setValueAtTime(500, t + i); f.linearRampToValueAtTime(900, t + i + 0.5); f.linearRampToValueAtTime(500, t + i + 1); }
    const g = ctx.createGain(); g.gain.setValueAtTime(0.18, t); g.gain.linearRampToValueAtTime(0, t + secs);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; o.connect(lp); lp.connect(g); g.connect(b); o.start(t); o.stop(t + secs);
  },
  heli(pos, secs = 12) { // retorna objeto com painner atualizável
    if (!ctx) return null; const t = ctx.currentTime;
    const p = ctx.createPanner(); p.panningModel = 'equalpower'; p.distanceModel = 'inverse'; p.refDistance = 25; p.rolloffFactor = 1; p.maxDistance = 900; setP(p, pos); p.connect(sfxG);
    const g = ctx.createGain(); g.gain.value = 0.0001; g.gain.linearRampToValueAtTime(0.9, t + 1.5); g.gain.setValueAtTime(0.9, t + secs - 2); g.gain.linearRampToValueAtTime(0.0001, t + secs);
    const src = ctx.createBufferSource(); src.buffer = nb; src.loop = true; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
    const amp = ctx.createGain(); amp.gain.value = 0.5; const lfo = ctx.createOscillator(); lfo.frequency.value = 17; const lg = ctx.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(amp.gain);
    src.connect(f); f.connect(amp); amp.connect(g); g.connect(p); src.start(t); lfo.start(t); src.stop(t + secs + 0.1); lfo.stop(t + secs + 0.1);
    return { p, set: (v) => setP(p, v) };
  },
  engine(pos, secs = 6) { if (!ctx) return null; const t = ctx.currentTime; const p = ctx.createPanner(); p.distanceModel = 'inverse'; p.refDistance = 12; p.maxDistance = 400; setP(p, pos); p.connect(sfxG); const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 55; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.35, t + 1); g.gain.linearRampToValueAtTime(0.0001, t + secs); o.connect(lp); lp.connect(g); g.connect(p); o.start(t); o.stop(t + secs + 0.1); return { set: (v) => setP(p, v) }; },
  startAmbient() {
    const src = ctx.createBufferSource(); src.buffer = nb; src.loop = true; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.6;
    const g = ctx.createGain(); g.gain.value = 0.12; const lfo = ctx.createOscillator(); lfo.frequency.value = 0.15; const lg = ctx.createGain(); lg.gain.value = 250; lfo.connect(lg); lg.connect(f.frequency);
    src.connect(f); f.connect(g); g.connect(ambG); src.start(); lfo.start(); ambNodes = { g };
    setInterval(() => { // eventos ambientes
      if (!ctx || !A.ambKind) return; const r = Math.random(); const pos = { x: lis.x + (Math.random() - 0.5) * 300, y: 2, z: lis.z + (Math.random() - 0.5) * 300 };
      const t = ctx.currentTime;
      if (A.ambKind === 'forest' && r < 0.5) { const b = bus(pos, 0.2); for (let i = 0; i < 3; i++) tone(t, 0.08, b, 'sine', 3000 + Math.random() * 1500, 2500, 0.08, i * 0.12); }
      else if (A.ambKind === 'night' && r < 0.6) { const b = bus(pos, 0.1); for (let i = 0; i < 6; i++) tone(t, 0.04, b, 'square', 4200, 4200, 0.02, i * 0.06); }
      else if (r < 0.3 && A.war) A.shot({ k: Math.random() < 0.5 ? 'rifle' : 'lmg' }, { x: lis.x + (Math.random() - 0.5) * 600, y: 2, z: lis.z + (Math.random() - 0.5) * 600 });
    }, 2200);
  },
  ambKind: '', war: false,
  setAmbient(kind, war, windVol = 0.12) { A.ambKind = kind; A.war = war; if (ambNodes) ambNodes.g.gain.value = windVol; },
  // ---- música procedural ----
  startMusic() {
    if (music.on) return; music.on = true; music.next = ctx.currentTime + 0.2;
    const root = [55, 55, 65.4, 49];
    const sched = () => {
      if (!ctx || !music.on) return; const spb = 60 / 104 / 4; const I = music.intensity;
      while (music.next < ctx.currentTime + 0.3) {
        const t = music.next, s = music.step % 64, bar = Math.floor(s / 16) % 4, st = s % 16; const b = bus(null, 0.15);
        const mg = ctx.createGain(); mg.gain.value = 1; mg.connect(musicG); // direto à bus de música
        const out = (node) => node.connect(musicG);
        const pad = () => { const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = o2.type = 'sawtooth'; o.frequency.value = root[bar]; o2.frequency.value = root[bar] * 1.005; f.type = 'lowpass'; f.frequency.value = 280 + I * 400; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12, t + 0.8); g.gain.linearRampToValueAtTime(0.0001, t + spb * 16); o.connect(f); o2.connect(f); f.connect(g); out(g); o.start(t); o2.start(t); o.stop(t + spb * 16 + 0.1); o2.stop(t + spb * 16 + 0.1); };
        if (st === 0) pad();
        if (I > 0.3 && st % 4 === 0) { const g = ctx.createGain(); g.gain.value = 1; out(g); tone(t, 0.18, g, 'sine', 70, 38, 0.35 + I * 0.25); }
        if (I > 0.55) {
          if (st === 4 || st === 12) { const g = ctx.createGain(); out(g); noise(t, 0.14, g, 'bandpass', 1800, 900, 0.22, 0.8); }
          if (st % 2 === 0) { const g = ctx.createGain(); out(g); noise(t, 0.03, g, 'highpass', 7000, 6000, 0.06, 1); }
          if (I > 0.7 && [0, 3, 6, 10, 11].includes(st)) { const g = ctx.createGain(); out(g); const fr = root[bar] * (st === 6 ? 1.5 : 1); const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; const gg = ctx.createGain(); gg.gain.setValueAtTime(0.18, t); gg.gain.exponentialRampToValueAtTime(0.0001, t + spb * 1.8); o.connect(f); f.connect(gg); out(gg); o.start(t); o.stop(t + spb * 2); }
        } else if (I > 0.15 && st % 8 === 0) { const g = ctx.createGain(); out(g); tone(t, 0.5, g, 'sine', root[bar] * 2, root[bar] * 2, 0.08); }
        void b; music.next += spb; music.step++;
      }
    };
    clearInterval(music.timer); music.timer = setInterval(sched, 100);
  },
  setIntensity(v) { music.intensity = v; },
  stopMusic() { music.intensity = 0; },
  speak(txt, who) {
    if (!('speechSynthesis' in window) || vols.sfx <= 0.05) return;
    try {
      const u = new SpeechSynthesisUtterance(txt); u.lang = 'pt-BR'; u.rate = 1.15; u.pitch = who && who.includes('Dra') ? 1.3 : 0.7; u.volume = Math.min(1, vols.master * vols.sfx * 0.7);
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  },
};
