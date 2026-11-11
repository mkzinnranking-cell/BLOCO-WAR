// @ts-nocheck
// ============ MODELOS 3D: soldados em blocos, armas, veículos, props ============
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { UNIFORMS, OPT, WMAP } from './data';

export const sh = (hex: number, f: number) => { const c = new THREE.Color(hex); c.multiplyScalar(f); return c.getHex(); };
const _c = new THREE.Color();

// Construtor de partes: mescla caixas/cilindros coloridos em uma única geometria (poucos draw calls)
export class PB {
  gear: any[] = []; cloth: any[] = []; camo: boolean;
  constructor(camo = false) { this.camo = camo; }
  fin(g: any, x: number, y: number, z: number, color: number, o: any) {
    if (o.rx) g.rotateX(o.rx); if (o.ry) g.rotateY(o.ry); if (o.rz) g.rotateZ(o.rz);
    g.translate(x, y, z); _c.setHex(color); const n = g.attributes.position.count; const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    (o.cloth && this.camo ? this.cloth : this.gear).push(g); return this;
  }
  box(w: number, h: number, d: number, x: number, y: number, z: number, color: number, o: any = {}) { return this.fin(new THREE.BoxGeometry(w, h, d), x, y, z, color, o); }
  cyl(r: number, len: number, x: number, y: number, z: number, color: number, o: any = {}) {
    const g = new THREE.CylinderGeometry(o.r2 ?? r, r, len, o.seg || 8);
    if (o.axis === 'z') g.rotateX(Math.PI / 2); else if (o.axis === 'x') g.rotateZ(Math.PI / 2);
    return this.fin(g, x, y, z, color, o);
  }
  cone(r: number, len: number, x: number, y: number, z: number, color: number, o: any = {}) { return this.cyl(r, len, x, y, z, color, { ...o, r2: 0.001 }); }
  geos() { return { gear: this.gear.length ? mergeGeometries(this.gear) : null, cloth: this.cloth.length ? mergeGeometries(this.cloth) : null }; }
}

export const GEAR = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.12 });
export const METAL = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.1 });
export const GLOW = new THREE.MeshBasicMaterial({ vertexColors: true });

// ---- camuflagens pixeladas ----
const CAMO_PAL = {
  woodland: ['#58692f', '#34421f', '#7a6a3c', '#222b15'], desert: ['#c9ad7c', '#a98d5e', '#dcc795', '#8a7448'], urban: ['#7a7d83', '#52555a', '#9a9da3', '#35383c'],
  snow: ['#eef3f6', '#cfd9e0', '#b0bec8', '#fafcfd'], digital: ['#43553f', '#5f7760', '#2b382d', '#82927a'], tiger: ['#6a5a30', '#2a2a15', '#9a8848', '#181808'],
};
const camoMats: any = {}; const clothPlain = {};
export function clothMat(id: string) {
  if (camoMats[id]) return camoMats[id];
  const pal = CAMO_PAL[id] || CAMO_PAL.woodland; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d')!;
  let seed = id.length * 977; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const grid: number[][] = []; for (let j = 0; j < 8; j++) { grid[j] = []; for (let i = 0; i < 8; i++) grid[j][i] = Math.floor(rnd() * 4); }
  for (let k = 0; k < 2; k++) for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) if (rnd() < 0.55) grid[j][i] = grid[(j + 7) % 8][i];
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.fillStyle = pal[grid[j][i]]; if (id === 'tiger' && (i + j) % 2) x.fillStyle = pal[(grid[j][i] + 1) % 4]; x.fillRect(i * 8, j * 8, 8, 8); }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return (camoMats[id] = new THREE.MeshStandardMaterial({ map: t, vertexColors: true, roughness: 0.85, metalness: 0.02 }));
}
void clothPlain;

// ======================= ARMAS =======================
const gunCache: any = {};
function gunGeos(def: any) {
  if (gunCache[def.id]) return gunCache[def.id];
  const m = def.model, C = m.color, AC = m.accent, D = 0x17181b, L = m.len;
  const B = new PB(), S = new PB(), M = new PB(); const info: any = {};
  if (m.pistol) {
    B.box(0.036, 0.04, L * 0.95, 0, 0.012, -L / 2 + 0.04, AC);
    S.box(0.034, 0.042, L, 0, 0.052, -L / 2 + 0.035, C); S.box(0.012, 0.012, 0.012, 0, 0.082, 0.04, D); S.box(0.01, 0.014, 0.01, 0, 0.082, -L + 0.06, D); S.box(0.036, 0.01, 0.1, 0, 0.056, -L + 0.12, sh(C, 0.7));
    B.box(0.036, 0.11, 0.046, 0, -0.05, 0.015, D, { rx: -0.18 }); B.box(0.02, 0.012, 0.05, 0, -0.022, -0.045, D); B.box(0.008, 0.02, 0.012, 0, -0.03, -0.03, AC);
    M.box(0.03, 0.1, 0.04, 0, -0.05, 0.005, sh(C, 0.8), { rx: -0.18 }); M.box(0.034, 0.01, 0.046, 0, -0.105, -0.007, D, { rx: -0.18 });
    const mz = -L - 0.005; if (m.sup) { B.cyl(0.02, 0.17, 0, 0.052, mz - 0.07, D, { axis: 'z' }); B.cyl(0.0215, 0.008, 0, 0.052, mz - 0.03, sh(AC, 0.8), { axis: 'z' }); info.mz = mz - 0.16; } else { B.cyl(0.009, 0.05, 0, 0.052, mz - 0.01, D, { axis: 'z' }); info.mz = mz - 0.04; }
    info.my = 0.052; info.grip = [0, -0.02, 0.02]; info.fore = [0, -0.04, 0.03]; info.mag = [0, -0.08, 0.005];
  } else {
    const rz0 = 0.07, ez = rz0 - L; // receiver
    B.box(0.052, 0.08, L, 0, 0.04, rz0 - L / 2, C); B.box(0.03, 0.018, L * 0.92, 0, 0.089, rz0 - L / 2 - 0.01, AC); B.box(0.056, 0.03, L * 0.35, 0, 0.02, rz0 - L * 0.55, sh(C, 0.8));
    B.box(0.04, 0.12, 0.05, 0, -0.05, 0.03, D, { rx: 0.3 }); B.box(0.022, 0.014, 0.07, 0, -0.012, -0.05, D); B.box(0.008, 0.02, 0.012, 0, -0.02, -0.03, AC);
    // coronha
    const st = m.stock;
    if (st === 'fixed') { B.box(0.05, 0.09, 0.2, 0, 0.03, rz0 + 0.1, C); B.box(0.04, 0.03, 0.06, 0, 0.085, rz0 + 0.04, AC); B.box(0.056, 0.11, 0.03, 0, 0.03, rz0 + 0.215, D); }
    else if (st === 'skeleton') { B.box(0.012, 0.012, 0.2, 0.014, 0.06, rz0 + 0.1, C); B.box(0.012, 0.012, 0.2, -0.014, 0.06, rz0 + 0.1, C); B.box(0.05, 0.085, 0.025, 0, 0.035, rz0 + 0.21, D); }
    else if (st === 'wood') { B.box(0.048, 0.1, 0.25, 0, 0.025, rz0 + 0.125, AC, { rx: 0.05 }); B.box(0.054, 0.11, 0.03, 0, 0.0, rz0 + 0.26, D); }
    else if (st === 'heavy') { B.box(0.06, 0.12, 0.26, 0, 0.02, rz0 + 0.13, C); B.box(0.045, 0.04, 0.16, 0, 0.1, rz0 + 0.12, sh(C, 0.8)); B.box(0.062, 0.13, 0.03, 0, 0.02, rz0 + 0.27, D); }
    else if (st === 'skeleton2') { B.box(0.012, 0.012, 0.26, 0.015, 0.075, rz0 + 0.13, AC); B.box(0.012, 0.012, 0.22, 0.015, -0.01, rz0 + 0.12, AC, { rx: 0.2 }); B.box(0.012, 0.1, 0.012, 0.015, 0.03, rz0 + 0.12, AC); B.box(0.02, 0.05, 0.1, 0, 0.1, rz0 + 0.12, AC); B.box(0.054, 0.12, 0.03, 0, 0.02, rz0 + 0.26, D); }
    // guarda-mão
    const hl = { short: 0.12, long: 0.28, rail: 0.22, wood: 0.25, boxy: 0.14, heavy: 0.3 }[m.hand] || 0.12; const hc = m.hand === 'wood' ? AC : sh(C, 0.85);
    if (m.hand) { B.box(0.062, 0.066, hl, 0, 0.04, ez - hl / 2, hc); if (m.hand !== 'wood') { B.box(0.026, 0.014, hl, 0, 0.082, ez - hl / 2, AC); for (let i = 0; i < 3; i++) B.box(0.064, 0.02, 0.025, 0, 0.04, ez - 0.03 - i * (hl / 3.3), D); } else B.box(0.056, 0.02, hl * 0.9, 0, 0.082, ez - hl / 2, sh(AC, 0.8)); B.box(0.04, 0.03, 0.05, 0, 0.0, ez - hl * 0.7, D); }
    const bz = ez - (m.hand ? hl : 0);
    B.cyl(0.0125, m.barrel + 0.02, 0, 0.045, bz - m.barrel / 2 + 0.01, sh(C, 0.7), { axis: 'z' }); B.cyl(0.02, 0.055, 0, 0.045, bz - m.barrel - 0.005, D, { axis: 'z' }); B.box(0.014, 0.04, 0.012, 0, 0.075, bz - m.barrel * 0.85, D);
    info.mz = bz - m.barrel - 0.04; info.my = 0.045;
    // carregador
    const mg = m.mag;
    if (mg === 'curved') M.box(0.036, 0.17, 0.052, 0, -0.1, -0.14, sh(C, 0.8), { rx: 0.28 });
    else if (mg === 'stick') M.box(0.032, 0.15, 0.045, 0, -0.1, -0.15, sh(C, 0.8), { rx: 0.05 });
    else if (mg === 'stickfwd') M.box(0.034, 0.17, 0.045, 0, -0.1, -0.05, sh(C, 0.8), { rx: -0.25 });
    else if (mg === 'box') M.box(0.036, 0.08, 0.075, 0, -0.06, -0.14, sh(C, 0.8));
    else if (mg === 'drum') { M.cyl(0.085, 0.07, 0, -0.1, -0.16, sh(C, 0.8), { axis: 'x', seg: 14 }); M.cyl(0.04, 0.08, 0, -0.1, -0.16, D, { axis: 'x' }); }
    else if (mg === 'belt') { M.box(0.09, 0.11, 0.14, -0.065, -0.08, -0.16, sh(C, 0.9)); M.box(0.092, 0.02, 0.145, -0.065, -0.14, -0.16, D); for (let i = 0; i < 6; i++) M.box(0.016, 0.016, 0.03, -0.045 + i * 0.002, -0.03 + Math.sin(i * 0.6) * 0.0 + (i * 0.002), -0.02 + i * 0.004, 0xc9a24a); }
    else if (mg === 'tube') { B.cyl(0.014, 0.3, 0, 0.0, ez - 0.05, D, { axis: 'z' }); }
    info.mag = [0, -0.1, -0.15];
    // mira
    const sc = m.scope;
    if (sc === 'reddot') { B.box(0.04, 0.02, 0.07, 0, 0.108, -0.12, D); B.box(0.034, 0.04, 0.008, 0, 0.14, -0.1, D); B.box(0.004, 0.004, 0.003, 0, 0.138, -0.096, 0xff2020); B.box(0.03, 0.03, 0.006, 0, 0.14, -0.15, 0x274a5a); }
    else if (sc === 'acog') { B.cyl(0.024, 0.13, 0, 0.13, -0.13, D, { axis: 'z' }); B.cyl(0.03, 0.025, 0, 0.13, -0.2, D, { axis: 'z' }); B.cyl(0.026, 0.004, 0, 0.13, -0.2125, 0x3d7aa0, { axis: 'z' }); B.box(0.03, 0.03, 0.08, 0, 0.105, -0.13, D); B.box(0.006, 0.006, 0.02, 0, 0.158, -0.14, 0xff4020); }
    else if (sc === 'long') { B.cyl(0.027, 0.3, 0, 0.14, -0.15, D, { axis: 'z' }); B.cyl(0.04, 0.07, 0, 0.14, -0.31, D, { axis: 'z' }); B.cyl(0.036, 0.004, 0, 0.14, -0.347, 0x3d7aa0, { axis: 'z' }); B.cyl(0.032, 0.05, 0, 0.14, 0.02, D, { axis: 'z' }); B.box(0.02, 0.035, 0.03, 0, 0.18, -0.14, D); B.box(0.035, 0.02, 0.03, 0.04, 0.14, -0.14, D); B.box(0.032, 0.03, 0.03, 0, 0.1, -0.06, D); B.box(0.032, 0.03, 0.03, 0, 0.1, -0.22, D); }
    else if (sc !== 'none' && !m.pistol) { B.box(0.012, 0.03, 0.012, 0, 0.1, ez - 0.01, D); B.box(0.03, 0.025, 0.012, 0, 0.1, 0.0, D); }
    if (m.bipod) { B.box(0.008, 0.008, 0.16, 0.025, -0.02, bz + 0.05, D, { rx: 0.1 }); B.box(0.008, 0.008, 0.16, -0.025, -0.02, bz + 0.05, D, { rx: 0.1 }); }
    if (m.carry) B.box(0.014, 0.06, 0.1, 0, 0.12, ez - 0.05, D), B.box(0.02, 0.016, 0.12, 0, 0.152, ez - 0.05, D);
    // ferrolho / alavanca (peça móvel)
    if (m.pump) { S.box(0.058, 0.06, 0.15, 0, -0.002, ez - 0.09, AC); S.box(0.03, 0.01, 0.15, 0, -0.04, ez - 0.09, D); }
    else if (m.bolt) { S.box(0.07, 0.014, 0.014, 0.05, 0.065, 0.0, D); S.box(0.03, 0.03, 0.03, 0.09, 0.065, 0.0, D); S.box(0.04, 0.03, 0.06, 0, 0.08, 0.0, sh(C, 0.8)); }
    else { S.box(0.022, 0.02, 0.05, 0.04, 0.07, -0.08, D); S.box(0.04, 0.012, 0.1, 0, 0.082, -0.05, sh(C, 0.8)); }
    info.grip = [0, -0.03, 0.03]; info.fore = [0, 0.0, ez - (m.hand ? hl * 0.45 : 0.08)];
  }
  const out = { b: B.geos().gear, s: S.geos().gear, m: M.geos().gear, info }; gunCache[def.id] = out; return out;
}
let flashTex: any = null;
export function flashMat() {
  if (!flashTex) { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d')!; const g = x.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, '#fff'); g.addColorStop(0.3, '#ffd070'); g.addColorStop(1, 'rgba(255,120,20,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); x.fillStyle = '#ffe9a0'; for (let i = 0; i < 4; i++) { x.save(); x.translate(32, 32); x.rotate(i * Math.PI / 4); x.fillRect(-30, -2, 60, 4); x.restore(); } flashTex = new THREE.CanvasTexture(c); }
  return new THREE.MeshBasicMaterial({ map: flashTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
}
const flashShared = {};
export function buildGun(def: any) {
  const G = gunGeos(def); const g = new THREE.Group();
  const body = new THREE.Mesh(G.b, METAL); const slide = G.s ? new THREE.Mesh(G.s, METAL) : new THREE.Group(); const mag = G.m ? new THREE.Mesh(G.m, METAL) : new THREE.Group();
  g.add(body, slide, mag);
  const muz = new THREE.Object3D(); muz.position.set(0, G.info.my, G.info.mz); g.add(muz);
  g.userData = { body, slide, mag, muz, info: G.info, def };
  void flashShared; return g;
}
export function makeFlash(size = 0.28) {
  const f = new THREE.Group(); const m = flashMat(); const p1 = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m); const p2 = p1.clone(); p2.rotation.z = Math.PI / 2; const p3 = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m); p3.rotation.y = Math.PI / 2;
  f.add(p1, p2, p3); f.visible = false; return f;
}

// ======================= SOLDADO =======================
const GLOVE = { black: 0x1c1d20, tan: 0x9a8a64, green: 0x4a5a35, white: 0xdde2e6 };
const BOOT = { black: 0x1d1e21, brown: 0x4a3220, tan: 0x8a7650, green: 0x3d4a2e };
const soldierCache: any = {};
function makeSoldierGeos(look: any, ex: any) {
  const uni = UNIFORMS.find((u) => u.id === look.uniform) || UNIFORMS[0]; const camo = look.camo && look.camo !== 'none';
  const U = camo ? sh(uni.base, 1.9) : uni.base, UD = camo ? sh(uni.dark, 1.5) : uni.dark; const cl = { cloth: true };
  const skin = OPT.skin.find((s) => s.id === look.skin)?.hex ?? 0xe0ac8a; const skinD = sh(skin, 0.8);
  const acc = OPT.color.find((c) => c.id === look.color)?.hex ?? 0x2f7fd1; const emb = OPT.emblem.find((e) => e.id === look.emblem)?.color ?? 0x3b82c4;
  const DK = 0x1b1c20, VEST = look.vest !== 'none' ? (uni.id.startsWith('dominion') ? 0x2a2b30 : sh(uni.dark, 0.85)) : 0;
  const gl = look.gloves === 'skin' ? skin : GLOVE[look.gloves] || GLOVE.black; const bt = BOOT[look.boots] || BOOT.black;
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const P: any = {};
  // ---------- CABEÇA ----------
  const H = new PB(camo);
  H.box(0.3, 0.32, 0.3, 0, 0.17, 0, skin);
  H.box(0.04, 0.045, 0.03, 0, 0.12, -0.16, skinD); // nariz
  H.box(0.06, 0.045, 0.012, -0.075, 0.2, -0.152, 0xf4f4f4); H.box(0.06, 0.045, 0.012, 0.075, 0.2, -0.152, 0xf4f4f4);
  const eyeC = look.skin === 's4' || look.skin === 's3' ? 0x1a1008 : 0x2c5a8a;
  H.box(0.032, 0.04, 0.014, -0.07, 0.2, -0.157, eyeC); H.box(0.032, 0.04, 0.014, 0.07, 0.2, -0.157, eyeC);
  H.box(0.018, 0.02, 0.016, -0.07, 0.2, -0.16, 0x050505); H.box(0.018, 0.02, 0.016, 0.07, 0.2, -0.16, 0x050505);
  H.box(0.08, 0.02, 0.012, -0.075, 0.25, -0.153, sh(0x3a2616, 1)); H.box(0.08, 0.02, 0.012, 0.075, 0.25, -0.153, sh(0x3a2616, 1));
  H.box(0.09, 0.016, 0.012, 0, 0.07, -0.152, 0x8a3a3a); H.box(0.032, 0.07, 0.04, -0.166, 0.16, 0, skinD); H.box(0.032, 0.07, 0.04, 0.166, 0.16, 0, skinD);
  const hair = [0x2a1a10, 0x1a1a1a, 0x5a3a1a, 0x8a6a3a][Math.floor(rnd() * 4)];
  if (look.helmet === 'none' || look.helmet === 'beret' || look.helmet === 'boonie') { H.box(0.32, 0.07, 0.32, 0, 0.33, 0.0, hair); H.box(0.32, 0.12, 0.05, 0, 0.26, 0.135, hair); }
  const hel = look.helmet; const HC = uni.id.startsWith('dominion') ? 0x2c2e33 : sh(uni.dark, 1.0);
  if (hel === 'standard') { H.box(0.35, 0.15, 0.35, 0, 0.32, 0, HC); H.box(0.37, 0.07, 0.37, 0, 0.26, 0.005, HC); H.box(0.3, 0.025, 0.07, 0, 0.35, -0.2, sh(HC, 0.8)); H.box(0.02, 0.16, 0.012, -0.15, 0.14, -0.06, 0x111111); H.box(0.02, 0.16, 0.012, 0.15, 0.14, -0.06, 0x111111); H.box(0.1, 0.03, 0.03, 0, 0.36, -0.18, sh(HC, 1.3)); H.box(0.36, 0.02, 0.1, 0, 0.395, 0.0, sh(HC, 0.9)); }
  else if (hel === 'tactical') { H.box(0.34, 0.12, 0.34, 0, 0.33, 0, HC); H.box(0.36, 0.05, 0.36, 0, 0.27, 0, HC); H.box(0.03, 0.05, 0.16, -0.18, 0.27, 0.0, 0x111111); H.box(0.03, 0.05, 0.16, 0.18, 0.27, 0.0, 0x111111); H.box(0.07, 0.04, 0.04, 0, 0.36, -0.18, 0x222222); H.box(0.05, 0.1, 0.1, -0.18, 0.15, 0.02, 0x222222); H.box(0.05, 0.1, 0.1, 0.18, 0.15, 0.02, 0x222222); H.box(0.3, 0.03, 0.04, 0, 0.12, 0.17, 0x111111); H.box(0.01, 0.01, 0.1, -0.18, 0.1, -0.05, 0x111111, { rx: 0.4 }); }
  else if (hel === 'heavy') { H.box(0.39, 0.2, 0.39, 0, 0.33, 0, HC); H.box(0.4, 0.1, 0.4, 0, 0.23, 0, sh(HC, 1.2)); H.box(0.36, 0.09, 0.05, 0, 0.04, -0.17, sh(HC, 0.9)); H.box(0.05, 0.18, 0.2, -0.195, 0.14, 0, HC); H.box(0.05, 0.18, 0.2, 0.195, 0.14, 0, HC); H.box(0.34, 0.025, 0.1, 0, 0.42, -0.1, sh(HC, 1.3)); H.box(0.33, 0.05, 0.03, 0, 0.215, -0.2, 0x0a0a0a); }
  else if (hel === 'boonie') { H.cyl(0.3, 0.025, 0, 0.3, 0, sh(UD, 1.1), { seg: 10 }); H.cyl(0.19, 0.1, 0, 0.36, 0, sh(UD, 1.1), { seg: 10 }); H.cyl(0.195, 0.03, 0, 0.33, 0, 0x2a2a1a, { seg: 10 }); }
  else if (hel === 'beret') { H.cyl(0.22, 0.06, 0.03, 0.355, 0, uni.id.startsWith('dominion') ? 0x7a1f26 : acc, { seg: 10, rz: 0.12 }); H.box(0.025, 0.04, 0.025, 0.02, 0.405, 0, 0x222222); H.box(0.06, 0.05, 0.015, -0.1, 0.34, -0.17, 0xd0a020); }
  else if (hel === 'beanie') { H.box(0.33, 0.12, 0.33, 0, 0.33, 0, sh(UD, 0.9)); H.box(0.34, 0.045, 0.34, 0, 0.27, 0, sh(UD, 0.7)); H.box(0.05, 0.05, 0.05, 0, 0.4, 0, sh(UD, 1.2)); }
  // máscara
  const mk = look.mask;
  if (mk === 'balaclava') { H.box(0.315, 0.17, 0.315, 0, 0.075, 0, 0x16171a); H.box(0.1, 0.03, 0.01, 0, 0.1, -0.16, 0x0c0c0e); }
  else if (mk === 'skull') { H.box(0.315, 0.17, 0.315, 0, 0.075, 0, 0x16171a); H.box(0.1, 0.045, 0.01, 0, 0.09, -0.162, 0xe6e6e0); for (let i = -2; i <= 2; i++) H.box(0.008, 0.045, 0.012, i * 0.02, 0.09, -0.163, 0x16171a); H.box(0.03, 0.03, 0.01, -0.035, 0.14, -0.162, 0xe6e6e0); H.box(0.03, 0.03, 0.01, 0.035, 0.14, -0.162, 0xe6e6e0); H.box(0.012, 0.016, 0.012, -0.035, 0.14, -0.165, 0x000000); H.box(0.012, 0.016, 0.012, 0.035, 0.14, -0.165, 0x000000); }
  else if (mk === 'gas') { H.box(0.32, 0.16, 0.06, 0, 0.08, -0.14, 0x2b2e2a); H.box(0.12, 0.1, 0.03, -0.075, 0.2, -0.165, 0x0b0f12); H.box(0.12, 0.1, 0.03, 0.075, 0.2, -0.165, 0x0b0f12); H.box(0.14, 0.014, 0.02, -0.075, 0.255, -0.17, 0x2b2e2a); H.box(0.14, 0.014, 0.02, 0.075, 0.255, -0.17, 0x2b2e2a); H.cyl(0.05, 0.1, 0, 0.06, -0.22, 0x3a3f38, { axis: 'z' }); H.cyl(0.03, 0.02, 0, 0.06, -0.28, 0x111111, { axis: 'z' }); H.box(0.32, 0.03, 0.32, 0, 0.12, 0, 0x1d1f1d); }
  else if (mk === 'bandana') { H.box(0.315, 0.12, 0.315, 0, 0.05, 0, uni.id.startsWith('dominion') ? 0x7a1f26 : acc); H.box(0.05, 0.07, 0.04, 0.1, 0.0, 0.17, sh(acc, 0.8)); }
  // óculos
  const gs = look.glasses;
  if (gs === 'tac') { H.box(0.31, 0.04, 0.014, 0, 0.2, -0.158, 0x111111); H.box(0.1, 0.05, 0.01, -0.07, 0.2, -0.164, 0x7090a8); H.box(0.1, 0.05, 0.01, 0.07, 0.2, -0.164, 0x7090a8); H.box(0.012, 0.03, 0.2, -0.155, 0.21, -0.06, 0x111111); H.box(0.012, 0.03, 0.2, 0.155, 0.21, -0.06, 0x111111); }
  else if (gs === 'sun') { H.box(0.12, 0.07, 0.014, -0.075, 0.2, -0.16, 0x050505); H.box(0.12, 0.07, 0.014, 0.075, 0.2, -0.16, 0x050505); H.box(0.03, 0.015, 0.014, 0, 0.215, -0.16, 0xc9a24a); H.box(0.012, 0.025, 0.2, -0.155, 0.22, -0.06, 0xc9a24a); H.box(0.012, 0.025, 0.2, 0.155, 0.22, -0.06, 0xc9a24a); }
  else if (gs === 'goggles') { H.box(0.3, 0.1, 0.04, 0, 0.2, -0.168, 0x1a1a1a); H.box(0.12, 0.07, 0.014, -0.075, 0.2, -0.19, 0xff9a1a); H.box(0.12, 0.07, 0.014, 0.075, 0.2, -0.19, 0xff9a1a); H.box(0.325, 0.07, 0.325, 0, 0.2, 0, 0x1a1a1a); }
  else if (gs === 'nvg') { H.box(0.1, 0.05, 0.05, 0, 0.375, -0.19, 0x222426); H.cyl(0.036, 0.1, -0.05, 0.39, -0.22, 0x1a1c1e, { axis: 'z' }); H.cyl(0.036, 0.1, 0.05, 0.39, -0.22, 0x1a1c1e, { axis: 'z' }); H.cyl(0.026, 0.01, -0.05, 0.39, -0.275, 0x39ff74, { axis: 'z' }); H.cyl(0.026, 0.01, 0.05, 0.39, -0.275, 0x39ff74, { axis: 'z' }); }
  if (look.acc === 'headset') { H.box(0.05, 0.11, 0.11, -0.18, 0.16, 0.02, 0x1f2125); H.box(0.05, 0.11, 0.11, 0.18, 0.16, 0.02, 0x1f2125); H.box(0.012, 0.012, 0.3, 0, 0.345, 0.0, 0x1f2125, { ry: 0 }); H.box(0.012, 0.012, 0.1, -0.16, 0.08, -0.1, 0x1f2125); H.box(0.02, 0.02, 0.025, -0.16, 0.08, -0.17, 0x111111); }
  if (ex.ghillie) for (let i = 0; i < 26; i++) H.box(0.05 + rnd() * 0.06, 0.04, 0.05 + rnd() * 0.06, (rnd() - 0.5) * 0.4, 0.3 + rnd() * 0.15, (rnd() - 0.5) * 0.4, [0x4d5a33, 0x6a6a3a, 0x3a4a28][i % 3]);
  P.head = H.geos();
  // ---------- TRONCO ----------
  const T = new PB(camo);
  T.box(0.44, 0.2, 0.25, 0, 0.1, 0, U, cl); T.box(0.5, 0.46, 0.27, 0, 0.42, 0, U, cl);
  T.box(0.46, 0.055, 0.27, 0, 0.18, 0, 0x1e1f22); T.box(0.07, 0.045, 0.012, 0, 0.18, -0.139, 0x9a9ea5);
  T.box(0.2, 0.05, 0.2, 0, 0.66, 0, UD, cl); T.box(0.11, 0.07, 0.11, 0, 0.7, 0, skinD);
  T.box(0.1, 0.07, 0.01, -0.12, 0.5, -0.138, UD, cl); T.box(0.1, 0.07, 0.01, 0.12, 0.5, -0.138, UD, cl);
  T.box(0.09, 0.1, 0.07, 0.22, 0.08, -0.08, sh(UD, 0.8)); T.box(0.1, 0.12, 0.06, -0.22, 0.08, -0.06, 0x23252a); // coldre/bolsa
  T.box(0.08, 0.04, 0.012, 0.0, 0.58, -0.138, 0xe8e8e8); T.box(0.07, 0.018, 0.013, 0.0, 0.58, -0.139, sh(uni.id.startsWith('dominion') ? 0x7a1f26 : acc, 1)); // fita nome
  // colete
  const V = look.vest, VC = VEST;
  if (V === 'light') { T.box(0.42, 0.24, 0.05, 0, 0.45, -0.158, VC); for (let i = -1; i <= 1; i++) { T.box(0.11, 0.13, 0.06, i * 0.13, 0.35, -0.2, sh(VC, 1.2)); T.box(0.11, 0.025, 0.065, i * 0.13, 0.405, -0.2, sh(VC, 0.8)); } T.box(0.09, 0.03, 0.3, -0.15, 0.665, 0, VC); T.box(0.09, 0.03, 0.3, 0.15, 0.665, 0, VC); T.box(0.4, 0.2, 0.04, 0, 0.45, 0.155, VC); T.box(0.08, 0.1, 0.05, 0.2, 0.52, -0.2, sh(VC, 1.3)); }
  else if (V === 'plate') { T.box(0.37, 0.36, 0.075, 0, 0.45, -0.17, VC); T.box(0.3, 0.3, 0.02, 0, 0.45, -0.213, sh(VC, 1.35)); T.box(0.37, 0.36, 0.075, 0, 0.45, 0.17, VC); T.box(0.52, 0.14, 0.31, 0, 0.27, 0, sh(VC, 0.9)); for (let i = -1; i <= 1; i++) T.box(0.095, 0.14, 0.06, i * 0.125, 0.26, -0.22, sh(VC, 1.25)); T.box(0.09, 0.03, 0.3, -0.15, 0.665, 0, VC); T.box(0.09, 0.03, 0.3, 0.15, 0.665, 0, VC); T.box(0.15, 0.08, 0.05, 0.0, 0.62, -0.215, sh(VC, 1.1)); T.box(0.34, 0.012, 0.012, 0, 0.5, -0.222, 0x3a3d42); T.box(0.34, 0.012, 0.012, 0, 0.4, -0.222, 0x3a3d42); T.box(0.07, 0.07, 0.01, -0.12, 0.6, -0.215, acc); }
  else if (V === 'heavy') { T.box(0.44, 0.42, 0.1, 0, 0.45, -0.18, VC); T.box(0.34, 0.34, 0.03, 0, 0.45, -0.235, sh(VC, 1.4)); T.box(0.44, 0.42, 0.1, 0, 0.45, 0.18, VC); T.box(0.55, 0.18, 0.34, 0, 0.27, 0, sh(VC, 0.9)); for (let i = -1; i <= 1; i++) T.box(0.1, 0.16, 0.07, i * 0.14, 0.25, -0.24, sh(VC, 1.3)); T.box(0.34, 0.09, 0.3, 0, 0.65, 0, sh(VC, 1.1)); T.box(0.2, 0.2, 0.04, 0, 0.1, -0.15, sh(VC, 1.1)); T.box(0.1, 0.2, 0.2, -0.27, 0.43, 0, VC); T.box(0.1, 0.2, 0.2, 0.27, 0.43, 0, VC); T.box(0.1, 0.1, 0.01, 0.0, 0.52, -0.242, acc); }
  // mochila
  const BP = look.backpack;
  if (BP === 'small') { T.box(0.34, 0.36, 0.15, 0, 0.44, 0.215, sh(UD, 1.1)); T.box(0.3, 0.1, 0.17, 0, 0.58, 0.215, sh(UD, 0.9)); T.box(0.1, 0.18, 0.06, -0.14, 0.38, 0.31, sh(UD, 1.2)); T.box(0.1, 0.18, 0.06, 0.14, 0.38, 0.31, sh(UD, 1.2)); T.box(0.04, 0.3, 0.02, -0.12, 0.45, 0.31, 0x222222); T.box(0.04, 0.3, 0.02, 0.12, 0.45, 0.31, 0x222222); }
  else if (BP === 'large') { T.box(0.4, 0.52, 0.24, 0, 0.45, 0.255, sh(UD, 1.0)); T.box(0.36, 0.14, 0.26, 0, 0.68, 0.255, sh(UD, 0.85)); T.cyl(0.07, 0.42, 0, 0.78, 0.29, 0x6b6a5a, { axis: 'x' }); T.box(0.12, 0.24, 0.15, -0.26, 0.4, 0.26, sh(UD, 1.2)); T.box(0.12, 0.24, 0.15, 0.26, 0.4, 0.26, sh(UD, 1.2)); T.cyl(0.045, 0.2, 0.14, 0.2, 0.39, 0x3a5a7a, { axis: 'y' }); T.box(0.3, 0.1, 0.1, 0, 0.2, 0.34, sh(UD, 0.8)); }
  else if (BP === 'radio') { T.box(0.32, 0.38, 0.15, 0, 0.44, 0.215, 0x32373a); T.box(0.28, 0.08, 0.02, 0, 0.55, 0.3, 0x1a1c1e); T.box(0.04, 0.04, 0.02, -0.08, 0.5, 0.31, 0x39ff74); T.box(0.04, 0.04, 0.02, 0.0, 0.5, 0.31, 0xff3a2a); T.box(0.04, 0.04, 0.02, 0.08, 0.5, 0.31, 0xffc02a); T.cyl(0.008, 0.9, 0.12, 0.95, 0.24, 0x111111, { seg: 4 }); T.box(0.06, 0.14, 0.04, -0.12, 0.34, 0.32, 0x111111); }
  else if (BP === 'medic') { T.box(0.36, 0.4, 0.17, 0, 0.44, 0.225, 0xe6e8ea); T.box(0.2, 0.05, 0.012, 0, 0.46, 0.315, 0xcc2222); T.box(0.05, 0.2, 0.012, 0, 0.46, 0.316, 0xcc2222); T.box(0.1, 0.16, 0.08, 0.2, 0.33, 0.26, 0xc9cdd0); T.box(0.1, 0.16, 0.08, -0.2, 0.33, 0.26, 0xc9cdd0); }
  if (look.acc === 'scarf') { T.box(0.27, 0.09, 0.25, 0, 0.67, 0, acc); T.box(0.08, 0.26, 0.03, 0.08, 0.52, -0.15, acc); T.box(0.08, 0.04, 0.032, 0.08, 0.39, -0.15, sh(acc, 0.7)); }
  if (look.acc === 'grenades') for (let i = 0; i < 3; i++) { T.cyl(0.032, 0.09, -0.16 + i * 0.065, 0.58, -0.2, 0x4a5236, { seg: 6 }); T.box(0.02, 0.02, 0.02, -0.16 + i * 0.065, 0.64, -0.2, 0x9a9a9a); }
  if (look.acc === 'tags') { T.box(0.012, 0.16, 0.012, 0, 0.6, -0.14, 0x9a9ea5); T.box(0.045, 0.07, 0.008, 0, 0.5, -0.14, 0xb8bcc2); T.box(0.045, 0.07, 0.008, 0.015, 0.49, -0.141, 0x9a9ea5); }
  if (ex.belt) { for (let i = 0; i < 9; i++) { T.box(0.035, 0.035, 0.03, -0.2 + i * 0.05, 0.62 - i * 0.045, -0.235, 0xc9a24a, { rz: -0.8 }); } T.box(0.36, 0.03, 0.02, 0, 0.45, -0.24, 0x3a3d33, { rz: -0.78 }); }
  if (ex.coat) { T.box(0.5, 0.36, 0.3, 0, -0.08, 0, UD, cl); T.box(0.52, 0.06, 0.32, 0, 0.12, 0, sh(UD, 0.7)); for (let i = 0; i < 3; i++) T.box(0.03, 0.03, 0.012, 0, 0.5 - i * 0.12, -0.14, 0xd0a020); T.box(0.34, 0.06, 0.3, 0, 0.66, 0, sh(UD, 1.2)); }
  if (ex.shield) { T.box(0.78, 1.05, 0.06, -0.12, 0.1, -0.5, 0x2c2f35); T.box(0.78, 0.07, 0.07, -0.12, 0.6, -0.5, 0x15171a); T.box(0.78, 0.07, 0.07, -0.12, -0.4, -0.5, 0x15171a); T.box(0.5, 0.2, 0.07, -0.12, 0.42, -0.505, 0x4a7a90); T.box(0.14, 0.14, 0.07, -0.12, 0.05, -0.505, 0xb3262e); T.box(0.05, 0.4, 0.1, 0.0, 0.1, -0.45, 0x15171a); }
  if (ex.ghillie) for (let i = 0; i < 40; i++) T.box(0.07 + rnd() * 0.08, 0.05, 0.07 + rnd() * 0.08, (rnd() - 0.5) * 0.6, 0.1 + rnd() * 0.6, 0.15 + rnd() * 0.15, [0x4d5a33, 0x6a6a3a, 0x3a4a28][i % 3]);
  P.torso = T.geos();
  // ---------- BRAÇOS ----------
  for (const side of [-1, 1]) {
    const A = new PB(camo), F = new PB(camo);
    A.box(0.16, 0.31, 0.16, 0, -0.14, 0, U, cl); A.box(0.18, 0.07, 0.18, 0, 0.0, 0, UD, cl);
    if (V === 'heavy' || look.vest === 'plate') A.box(0.2, 0.07, 0.2, 0, 0.03, 0, VC || UD); if (V === 'heavy') { A.box(0.22, 0.05, 0.22, 0, 0.06, 0, sh(VC, 1.3)); A.box(0.2, 0.06, 0.2, 0, -0.04, 0, sh(VC, 1.1)); }
    if (side < 0) { A.box(0.012, 0.1, 0.09, -0.086, -0.08, 0, emb); A.box(0.014, 0.025, 0.09, -0.087, -0.15, 0, 0xe8e8e8); if (look.acc === 'lamp') { A.cyl(0.03, 0.11, -0.04, 0.07, -0.05, 0x1a1a1a, { axis: 'z' }); A.cyl(0.025, 0.01, -0.04, 0.07, -0.108, 0xfff2b0, { axis: 'z' }); } }
    if (look.acc === 'knee') A.box(0.2, 0.08, 0.2, 0, -0.29, 0, 0x1f2125);
    if (ex.epaulets) { A.box(0.2, 0.025, 0.12, 0, 0.07, 0, 0xd0a020); for (let i = 0; i < 3; i++) A.box(0.025, 0.03, 0.025, -0.05 + i * 0.05, 0.095, 0, 0xd0a020); }
    if (ex.ghillie) for (let i = 0; i < 8; i++) A.box(0.08, 0.04, 0.08, (rnd() - 0.5) * 0.14, -0.25 + rnd() * 0.25, (rnd() - 0.5) * 0.14, [0x4d5a33, 0x6a6a3a, 0x3a4a28][i % 3]);
    F.box(0.14, 0.27, 0.14, 0, -0.12, 0, U, cl); F.box(0.155, 0.05, 0.155, 0, -0.24, 0, sh(UD, 0.8), cl);
    F.box(0.15, 0.13, 0.17, 0, -0.325, 0, gl); F.box(0.12, 0.03, 0.09, 0, -0.27, -0.035, sh(gl, 0.7)); F.box(0.16, 0.06, 0.1, 0, -0.26, 0.03, sh(gl, 1.2)); // luva com punho e dorso
    for (let i = 0; i < 4; i++) F.box(0.03, 0.06, 0.03, -0.045 + i * 0.03, -0.395, -0.06, sh(gl, 0.85));
    F.box(0.04, 0.07, 0.04, side * 0.075, -0.33, -0.05, sh(gl, 0.9));
    if (look.acc === 'knee') F.box(0.16, 0.06, 0.16, 0, -0.01, 0, 0x1f2125);
    P[side < 0 ? 'armL' : 'armR'] = A.geos(); P[side < 0 ? 'foreL' : 'foreR'] = F.geos();
  }
  // ---------- PERNAS ----------
  for (const side of [-1, 1]) {
    const Th = new PB(camo), Sn = new PB(camo);
    Th.box(0.21, 0.43, 0.23, 0, -0.205, 0, U, cl); Th.box(0.06, 0.15, 0.12, side * 0.125, -0.2, 0, sh(UD, 0.9), cl); Th.box(0.045, 0.08, 0.1, side * 0.147, -0.2, 0, UD); Th.box(0.22, 0.06, 0.24, 0, -0.01, 0, 0x1e1f22);
    if (look.acc === 'knee') Th.box(0.17, 0.1, 0.06, 0, -0.4, -0.13, 0x1f2125);
    Sn.box(0.185, 0.36, 0.2, 0, -0.17, 0, U, cl); Sn.box(0.2, 0.05, 0.215, 0, -0.01, 0, UD, cl);
    if (look.acc === 'knee') Sn.box(0.17, 0.1, 0.06, 0, -0.04, -0.12, 0x1f2125);
    Sn.box(0.2, 0.15, 0.3, 0, -0.355, -0.035, bt); Sn.box(0.215, 0.045, 0.32, 0, -0.41, -0.035, 0x101012); Sn.box(0.12, 0.04, 0.01, 0, -0.33, -0.19, sh(bt, 0.6)); Sn.box(0.15, 0.1, 0.03, 0, -0.3, 0.04, sh(bt, 1.3)); Sn.box(0.2, 0.05, 0.12, 0, -0.29, 0.0, UD, cl);
    P[side < 0 ? 'legL' : 'legR'] = Th.geos(); P[side < 0 ? 'shinL' : 'shinR'] = Sn.geos();
  }
  return P;
}
const pivot = (parent: any, x: number, y: number, z: number) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
export function buildSoldier(look: any, ex: any = {}) {
  const key = JSON.stringify([look, ex.shield, ex.belt, ex.ghillie, ex.coat, ex.epaulets]);
  const G = soldierCache[key] || (soldierCache[key] = makeSoldierGeos(look, ex));
  const cm = look.camo && look.camo !== 'none' ? clothMat(look.camo) : null;
  const attach = (pair: any, parent: any) => { if (pair.gear) { const m = new THREE.Mesh(pair.gear, GEAR); m.castShadow = true; parent.add(m); } if (pair.cloth) { const m = new THREE.Mesh(pair.cloth, cm); m.castShadow = true; parent.add(m); } };
  const root = new THREE.Group(); root.rotation.order = 'YXZ'; const body = pivot(root, 0, 0, 0);
  const torso = pivot(body, 0, 0.85, 0); attach(G.torso, torso);
  const head = pivot(torso, 0, 0.67, 0); attach(G.head, head);
  const shL = pivot(torso, -0.31, 0.58, 0), shR = pivot(torso, 0.31, 0.58, 0); attach(G.armL, shL); attach(G.armR, shR);
  const elL = pivot(shL, 0, -0.29, 0), elR = pivot(shR, 0, -0.29, 0); attach(G.foreL, elL); attach(G.foreR, elR);
  const hipL = pivot(body, -0.125, 0.85, 0), hipR = pivot(body, 0.125, 0.85, 0); attach(G.legL, hipL); attach(G.legR, hipR);
  const kneeL = pivot(hipL, 0, -0.42, 0), kneeR = pivot(hipR, 0, -0.42, 0); attach(G.shinL, kneeL); attach(G.shinR, kneeR);
  const gunMount = pivot(torso, 0.1, 0.47, -0.38);
  if (ex.scale) root.scale.setScalar(ex.scale);
  return { root, body, torso, head, shL, shR, elL, elR, hipL, hipR, kneeL, kneeR, gunMount, gun: null, flash: null, flashT: 0, ph: Math.random() * 6, amp: 0, crouchS: 0, aimS: 0, ex, def: null, recoil: 0 };
}
export function attachGun(rig: any, def: any) {
  if (rig.gun) rig.gunMount.remove(rig.gun);
  if (!def) { rig.gun = null; return; }
  const g = buildGun(def); g.traverse((o: any) => { if (o.isMesh) o.castShadow = true; });
  rig.gunMount.add(g); rig.gun = g; rig.def = def; g.position.z = def.model.pistol ? 0.15 : 0.2;
  const f = makeFlash(def.model.pistol ? 0.3 : 0.45); f.position.copy(g.userData.muz.position); g.add(f); rig.flash = f;
}
export function showFlash(rig: any) { if (rig.flash) { rig.flash.visible = true; rig.flash.rotation.z = Math.random() * 6; rig.flashT = 0.045; } rig.recoil = 1; }
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export function animateSoldier(rig: any, dt: number, s: any) {
  const k = Math.min(1, dt * 10), r = rig;
  r.crouchS += (s.crouch - r.crouchS) * k; r.aimS += (s.aim - r.aimS) * Math.min(1, dt * 7);
  const moving = s.spd > 0.3 ? 1 : 0; r.amp += (moving * Math.min(1, 0.3 + s.spd / 5) - r.amp) * k; r.ph += dt * (moving ? 3 + s.spd * 1.15 : 0);
  r.recoil = Math.max(0, r.recoil - dt * 12); if (r.flashT > 0) { r.flashT -= dt; if (r.flashT <= 0 && r.flash) r.flash.visible = false; }
  const a = r.amp, p = r.ph, c = r.crouchS, air = s.air || 0, aim = r.aimS, rl = s.reload || 0, th = s.throw || 0;
  const cs = Math.cos(p), sn = Math.sin(p);
  r.hipL.rotation.x = sn * 0.85 * a + c * 0.95 - air * 0.4; r.hipR.rotation.x = -sn * 0.85 * a + c * 0.95 - air * 0.1;
  r.kneeL.rotation.x = -(Math.max(0, cs) * 0.95 * a) - c * 1.85 - air * 0.6; r.kneeR.rotation.x = -(Math.max(0, -cs) * 0.95 * a) - c * 1.85 - air * 0.3;
  r.hipL.rotation.z = 0; r.hipR.rotation.z = 0;
  r.body.position.y = -c * 0.35 - Math.abs(sn) * 0.035 * a; r.body.position.x = 0;
  const pitch = s.pitch || 0; r.torso.rotation.x = pitch * 0.35 + a * 0.06 + r.recoil * 0.05 + (s.hurt || 0) * 0.3; r.torso.rotation.y = sn * 0.06 * a; r.head.rotation.x = pitch * 0.55 - rl * 0.3; r.head.rotation.y = s.look || 0;
  // braços segurando a arma: baixo-pronto -> mirando
  const gm = r.gunMount; gm.rotation.x = lerp(-0.55, 0, aim) + r.recoil * 0.05; gm.rotation.z = Math.sin(rl * Math.PI) * 0.45; gm.position.z = -0.38 + r.recoil * 0.05; gm.position.y = 0.47;
  const kick = r.recoil * 0.06;
  r.shR.rotation.set(lerp(0.65, 0.95, aim) + kick, 0, lerp(-0.1, -0.3, aim)); r.elR.rotation.set(lerp(0.9, 0.85, aim), 0, 0);
  if (r.ex.shield) { r.shL.rotation.set(1.3, 0, 0.1); r.elL.rotation.set(0.3, 0, 0); }
  else { r.shL.rotation.set(lerp(0.85, 1.28, aim) + kick - Math.sin(rl * Math.PI) * 0.5, 0, lerp(0.3, 0.42, aim) - Math.sin(rl * Math.PI) * 0.4); r.elL.rotation.set(lerp(0.65, 0.3, aim) + Math.sin(rl * Math.PI) * 1.0, 0, 0); }
  if (s.noGun) { r.shR.rotation.set(-sn * 0.7 * a, 0, 0.08); r.shL.rotation.set(sn * 0.7 * a, 0, -0.08); r.elR.rotation.set(0.2 + a * 0.3, 0, 0); r.elL.rotation.set(0.2 + a * 0.3, 0, 0); }
  if (s.tied) { r.shR.rotation.set(-0.6, 0, -0.2); r.shL.rotation.set(-0.6, 0, 0.2); r.elR.rotation.set(0.3, 0, 0); r.elL.rotation.set(0.3, 0, 0); r.torso.rotation.x += 0.15; }
  if (th > 0) { const t = th; if (t < 0.45) { const u = t / 0.45; r.shR.rotation.set(lerp(0.9, -2.7, u), 0, -0.3); r.elR.rotation.set(lerp(0.8, 1.2, u), 0, 0); } else { const u = (t - 0.45) / 0.55; r.shR.rotation.set(lerp(-2.7, 1.3, u), 0, -0.3); r.elR.rotation.set(lerp(1.2, 0.1, u), 0, 0); r.torso.rotation.x += 0.2 * u; } }
  if (s.dead > 0) {
    const d = Math.min(1, s.dead), sg = s.deathDir || 1;
    r.root.rotation.x = d * (Math.PI / 2) * sg; r.root.position.y = d * 0.14;
    r.shL.rotation.z = lerp(r.shL.rotation.z, -0.9, d); r.shR.rotation.z = lerp(r.shR.rotation.z, 0.9, d); r.hipL.rotation.z = -0.2 * d; r.hipR.rotation.z = 0.2 * d;
    r.shL.rotation.x = lerp(r.shL.rotation.x, -0.3, d); r.shR.rotation.x = lerp(r.shR.rotation.x, 0.4, d); r.elL.rotation.x *= 1 - d * 0.5;
  } else { r.root.rotation.x = 0; r.root.position.y = 0; }
}

// ======================= VEÍCULOS E PROPS =======================
const vehCache: any = {};
function mesh(pb: PB, mat = GEAR) { const g = pb.geos().gear; const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m; }
function wheel(P: PB, x: number, y: number, z: number, r = 0.42, w = 0.32) { P.cyl(r, w, x, y, z, 0x15161a, { axis: 'z', seg: 10 }); P.cyl(r * 0.55, w + 0.02, x, y, z, 0x6a6e75, { axis: 'z', seg: 8 }); }
export function buildVehicle(kind: string, color = 0x56633f) {
  const key = kind + color; let tpl = vehCache[key];
  if (!tpl) {
    const P = new PB(); const D = 0x17181b, GL = 0x1b2a35; let size = [4, 1.8, 1.9]; let turretPB: any = null;
    if (kind === 'jeep') {
      P.box(3.9, 0.55, 1.85, 0, 0.75, 0, color); P.box(1.3, 0.35, 1.8, 1.3, 1.15, 0, sh(color, 1.1)); P.box(0.12, 0.65, 1.6, 0.3, 1.45, 0, GL, { rz: -0.3 }); P.box(1.3, 0.3, 1.7, -0.9, 1.1, 0, sh(color, 0.9)); P.box(0.15, 0.6, 0.15, -0.2, 1.55, 0.8, D); P.box(0.15, 0.6, 0.15, -0.2, 1.55, -0.8, D); P.box(0.1, 0.1, 1.7, -0.2, 1.88, 0, D);
      P.box(0.6, 0.35, 0.5, -1.0, 1.4, 0.5, sh(color, 0.8)); P.box(0.6, 0.35, 0.5, -1.0, 1.4, -0.5, sh(color, 0.8)); P.box(0.3, 0.3, 1.8, 2.0, 0.85, 0, D); P.box(0.1, 0.18, 0.28, 1.97, 1.1, 0.6, 0xfff2b0); P.box(0.1, 0.18, 0.28, 1.97, 1.1, -0.6, 0xfff2b0); wheel(P, 1.3, 0.42, 1.0); wheel(P, 1.3, 0.42, -1.0); wheel(P, -1.2, 0.42, 1.0); wheel(P, -1.2, 0.42, -1.0); P.cyl(0.4, 0.2, -2.05, 1.0, 0, D, { axis: 'x', seg: 10 }); P.box(0.8, 0.1, 0.3, 1.0, 1.35, 0.5, sh(color, 0.7)); size = [4.2, 1.9, 2.0];
    } else if (kind === 'truck') {
      P.box(6.8, 0.5, 2.4, 0, 0.9, 0, D); P.box(2.0, 1.6, 2.4, 2.4, 1.9, 0, color); P.box(0.1, 0.8, 2.1, 3.42, 2.3, 0, GL); P.box(0.5, 0.7, 2.4, 3.6, 1.1, 0, sh(color, 0.8)); P.box(3.9, 2.0, 2.4, -1.4, 2.3, 0, sh(color, 1.15, { cloth: 0 })); for (let i = 0; i < 5; i++) P.box(0.1, 2.1, 2.5, -3.1 + i * 0.85, 2.3, 0, sh(color, 0.8)); P.box(0.15, 0.2, 0.3, 3.7, 1.0, 0.85, 0xfff2b0); P.box(0.15, 0.2, 0.3, 3.7, 1.0, -0.85, 0xfff2b0);
      for (const x of [2.5, -0.6, -2.4]) { wheel(P, x, 0.55, 1.2, 0.55, 0.4); wheel(P, x, 0.55, -1.2, 0.55, 0.4); } size = [7.2, 3.3, 2.6];
    } else if (kind === 'apc') {
      P.box(6.2, 1.1, 2.7, 0, 1.2, 0, color); P.box(2.5, 0.7, 2.6, 1.9, 2.0, 0, sh(color, 1.1), { rz: 0 }); P.box(2.4, 0.9, 2.5, -1.5, 2.1, 0, sh(color, 0.95)); P.box(0.1, 0.35, 1.2, 3.1, 2.1, 0, GL); P.box(1.4, 0.45, 1.7, -0.3, 2.8, 0, sh(color, 0.8)); P.box(0.15, 0.15, 1.5, 0.6, 2.9, 0, D, { ry: 0 }); P.cyl(0.07, 1.6, 1.5, 2.95, 0, D, { axis: 'x' });
      for (const x of [2.2, 0.7, -0.8, -2.3]) { wheel(P, x, 0.65, 1.4, 0.65, 0.45); wheel(P, x, 0.65, -1.4, 0.65, 0.45); } size = [6.4, 3.1, 3.0];
    } else if (kind === 'tank') {
      P.box(7.0, 0.9, 2.2, 0, 1.1, 0, color); P.box(2.0, 0.5, 2.2, 3.0, 1.5, 0, sh(color, 1.1), { rz: -0.4 }); P.box(7.4, 0.9, 0.9, 0, 0.7, 1.35, D); P.box(7.4, 0.9, 0.9, 0, 0.7, -1.35, D); P.box(7.5, 0.25, 1.0, 0, 1.2, 1.35, sh(color, 0.8)); P.box(7.5, 0.25, 1.0, 0, 1.2, -1.35, sh(color, 0.8));
      for (let i = 0; i < 7; i++) { P.cyl(0.4, 0.2, -3 + i, 0.55, 1.4, 0x2a2b2e, { axis: 'z', seg: 8 }); P.cyl(0.4, 0.2, -3 + i, 0.55, -1.4, 0x2a2b2e, { axis: 'z', seg: 8 }); } size = [7.6, 2.9, 3.4];
      turretPB = new PB(); turretPB.box(3.0, 0.9, 2.6, 0, 0.45, 0, sh(color, 1.05)); turretPB.box(1.2, 0.9, 2.3, -1.4, 0.5, 0, sh(color, 0.9)); turretPB.cyl(0.16, 4.6, 3.6, 0.55, 0, D, { axis: 'x' }); turretPB.cyl(0.22, 0.6, 1.7, 0.55, 0, sh(color, 0.8), { axis: 'x' }); turretPB.cyl(0.4, 0.3, 0, 1.0, 0.4, D, { seg: 8 }); turretPB.box(0.5, 0.2, 0.2, 0.0, 1.25, 0.4, D); turretPB.cyl(0.06, 1.2, -1.3, 1.5, 0.9, D, { seg: 4 });
    } else { // carro civil
      P.box(4.3, 0.6, 1.8, 0, 0.7, 0, color); P.box(2.2, 0.55, 1.65, -0.2, 1.25, 0, sh(color, 1.1)); P.box(0.1, 0.5, 1.5, 0.92, 1.25, 0, GL, { rz: -0.35 }); P.box(0.1, 0.45, 1.5, -1.3, 1.25, 0, GL, { rz: 0.35 }); P.box(2.0, 0.45, 1.7, -0.2, 1.25, 0, GL);
      P.box(0.1, 0.18, 0.3, 2.15, 0.85, 0.65, 0xfff2b0); P.box(0.1, 0.18, 0.3, 2.15, 0.85, -0.65, 0xfff2b0); P.box(0.1, 0.18, 0.3, -2.15, 0.85, 0.65, 0xc02020); P.box(0.1, 0.18, 0.3, -2.15, 0.85, -0.65, 0xc02020); wheel(P, 1.35, 0.36, 0.9, 0.36, 0.26); wheel(P, 1.35, 0.36, -0.9, 0.36, 0.26); wheel(P, -1.35, 0.36, 0.9, 0.36, 0.26); wheel(P, -1.35, 0.36, -0.9, 0.36, 0.26); size = [4.4, 1.6, 1.9];
    }
    tpl = vehCache[key] = { body: P.geos().gear, turret: turretPB ? turretPB.geos().gear : null, size };
  }
  const g = new THREE.Group(); const b = new THREE.Mesh(tpl.body, GEAR); b.castShadow = true; b.receiveShadow = true; g.add(b);
  if (tpl.turret) { const t = new THREE.Group(); t.position.y = 1.6; const tm = new THREE.Mesh(tpl.turret, GEAR); tm.castShadow = true; t.add(tm); g.add(t); g.userData.turret = t; }
  g.userData.size = tpl.size; return g;
}
export function buildHeli(enemy = true) {
  const col = enemy ? 0x2e3136 : 0x56633f, st = enemy ? 0xb3262e : 0x2f7fd1; const P = new PB(), R = new PB(), TR = new PB(); const D = 0x17181b;
  P.box(1.9, 1.7, 3.6, 0, 0, 0, col); P.box(1.7, 1.1, 1.6, 0, -0.2, -2.4, col, { rx: 0 }); P.box(1.65, 0.9, 1.2, 0, 0.1, -2.0, 0x1b3040); P.box(1.4, 0.7, 0.9, 0, 0.0, -3.2, sh(col, 0.9)); P.box(0.9, 0.9, 3.2, 0, 0.2, 3.1, col); P.box(0.5, 0.6, 4.2, 0, 0.5, 5.4, col); P.box(0.15, 1.5, 1.2, 0, 1.2, 7.2, col, { rx: -0.3 }); P.box(2.6, 0.12, 0.8, 0, 0.3, 0.4, col); P.box(0.4, 0.4, 1.4, 1.5, 0.0, 0.4, D); P.box(0.4, 0.4, 1.4, -1.5, 0.0, 0.4, D); P.box(1.92, 0.15, 3.0, 0, -0.3, 0.2, st);
  P.box(0.15, 0.15, 3.6, 1.1, -1.35, 0, D); P.box(0.15, 0.15, 3.6, -1.1, -1.35, 0, D); P.box(0.1, 0.8, 0.1, 1.0, -0.95, -1.2, D); P.box(0.1, 0.8, 0.1, -1.0, -0.95, -1.2, D); P.box(0.1, 0.8, 0.1, 1.0, -0.95, 1.2, D); P.box(0.1, 0.8, 0.1, -1.0, -0.95, 1.2, D); P.cyl(0.25, 0.7, 0, 1.2, 0.2, D, { seg: 6 }); P.cyl(0.08, 0.25, 0, 1.0, -3.6, D, { axis: 'z' }); P.box(0.3, 0.3, 0.2, 0, -0.95, -3.0, 0xfff2b0);
  for (let i = 0; i < 4; i++) R.box(0.35, 0.05, 5.2, 0, 0, -2.6, D, { ry: i * Math.PI / 2 }), 0;
  R.box(0.4, 0.12, 0.4, 0, 0, 0, 0x555a60);
  for (let i = 0; i < 2; i++) TR.box(0.05, 0.25, 1.9, 0, 0, 0, D, { rx: i * Math.PI / 2 });
  const g = new THREE.Group(); g.add(mesh(P)); const rot = new THREE.Group(); rot.position.y = 1.55; const rm = new THREE.Mesh(R.geos().gear, GEAR); rot.add(rm); g.add(rot);
  const tr = new THREE.Group(); tr.position.set(0.3, 1.1, 7.2); tr.add(new THREE.Mesh(TR.geos().gear, GEAR)); g.add(tr); g.userData = { rotor: rot, tail: tr, size: [3, 3, 8] }; return g;
}
export function buildPlane() {
  const P = new PB(); const col = 0x7a8088, D = 0x17181b, red = 0xb3262e;
  P.box(14, 1.4, 1.6, 0, 1.9, 0, col); P.box(3, 1.1, 1.2, 8.2, 1.9, 0, col); P.box(2, 0.7, 0.8, 10, 1.9, 0, sh(col, 0.8)); P.cone(0.4, 2.2, 11.8, 1.9, 0, D, { rz: Math.PI / 2 }); P.box(2.6, 0.5, 1.0, 5.4, 2.7, 0, 0x1b3040);
  P.box(4.5, 0.2, 5.6, 0.5, 1.7, 3.2, col, { ry: -0.5 }); P.box(4.5, 0.2, 5.6, 0.5, 1.7, -3.2, col, { ry: 0.5 }); P.box(2.2, 0.15, 2.4, -6, 2.0, 1.3, col, { ry: -0.4 }); P.box(2.2, 0.15, 2.4, -6, 2.0, -1.3, col, { ry: 0.4 }); P.box(2.4, 2.0, 0.15, -5.8, 3.1, 0.6, col, { rz: 0.3 }); P.box(2.4, 2.0, 0.15, -5.8, 3.1, -0.6, col, { rz: 0.3 });
  P.cyl(0.55, 3.4, -6.8, 1.9, 0.55, D, { axis: 'x', seg: 8 }); P.cyl(0.55, 3.4, -6.8, 1.9, -0.55, D, { axis: 'x', seg: 8 }); P.box(5, 0.22, 0.2, 0.5, 1.9, 1.5, red); P.box(5, 0.22, 0.2, 0.5, 1.9, -1.5, red);
  P.box(0.15, 1.1, 0.15, 6, 0.9, 0, D); P.cyl(0.3, 0.2, 6, 0.3, 0, D, { axis: 'z' }); P.box(0.15, 1.0, 0.15, -1.5, 0.9, 1.5, D); P.box(0.15, 1.0, 0.15, -1.5, 0.9, -1.5, D); P.cyl(0.32, 0.25, -1.5, 0.32, 1.5, D, { axis: 'z' }); P.cyl(0.32, 0.25, -1.5, 0.32, -1.5, D, { axis: 'z' });
  const g = new THREE.Group(); g.add(mesh(P)); g.userData.size = [14, 4.4, 9]; return g;
}
export function buildProp(kind: string) {
  const P = new PB(); const D = 0x17181b; let size = [1, 1, 1], hp = 100, name = kind; const g = new THREE.Group(); let extra: any = null;
  if (kind === 'radar') { P.box(1.6, 3.2, 1.6, 0, 1.6, 0, 0x5a5f66); P.box(2.2, 0.4, 2.2, 0, 3.4, 0, D); P.cyl(2.3, 0.5, 0, 4.5, 0, 0xd8dce0, { axis: 'z', seg: 12, rx: 0.0 }); P.cyl(0.1, 1.6, 0, 4.5, 1.0, D, { axis: 'z' }); P.box(0.3, 0.3, 0.3, 0, 4.5, 2.0, 0xff3030); size = [2.4, 6.8, 2.4]; hp = 250; name = 'Radar'; extra = { spin: 1 }; }
  else if (kind === 'fueltank') { P.cyl(2.2, 6, 0, 3, 0, 0xc9ccd0, { seg: 14 }); P.cyl(2.25, 0.4, 0, 5.2, 0, 0xb3262e, { seg: 14 }); P.cyl(2.25, 0.4, 0, 1.0, 0, 0xb3262e, { seg: 14 }); P.box(0.3, 6, 0.1, 2.2, 3, 0, D); P.cyl(0.6, 0.4, 0, 6.2, 0, 0x6a6e75, { seg: 8 }); P.box(1.0, 0.1, 0.6, 0, 6.5, 0, 0xff8a1a); size = [4.5, 6.4, 4.5]; hp = 300; name = 'Tanque'; }
  else if (kind === 'generator') { P.box(3.4, 2.2, 2.0, 0, 1.2, 0, 0x4a5238); P.box(3.6, 0.2, 2.2, 0, 2.4, 0, 0x2a2b2e); P.cyl(0.3, 1.2, 1.0, 3.1, 0.5, D, { seg: 6 }); P.box(1.2, 0.8, 0.1, -0.7, 1.4, 1.02, D); P.box(1.0, 0.6, 0.12, -0.7, 1.4, 1.03, 0x39ff74); P.cyl(0.55, 0.15, 0.9, 1.3, 1.02, 0x3a3f38, { axis: 'z' }); P.cyl(0.55, 0.15, 0.9, 1.3, -1.02, 0x3a3f38, { axis: 'z' }); P.box(3.4, 0.2, 2.3, 0, 0.1, 0, D); size = [3.6, 3.2, 2.4]; hp = 220; name = 'Gerador'; }
  else if (kind === 'aa') { P.box(3.2, 0.5, 3.2, 0, 0.25, 0, 0x4a5238); P.cyl(0.9, 1.2, 0, 1.1, 0, 0x5a6244, { seg: 8 }); size = [3.4, 3.4, 3.4]; hp = 220; name = 'Bateria AA'; extra = { turret: new PB().box(1.8, 1.0, 1.4, 0, 0.5, 0, 0x4a5238).box(0.2, 0.2, 3.6, 0.5, 0.9, -2.2, D, { rx: -0.5 }).box(0.2, 0.2, 3.6, -0.5, 0.9, -2.2, D, { rx: -0.5 }).box(1.0, 0.4, 0.8, 0, 1.2, 0.5, 0x2a2b2e).box(0.8, 0.3, 0.3, 0, 0.7, 1.0, 0xb3262e) }; }
  else if (kind === 'terminal') { P.box(1.8, 0.9, 0.8, 0, 0.45, 0, 0x3a3f46); P.box(1.6, 0.8, 0.1, 0, 1.2, -0.2, D, { rx: -0.2 }); P.box(1.4, 0.6, 0.06, 0, 1.2, -0.26, 0x27c4ff, { rx: -0.2 }); P.box(1.2, 0.08, 0.3, 0, 0.95, 0.15, 0x22252a); P.box(0.3, 0.05, 0.2, 0.5, 1.0, 0.2, 0x7a8088); size = [1.8, 1.8, 0.9]; hp = 99999; name = 'Terminal'; }
  else if (kind === 'docs') { P.box(0.6, 0.3, 0.45, 0, 0.15, 0, 0x6b4a2b); P.box(0.64, 0.05, 0.1, 0, 0.3, 0, D); P.box(0.18, 0.04, 0.08, 0, 0.33, 0, 0xd0a020); P.box(0.4, 0.05, 0.3, 0.0, 0.34, 0.0, 0xe8e0c0, { ry: 0.3 }); size = [0.7, 0.4, 0.5]; hp = 99999; name = 'Documentos'; }
  else if (kind === 'core') { P.cyl(2.0, 0.4, 0, 0.2, 0, 0x2a2b2e, { seg: 10 }); P.cyl(1.0, 3.6, 0, 2.2, 0, 0xff5a1a, { seg: 10 }); P.cyl(1.4, 0.3, 0, 0.7, 0, 0x4a4d52, { seg: 10 }); P.cyl(1.4, 0.3, 0, 3.7, 0, 0x4a4d52, { seg: 10 }); for (let i = 0; i < 4; i++) P.box(0.2, 4, 0.2, Math.cos(i * 1.57) * 1.6, 2.2, Math.sin(i * 1.57) * 1.6, 0x4a4d52); size = [3.6, 4.4, 3.6]; hp = 500; name = 'Núcleo'; }
  else if (kind === 'ammo') { P.box(0.8, 0.45, 0.5, 0, 0.225, 0, 0x4a5236); P.box(0.82, 0.06, 0.3, 0, 0.3, 0, 0xe8e8e8); P.box(0.1, 0.1, 0.52, 0.2, 0.5, 0, 0x2a2b2e); size = [0.8, 0.5, 0.5]; name = 'Munição'; }
  else if (kind === 'medbox') { P.box(0.7, 0.45, 0.5, 0, 0.225, 0, 0xe8ecef); P.box(0.3, 0.06, 0.52, 0, 0.225, 0, 0xcc2222); P.box(0.06, 0.3, 0.52, 0, 0.225, 0, 0xcc2222); size = [0.7, 0.5, 0.5]; name = 'Kit Médico'; }
  else if (kind === 'barrel') { P.cyl(0.32, 0.95, 0, 0.475, 0, 0xb3262e, { seg: 10 }); P.cyl(0.335, 0.08, 0, 0.2, 0, 0x7a1a1a, { seg: 10 }); P.cyl(0.335, 0.08, 0, 0.75, 0, 0x7a1a1a, { seg: 10 }); P.box(0.3, 0.3, 0.02, 0, 0.5, 0.33, 0xffd23f); size = [0.7, 1.0, 0.7]; hp = 40; name = 'Barril explosivo'; }
  else if (kind === 'bomb') { P.box(0.6, 0.3, 0.4, 0, 0.15, 0, 0x4a5236); P.box(0.3, 0.1, 0.2, 0, 0.35, 0, D); P.box(0.22, 0.06, 0.12, 0, 0.4, 0, 0xff2a2a); P.cyl(0.07, 0.3, 0.2, 0.3, 0, 0x7a6a3a, { seg: 6 }); P.cyl(0.07, 0.3, -0.2, 0.3, 0, 0x7a6a3a, { seg: 6 }); size = [0.7, 0.5, 0.5]; name = 'Bomba'; }
  else if (kind === 'c4') { P.box(0.4, 0.15, 0.25, 0, 0.075, 0, 0xd8d4c0); P.box(0.1, 0.06, 0.1, 0, 0.18, 0, 0xff2a2a); size = [0.4, 0.2, 0.25]; name = 'C4'; }
  else if (kind === 'target') { P.box(0.08, 1.1, 0.08, 0, 0.55, 0, 0x5a5f66); P.box(0.8, 1.1, 0.06, 0, 1.45, 0, 0xe6e0c8); P.cyl(0.33, 0.07, 0, 1.55, 0.0, 0xc23a3a, { axis: 'z', seg: 12 }); P.cyl(0.22, 0.08, 0, 1.55, 0.0, 0xe6e0c8, { axis: 'z', seg: 12 }); P.cyl(0.11, 0.09, 0, 1.55, 0.0, 0xc23a3a, { axis: 'z', seg: 12 }); P.box(0.3, 0.3, 0.07, 0, 1.12, 0, 0x2a2b2e); size = [0.9, 2.0, 0.2]; hp = 1; name = 'Alvo'; }
  else if (kind === 'tent') { P.box(4, 0.15, 4, 0, 0.07, 0, 0x4a4235); P.box(4, 1.8, 0.1, 0, 1.3, 1.5, 0x6a6a3a, { rx: 0.7 }); P.box(4, 1.8, 0.1, 0, 1.3, -1.5, 0x6a6a3a, { rx: -0.7 }); P.box(4, 0.1, 0.1, 0, 2.2, 0, 0x2a2b2e); size = [4, 2.3, 4]; }
  g.add(mesh(P)); if (extra?.turret) { const t = new THREE.Group(); t.position.y = 1.7; t.add(mesh(extra.turret)); g.add(t); g.userData.turret = t; }
  g.userData.size = size; g.userData.hp = hp; g.userData.pname = name; if (extra?.spin) g.userData.spin = true; return g;
}
