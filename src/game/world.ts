// @ts-nocheck
// ============ MUNDO: geração procedural de mapas, instancing, colisão, navegação ============
import * as THREE from 'three';
import { buildVehicle, buildPlane } from './models';

export const ZL = 46; // comprimento de cada zona
export const WID = 92; // largura do mapa
function mulberry(a: number) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export const THEMES: any = {
  base: { name: 'Base Militar', ground: 0x6d7658, wall: [0x8a8d84, 0x777a72, 0x9a9a8e], roof: 0x4a4d52, kinds: ['field', 'compound', 'compound', 'field'], border: 'fence', surf: 'concrete', trees: 0.3, cover: ['crate', 'sandbag', 'barrier', 'barrel', 'jeep', 'tent'], accent: 0x4a5238, mount: 0x6a7a80 },
  village: { name: 'Vila', ground: 0x7d8b5a, wall: [0xd8c9a8, 0xc9b48c, 0xbfa57a, 0xe0d5b8], roof: 0x9a4a30, kinds: ['town', 'field', 'town', 'compound'], border: 'trees', surf: 'dirt', trees: 0.8, cover: ['crate', 'sandbag', 'barrel', 'hay', 'car'], accent: 0x8a6a3a, mount: 0x5a7a6a, ruin: 0.25 },
  forest: { name: 'Floresta', ground: 0x4f6b3a, wall: [0x6b5a3a, 0x5a4a30], roof: 0x3a3020, kinds: ['field', 'field', 'compound', 'field'], border: 'trees', surf: 'grass', trees: 3.2, cover: ['rock', 'log', 'crate', 'sandbag', 'tent'], accent: 0x3a5a2a, mount: 0x3a5a4a, amb: 'forest' },
  road: { name: 'Estrada', ground: 0x8a8660, wall: [0xa89c8a, 0x8a8a7a], roof: 0x5a4a3a, kinds: ['field', 'town', 'field', 'compound'], border: 'trees', surf: 'dirt', trees: 1.3, cover: ['car', 'barrier', 'sandbag', 'rock', 'barrel', 'jeep'], accent: 0x6a6a5a, mount: 0x6a7a7a, road: 1 },
  mountains: { name: 'Montanhas', ground: 0xd9e1e6, wall: [0x8a8d92, 0x6f7378], roof: 0x4a4d52, kinds: ['field', 'compound'], border: 'cliff', surf: 'dirt', trees: 1.0, snowy: 1, cover: ['rock', 'sandbag', 'crate', 'barrier', 'tent'], accent: 0x7a7e84, mount: 0xb8c4cc },
  factory: { name: 'Fábrica', ground: 0x5a5d60, wall: [0x7c8086, 0x6b6f75, 0x8a8d92], roof: 0x3a3d42, kinds: ['hall', 'compound', 'hall', 'hall'], border: 'wall', surf: 'metal', trees: 0, cover: ['crate', 'barrel', 'barrier', 'container'], accent: 0xd0a020, mount: 0x5a6a70, indoor: 1 },
  port: { name: 'Porto', ground: 0x6a6f73, wall: [0x8a8f94, 0x7a7f84, 0x9a8f80], roof: 0x4a5058, kinds: ['field', 'compound', 'town', 'field'], border: 'water', surf: 'concrete', trees: 0, cover: ['container', 'crate', 'barrel', 'barrier', 'container'], accent: 0xb3562e, mount: 0x5a7080 },
  city: { name: 'Cidade em Ruínas', ground: 0x5d5f62, wall: [0x9a948a, 0x8a8a8c, 0xa89c8a, 0x7a7a80], roof: 0x4a4a50, kinds: ['town', 'town', 'compound', 'town', 'town'], border: 'wall', surf: 'concrete', trees: 0.3, cover: ['car', 'barrier', 'sandbag', 'rubble', 'crate', 'barrel'], accent: 0x7a7a7a, mount: 0x6a7080, ruin: 0.5, road: 1, tall: 1 },
  nightcity: { name: 'Distrito Neon', ground: 0x2c2e33, wall: [0x4a4c55, 0x3a3c44, 0x55505a], roof: 0x24262c, kinds: ['town', 'town', 'compound', 'town'], border: 'wall', surf: 'concrete', trees: 0.2, cover: ['car', 'barrier', 'rubble', 'crate', 'barrel', 'sandbag'], accent: 0xff3a8a, mount: 0x2a3040, ruin: 0.25, road: 1, tall: 1, neon: 1 },
  bunker: { name: 'Bunker Subterrâneo', ground: 0x44474a, wall: [0x5e6164, 0x6b6e70, 0x54575a], roof: 0x2a2c2f, kinds: ['hall', 'hall', 'hall'], border: 'wall', surf: 'metal', trees: 0, cover: ['crate', 'barrel', 'barrier', 'sandbag'], accent: 0xd0a020, mount: 0x333, indoor: 1, allHall: 1 },
  desert: { name: 'Deserto', ground: 0xc9a878, wall: [0xd8bf94, 0xc7aa7c, 0xe0cfa8], roof: 0xb8956a, kinds: ['town', 'field', 'compound', 'field', 'town'], border: 'cliff', surf: 'dirt', trees: 0, cover: ['rock', 'crate', 'sandbag', 'jeep', 'tent', 'barrel'], accent: 0xb8956a, mount: 0xc0966a, ruin: 0.2, sand: 1 },
  airport: { name: 'Aeroporto', ground: 0x7d8184, wall: [0x9a9ea2, 0x8a8e92, 0xa0a4a8], roof: 0x5a5e62, kinds: ['compound', 'field', 'town', 'field', 'compound'], border: 'fence', surf: 'concrete', trees: 0.2, cover: ['crate', 'barrier', 'jeep', 'container', 'barrel', 'sandbag'], accent: 0xd0a020, mount: 0x6a7a8a, runway: 1 },
  industrial: { name: 'Complexo Industrial', ground: 0x55575a, wall: [0x6a6d72, 0x5a5d62, 0x7a7d82], roof: 0x2e3034, kinds: ['compound', 'hall', 'compound', 'field', 'hall', 'compound'], border: 'wall', surf: 'metal', trees: 0, cover: ['tank', 'container', 'crate', 'barrel', 'barrier', 'sandbag'], accent: 0xb3262e, mount: 0x4a5058, stacks: 1 },
};
export const TIMES: any = {
  day: { top: 0x3f86d6, hor: 0xbcd8ee, fog: 0xb6cfe4, sun: 0xfff1d6, si: 2.6, dir: [0.5, 0.85, 0.35], hs: 0xbfd8ff, hg: 0x55554a, hi: 1.0, exp: 1.0 },
  dusk: { top: 0x2f4a78, hor: 0xf0a060, fog: 0xb98660, sun: 0xffa860, si: 2.0, dir: [0.85, 0.4, 0.2], hs: 0xa8b4d0, hg: 0x4a3a30, hi: 0.75, exp: 1.0 },
  night: { top: 0x04070d, hor: 0x142238, fog: 0x0a1424, sun: 0x7090d0, si: 0.7, dir: [-0.3, 0.8, 0.4], hs: 0x4a5c88, hg: 0x14181f, hi: 0.75, exp: 1.15 },
};

const pick = (r: any, a: any[]) => a[Math.floor(r() * a.length)];
const WOOD = [0x8a6a3a, 0x7a5a30, 0x6b5a3a, 0x9a7a45], OLIVE = [0x4a5236, 0x56603f, 0x3f4830], METALC = [0x5a5f66, 0x6a6e75, 0x4a4f56];
const CONT = [0xa83c2a, 0x2a5a8a, 0x3a7a4a, 0xc9a02a, 0x6a6e75, 0x8a4a2a];

export class World {
  th: any; tm: any; rng: any; group: any; B: any[] = []; Cy: any[] = []; Co: any[] = []; Gl: any[] = [];
  cols: any[] = []; zones: any[] = []; dyn: any[] = []; lamps: any[] = []; fires: any[] = []; expBarrels: any[] = []; occ: any[] = [];
  len: number; nz: number; grid: any = new Map(); stamp = 0; nav: any; env: any; statics: any[] = []; surf: string; hallZones: any = {};
  constructor(themeId: string, o: any = {}) {
    this.th = THEMES[themeId] || THEMES.base; this.tm = TIMES[o.time || 'day']; this.rng = mulberry(o.seed || 1234); this.nz = o.zones ?? 3; this.themeId = themeId; this.timeId = o.time || 'day'; this.weather = o.weather || 'clear';
    this.len = o.len || this.nz * ZL + 44; this.group = new THREE.Group(); this.surf = this.th.surf;
    this.buildGround(); if (!o.noZones) this.generate(o);
    if (o.build) o.build(this);
    this.finalize(o);
  }
  r() { return this.rng(); }
  rr(a: number, b: number) { return a + this.rng() * (b - a); }
  // ---------- primitivas ----------
  addCol(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat = 'concrete', ref: any = null) { const c = { x0, y0, z0, x1, y1, z1, mat, live: true, ref, st: 0 }; this.cols.push(c); return c; }
  box(cx: number, by: number, cz: number, w: number, h: number, d: number, color: number, o: any = {}) {
    this.B.push({ x: cx, y: by + h / 2, z: cz, w, h, d, c: color, ry: o.ry || 0, rz: o.rz || 0, rx: o.rx || 0 });
    if (o.col !== false && !o.ry && !o.rz && !o.rx) return this.addCol(cx - w / 2, by, cz - d / 2, cx + w / 2, by + h, cz + d / 2, o.mat || 'concrete');
    return null;
  }
  cyl(cx: number, by: number, cz: number, r: number, h: number, color: number, o: any = {}) { this.Cy.push({ x: cx, y: by + h / 2, z: cz, w: r, h, c: color, rz: o.rz || 0 }); if (o.col !== false) this.addCol(cx - r * 0.85, by, cz - r * 0.85, cx + r * 0.85, by + h, cz + r * 0.85, o.mat || 'metal'); }
  cone(cx: number, by: number, cz: number, r: number, h: number, color: number) { this.Co.push({ x: cx, y: by + h / 2, z: cz, w: r, h, c: color }); }
  glow(cx: number, by: number, cz: number, w: number, h: number, d: number, color: number) { this.Gl.push({ x: cx, y: by + h / 2, z: cz, w, h, d, c: color }); }
  wallLine(ax: string, fixed: number, a0: number, a1: number, y0: number, h: number, t: number, color: number, ops: any[] = [], o: any = {}) {
    const place = (s0: number, s1: number, by: number, hh: number, c = color) => { if (s1 - s0 < 0.05 || hh < 0.05) return; const mid = (s0 + s1) / 2, len = s1 - s0; if (ax === 'x') this.box(mid, by, fixed, len, hh, t, c, o); else this.box(fixed, by, mid, t, hh, len, c, o); };
    const solid = (s: number, e: number) => { if (!o.ruin) { place(s, e, y0, h); return; } let p = s; while (p < e - 0.05) { const L = Math.min(e - p, this.rr(1.2, 3)); const q = this.r(); if (q < o.ruin * 0.3) { /* buraco */ } else if (q < o.ruin) place(p, p + L, y0, h * this.rr(0.3, 0.85)); else place(p, p + L, y0, h); p += L; } };
    let cur = a0; for (const op of [...ops].sort((p, q) => p.c - q.c)) { const s0 = op.c - op.w / 2, s1 = op.c + op.w / 2; solid(cur, s0); place(s0, s1, y0, op.y0 - y0); place(s0, s1, op.y1, y0 + h - op.y1); cur = s1; }
    solid(cur, a1);
  }
  // ---------- chão e atmosfera ----------
  buildGround() {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!; const base = new THREE.Color(this.th.ground);
    for (let i = 0; i < 128; i += 4) for (let j = 0; j < 128; j += 4) { const v = 0.88 + Math.random() * 0.24; x.fillStyle = `rgb(${Math.min(255, base.r * 255 * v) | 0},${Math.min(255, base.g * 255 * v) | 0},${Math.min(255, base.b * 255 * v) | 0})`; x.fillRect(i, j, 4, 4); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set((this.len + 600) / 8, (WID + 600) / 8);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(this.len + 600, WID + 600), new THREE.MeshStandardMaterial({ map: t, roughness: 1, metalness: 0 })); g.rotation.x = -Math.PI / 2; g.position.set(this.len / 2, 0, 0); g.receiveShadow = true; this.group.add(g); this.groundMesh = g;
  }
  setupEnv(scene: any, renderer: any, dist: number) {
    const tm = this.tm, th = this.th; const wx = this.weather;
    const fogC = new THREE.Color(wx === 'sand' ? 0xc9a878 : wx === 'snow' ? 0xcfd8de : wx === 'rain' ? sh2(tm.fog, 0.7) : tm.fog);
    const dens = { clear: 0.9, fog: 0.28, rain: 0.5, snow: 0.45, sand: 0.35 }[wx] || 0.9;
    scene.background = new THREE.Color(tm.hor); this.fogDens = dens; scene.fog = new THREE.Fog(fogC, 8, (dist * 1.4 + 80) * dens);
    // domo do céu
    const sg = new THREE.SphereGeometry(900, 16, 10); const cols = []; const top = new THREE.Color(tm.top), hor = new THREE.Color(wx === 'clear' ? tm.hor : fogC);
    for (let i = 0; i < sg.attributes.position.count; i++) { const y = sg.attributes.position.getY(i) / 900; const k = Math.pow(Math.max(0, y), 0.6); const cc = hor.clone().lerp(top, k); cols.push(cc.r, cc.g, cc.b); }
    sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); const sky = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })); sky.renderOrder = -10; scene.add(sky);
    if (this.timeId === 'night') { const sp = []; for (let i = 0; i < 500; i++) { const a = Math.random() * 6.28, b = Math.random() * 1.4; sp.push(Math.cos(a) * Math.cos(b) * 850, Math.sin(b) * 850 + 20, Math.sin(a) * Math.cos(b) * 850); } const sgm = new THREE.BufferGeometry(); sgm.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); const st = new THREE.Points(sgm, new THREE.PointsMaterial({ color: 0xffffff, size: 2.4, fog: false, sizeAttenuation: false })); scene.add(st); sky.userData.stars = st; }
    // nuvens de blocos
    const cl = new THREE.Group(); if (wx !== 'fog') for (let i = 0; i < 14; i++) { const cg = new THREE.Group(); const n = 3 + Math.floor(this.r() * 4); for (let j = 0; j < n; j++) { const m = new THREE.Mesh(new THREE.BoxGeometry(this.rr(30, 60), this.rr(8, 14), this.rr(20, 40)), new THREE.MeshBasicMaterial({ color: this.timeId === 'night' ? 0x1a2438 : this.timeId === 'dusk' ? 0xe8a888 : 0xffffff, transparent: true, opacity: 0.85, fog: false })); m.position.set(j * 35 - n * 17, this.rr(-3, 3), this.rr(-10, 10)); cg.add(m); } cg.position.set(this.rr(-300, this.len + 300), this.rr(130, 190), this.rr(-400, 400)); cl.add(cg); } scene.add(cl);
    const hemi = new THREE.HemisphereLight(tm.hs, tm.hg, tm.hi * (th.indoor ? 1.15 : 1)); scene.add(hemi);
    const sun = new THREE.DirectionalLight(tm.sun, tm.si); sun.position.set(...tm.dir.map((v: number) => v * 120)); sun.castShadow = true; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.05; scene.add(sun, sun.target);
    this.env = { sky, hemi, sun, clouds: cl, fogC }; renderer.toneMappingExposure = tm.exp; return this.env;
  }
  // ---------- geração ----------
  generate(o: any) {
    const th = this.th;
    // áreas de início e extração
    this.stageArea(10, 0, 1); this.stageArea(this.len - 12, 0, -1);
    for (let i = 0; i < this.nz; i++) {
      const kind = o.kinds ? o.kinds[i % o.kinds.length] : th.kinds[i % th.kinds.length]; const z = { i, x0: 22 + i * ZL, x1: 22 + (i + 1) * ZL, cx: 22 + i * ZL + ZL / 2, cz: 0, kind, enemies: [] }; this.zones.push(z);
      this.occ.push({ x0: z.x0 - 2, x1: z.x0 + 2, z0: -4, z1: 4 }); // não bloquear a entrada
      if (kind === 'town') this.genTown(z); else if (kind === 'field') this.genField(z); else if (kind === 'compound') this.genCompound(z); else this.genHall(z);
    }
    this.genBorder(); this.genScenery();
  }
  stageArea(x: number, z: number, dir: number) {
    const th = this.th; this.box(x + dir * 6, 0, z - 10, 6, 1.1, 0.5, 0x8a8f84, { mat: 'concrete' }); this.crate(x + dir * 4, z + 9, 1.2); this.crate(x + dir * 4, z + 10.3, 1.2);
    this.sandbag(x + dir * 7, z + 7, 6, 'z'); this.sandbag(x + dir * 7, z - 7, 6, 'z'); this.vehicle('jeep', x - dir * 2, z - 12, 0, th.accent); this.lamp(x + dir * 2, z + 12); this.lamp(x + dir * 2, z - 12);
    this.box(x - dir * 5, 0, z + 14, 4, 2.2, 3, 0x6a6a5a, { mat: 'wood' });
    if (dir < 0) { this.glow(x, 0, z, 3.2, 0.1, 3.2, 0x39ff74); this.glow(x, 0.1, z, 0.25, 12, 0.25, 0x39ff74); }
  }
  free(x: number, z: number, r: number, y0 = 0.3, y1 = 1.8) {
    if (x < 1 || x > this.len - 1 || z < -WID / 2 + 1 || z > WID / 2 - 1) return false;
    for (const c of this.cols) { if (!c.live || c.y1 < y0 || c.y0 > y1) continue; if (x > c.x0 - r && x < c.x1 + r && z > c.z0 - r && z < c.z1 + r) return false; } return true;
  }
  spot(z: any, w: number, d: number, tries = 60, margin = 1.5, zr: any = null) {
    for (let k = 0; k < tries; k++) {
      const x = this.rr(z.x0 + 3 + w / 2, z.x1 - 3 - w / 2), zz = zr ? this.rr(zr[0], zr[1]) : this.rr(-WID / 2 + 4 + d / 2, WID / 2 - 4 - d / 2);
      const R = { x0: x - w / 2 - margin, x1: x + w / 2 + margin, z0: zz - d / 2 - margin, z1: zz + d / 2 + margin };
      if (this.occ.some((q: any) => R.x0 < q.x1 && R.x1 > q.x0 && R.z0 < q.z1 && R.z1 > q.z0)) continue;
      this.occ.push({ x0: x - w / 2, x1: x + w / 2, z0: zz - d / 2, z1: zz + d / 2 }); return [x, zz];
    } return null;
  }
  crate(x: number, z: number, s = 1.2, o: any = {}) {
    const c = pick(this.r.bind(this), o.pal || WOOD); this.box(x, 0, z, s, s, s, c, { mat: 'wood', ...o }); this.box(x, s * 0.45, z, s + 0.04, 0.08, s + 0.04, sh2(c, 0.7), { col: false }); this.box(x, 0, z, s + 0.04, 0.08, s + 0.04, sh2(c, 0.7), { col: false }); this.box(x, 0, z, 0.1, s + 0.02, s + 0.02, sh2(c, 0.75), { col: false });
  }
  crateStack(x: number, z: number) { const n = 1 + Math.floor(this.r() * 3); for (let i = 0; i < n; i++) { const s = this.rr(0.9, 1.4); this.crate(x + this.rr(-1, 1) * i, z + this.rr(-0.4, 1.6) * i, s, { pal: this.r() < 0.5 ? WOOD : OLIVE }); } if (this.r() < 0.4) this.box(x, 1.2, z, 1.0, 0.9, 1.0, pick(this.r.bind(this), OLIVE), { mat: 'wood' }); }
  sandbag(x: number, z: number, len: number, ax = 'x') {
    const n = Math.max(2, Math.floor(len / 0.9)); const w = ax === 'x' ? len : 0.7, d = ax === 'x' ? 0.7 : len; this.addCol(x - w / 2, 0, z - d / 2, x + w / 2, 1.25, z + d / 2, 'dirt');
    for (let L = 0; L < 3; L++) for (let i = 0; i < n - (L % 2); i++) { const o = -len / 2 + (i + 0.5 + (L % 2) * 0.5) * (len / n); const bx = ax === 'x' ? x + o : x, bz = ax === 'x' ? z : z + o; this.B.push({ x: bx, y: 0.2 + L * 0.4, z: bz, w: ax === 'x' ? len / n * 0.96 : 0.7, h: 0.38, d: ax === 'x' ? 0.7 : len / n * 0.96, c: pick(this.r.bind(this), [0xa89868, 0x9a8a5c, 0xb0a070, 0x8f8f64]), ry: 0, rz: 0, rx: 0 }); }
  }
  barrier(x: number, z: number, ax = 'x') { const w = ax === 'x' ? 3 : 0.7, d = ax === 'x' ? 0.7 : 3; this.addCol(x - w / 2, 0, z - d / 2, x + w / 2, 1.0, z + d / 2); this.B.push({ x, y: 0.2, z, w, h: 0.4, d, c: 0x9a9a98, ry: 0, rz: 0, rx: 0 }, { x, y: 0.65, z, w: ax === 'x' ? 3 : 0.35, h: 0.5, d: ax === 'x' ? 0.35 : 3, c: 0x8a8a88, ry: 0, rz: 0, rx: 0 }); this.glow(x, 0.45, z + (ax === 'x' ? 0.36 : 0), ax === 'x' ? 2.6 : 0.02, 0.12, ax === 'x' ? 0.02 : 2.6, 0xd0a020); }
  barrelS(x: number, z: number) { const c = pick(this.r.bind(this), [0x4a5236, 0x6a6e75, 0x2a5a8a, 0x8a4a2a]); this.cyl(x, 0, z, 0.32, 0.95, c, { mat: 'metal' }); this.cyl(x, 0.2, z, 0.335, 0.06, sh2(c, 0.7), { col: false }); this.cyl(x, 0.7, z, 0.335, 0.06, sh2(c, 0.7), { col: false }); }
  expBarrel(x: number, z: number) { this.expBarrels.push({ x, z }); }
  container(x: number, z: number, ax = 'x', stack = 1) { const c = pick(this.r.bind(this), CONT); const w = ax === 'x' ? 6.1 : 2.45, d = ax === 'x' ? 2.45 : 6.1; for (let s = 0; s < stack; s++) { const cc = s ? pick(this.r.bind(this), CONT) : c; this.box(x, s * 2.6, z, w, 2.6, d, cc, { mat: 'metal' }); for (let i = -2; i <= 2; i++) { if (ax === 'x') this.box(x + i * 1.2, s * 2.6, z + 1.24, 0.12, 2.6, 0.06, sh2(cc, 0.75), { col: false }), this.box(x + i * 1.2, s * 2.6, z - 1.24, 0.12, 2.6, 0.06, sh2(cc, 0.75), { col: false }); else this.box(x + 1.24, s * 2.6, z + i * 1.2, 0.06, 2.6, 0.12, sh2(cc, 0.75), { col: false }), this.box(x - 1.24, s * 2.6, z + i * 1.2, 0.06, 2.6, 0.12, sh2(cc, 0.75), { col: false }); } } }
  tree(x: number, z: number, big = 1) {
    const sn = this.th.snowy; this.box(x, 0, z, 0.5 * big, 7 * big, 0.5 * big, 0x5a4028, { mat: 'wood' }); const gc = sn ? [0xe8f0f4, 0xdce6ec] : this.th.sand ? [0x6a7a3a] : [0x2f5a2a, 0x3a6a30, 0x2a4f28];
    for (let i = 0; i < 3; i++) this.cone(x, 2.4 * big + i * 1.9 * big, z, (2.2 - i * 0.55) * big, 2.8 * big, gc[i % gc.length]);
  }
  rock(x: number, z: number, s = 1.6) { const c = this.th.snowy ? 0xb0b8bd : this.th.sand ? 0xa88a62 : 0x7a7e80; this.B.push({ x, y: s * 0.35, z, w: s * 1.5, h: s * 0.7, d: s * 1.3, c: sh2(c, this.rr(0.85, 1.1)), ry: this.rr(0, 3), rz: 0, rx: 0 }); this.B.push({ x: x + s * 0.2, y: s * 0.8, z: z - s * 0.1, w: s * 0.9, h: s * 0.7, d: s * 0.8, c, ry: this.rr(0, 3), rz: 0.1, rx: 0.1 }); this.addCol(x - s * 0.7, 0, z - s * 0.6, x + s * 0.7, s * 1.1, z + s * 0.6, 'concrete'); }
  lamp(x: number, z: number, h = 6) { this.cyl(x, 0, z, 0.1, h, 0x3a3d42, { col: false }); this.box(x, 0, z, 0.3, 0.3, 0.3, 0x3a3d42, { col: true }); this.box(x + 0.6, h, z, 1.3, 0.12, 0.3, 0x3a3d42, { col: false }); this.glow(x + 1.1, h - 0.1, z, 0.5, 0.1, 0.25, 0xfff0c0); this.lamps.push({ x: x + 1.1, y: h - 0.5, z }); }
  vehicle(kind: string, x: number, z: number, ry: number, color: number, burnt = false) {
    const g = buildVehicle(kind, burnt ? 0x2a2a2a : color); g.position.set(x, 0, z); g.rotation.y = ry; this.group.add(g); const s = g.userData.size; const q = Math.abs(Math.sin(ry)) > 0.7; const hw = (q ? s[2] : s[0]) / 2, hd = (q ? s[0] : s[2]) / 2;
    this.addCol(x - hw, 0, z - hd, x + hw, s[1], z + hd, 'metal'); if (burnt) this.fires.push({ x, y: s[1], z }); return g;
  }
  hangar(x: number, z: number) { const w = 30, d = 26, h = 9; this.wallLine('x', z - d / 2, x - w / 2, x + w / 2, 0, h, 0.5, 0x8a8e92); this.wallLine('z', x - w / 2, z - d / 2, z + d / 2, 0, h, 0.5, 0x7a7e82); this.wallLine('z', x + w / 2, z - d / 2, z + d / 2, 0, h, 0.5, 0x7a7e82); this.box(x, h, z, w + 1, 0.6, d + 1, 0x5a5e62); for (let i = -2; i <= 2; i++) this.glow(x + i * 5, h - 0.2, z, 0.5, 0.1, 18, 0xfff0d0), this.lamps.push({ x: x + i * 6, y: h - 1, z }); const p = buildPlane(); p.position.set(x, 0, z); p.rotation.y = Math.PI / 2; this.group.add(p); this.addCol(x - 5, 0, z - 7, x + 5, 4, z + 7, 'metal'); this.crate(x - 12, z + 9, 1.4); this.crate(x + 12, z - 9, 1.4); }
  // ---------- prédio ----------
  building(cx: number, cz: number, w: number, d: number, o: any = {}) {
    const th = this.th, h = o.h || 3.4, t = 0.32, col = o.color || pick(this.r.bind(this), th.wall), ruin = o.ruin ?? th.ruin ?? 0, x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    const floors = o.floors || 1; const roofC = o.roof || th.roof;
    const sides: any = { n: ['x', z0, x0, x1], s: ['x', z1, x0, x1], w: ['z', x0, z0, z1], e: ['z', x1, z0, z1] }; const doorSides = o.doors || [pick(this.r.bind(this), ['n', 's']), this.r() < 0.5 ? pick(this.r.bind(this), ['w', 'e']) : null].filter(Boolean);
    this.box(cx, 0, cz, w - 0.2, 0.04, d - 0.2, sh2(col, 0.55), { col: false });
    for (const k in sides) {
      const [ax, fixed, a0, a1] = sides[k]; const len = a1 - a0; const ops: any[] = []; const dc = (a0 + a1) / 2 + this.rr(-len * 0.2, len * 0.2);
      if (doorSides.includes(k)) ops.push({ c: dc, w: 2.4, y0: 0, y1: 2.7 });
      const nw = Math.max(1, Math.floor(len / 4.2)); for (let j = 0; j < nw; j++) { const c = a0 + (j + 0.5) * len / nw; if (doorSides.includes(k) && Math.abs(c - dc) < 2.6) continue; if (c < a0 + 1.4 || c > a1 - 1.4) continue; ops.push({ c, w: 1.5, y0: 1.1, y1: 2.3 }); }
      this.wallLine(ax, fixed, a0 - t / 2, a1 + t / 2, 0, h, t, col, ops, { ruin, mat: o.mat || 'concrete' });
      if (floors > 1) { for (let f = 1; f < floors; f++) { this.wallLine(ax, fixed, a0 - t / 2, a1 + t / 2, h * f, h, t, sh2(col, 0.95 - f * 0.03), [], { ruin: ruin * 0.7 }); for (const op of ops) if (op.y0 > 0 && this.r() < 0.9) { if (ax === 'x') this.glow(op.c, h * f + 1.1, fixed + (k === 's' ? 1 : -1) * (t / 2 + 0.02), 1.4, 1.1, 0.03, th.neon && this.r() < 0.4 ? pick(this.r.bind(this), [0xff3a8a, 0x3ab0ff, 0xffd23a]) : 0x1b2a35); else this.glow(fixed + (k === 'e' ? 1 : -1) * (t / 2 + 0.02), h * f + 1.1, op.c, 0.03, 1.1, 1.4, 0x1b2a35); } } }
      for (const op of ops) if (op.y0 > 0) { if (ax === 'x') this.box(op.c, 1.1, fixed, 1.7, 0.08, t + 0.18, sh2(col, 0.8), { col: false }); else this.box(fixed, 1.1, op.c, t + 0.18, 0.08, 1.7, sh2(col, 0.8), { col: false }); }
      else { if (ax === 'x') { this.box(op.c - 1.25, 0, fixed, 0.12, 2.8, t + 0.12, 0x3a2e22, { col: false }); this.box(op.c + 1.25, 0, fixed, 0.12, 2.8, t + 0.12, 0x3a2e22, { col: false }); this.box(op.c + 1.0, 0, fixed + 0.6, 0.08, 2.5, 1.0, 0x6a5a40, { col: false, ry: 1.0 }); } else { this.box(fixed, 0, op.c - 1.25, t + 0.12, 2.8, 0.12, 0x3a2e22, { col: false }); this.box(fixed, 0, op.c + 1.25, t + 0.12, 2.8, 0.12, 0x3a2e22, { col: false }); } }
    }
    // cantos e cornija
    for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) this.box(px, 0, pz, t + 0.12, h * floors, t + 0.12, sh2(col, 0.82), { col: false });
    this.box(cx, h * floors - 0.05, cz, w + 0.5, 0.18, d + 0.5, sh2(col, 0.7), { col: false });
    // teto
    const top = h * floors; const tiles = ruin > 0.15 ? 3 : 1; for (let i = 0; i < tiles; i++) for (let j = 0; j < (tiles > 1 ? 2 : 1); j++) { if (tiles > 1 && this.r() < ruin * 0.8) continue; const tw = w / tiles, td = d / (tiles > 1 ? 2 : 1); this.box(x0 + tw * (i + 0.5), top, z0 + td * (j + 0.5), tw + 0.3, 0.3, td + 0.3, roofC, { mat: 'concrete' }); }
    if (floors > 1) this.box(cx, h - 0.05, cz, w, 0.25, d, sh2(col, 0.6), { col: true });
    // partições internas
    const rooms = [];
    if (w > 9 && d > 6.5) { const px = cx + this.rr(-w * 0.18, w * 0.18); this.wallLine('z', px, z0 + 0.2, z1 - 0.2, 0, h, 0.22, sh2(col, 0.9), [{ c: cz + this.rr(-d * 0.2, d * 0.2), w: 2.2, y0: 0, y1: 2.6 }], { ruin: ruin * 0.5 }); rooms.push(px); }
    if (d > 10 && w > 8) { const pz = cz + this.rr(-1, 1); this.wallLine('x', pz, x0 + 0.2, x1 - 0.2, 0, h, 0.22, sh2(col, 0.9), [{ c: cx + this.rr(-w * 0.25, w * 0.25), w: 2.2, y0: 0, y1: 2.6 }], { ruin: ruin * 0.5 }); }
    // mobília
    const style = o.furn || pick(this.r.bind(this), ['house', 'office', 'barracks', 'storage']); const n = 2 + Math.floor(this.r() * 3);
    for (let i = 0; i < n; i++) {
      const fx = this.rr(x0 + 1.4, x1 - 1.4), fz = this.rr(z0 + 1.4, z1 - 1.4); if (Math.abs(fx - cx) < 1.6 && (rooms.length === 0 || true) && false) continue; if (!this.free(fx, fz, 0.9, 0.3, 1.8)) continue;
      if (style === 'storage') this.crateStack(fx, fz);
      else if (style === 'barracks') { this.box(fx, 0, fz, 2.0, 0.5, 0.9, 0x4a5236, { mat: 'wood' }); this.box(fx, 0.5, fz, 1.9, 0.12, 0.85, 0xc9c0a0, { col: false }); }
      else if (style === 'office') { this.box(fx, 0, fz, 1.8, 0.8, 0.9, 0x6a5a40, { mat: 'wood' }); this.box(fx, 0.8, fz, 0.6, 0.4, 0.05, 0x27c4ff, { col: false }); }
      else { this.box(fx, 0, fz, 1.4, 0.75, 1.4, 0x7a5a30, { mat: 'wood' }); this.box(fx + 1.2, 0, fz, 0.5, 0.5, 0.5, 0x6a4a28, { mat: 'wood' }); }
    }
    if (h * 1 > 0) { this.glow(cx, h - 0.15, cz, 1.0, 0.08, 0.35, th.neon ? 0xff6aa0 : 0xfff0c0); if (this.r() < 0.6 || th.neon) this.lamps.push({ x: cx, y: h - 0.7, z: cz }); }
    if (ruin > 0.2 && this.r() < 0.8) { for (let i = 0; i < 6; i++) this.B.push({ x: cx + this.rr(-w / 2 - 2, w / 2 + 2), y: 0.2, z: cz + this.rr(-d / 2 - 2, d / 2 + 2), w: this.rr(0.4, 1.2), h: this.rr(0.3, 0.8), d: this.rr(0.4, 1.2), c: sh2(col, this.rr(0.6, 0.9)), ry: this.rr(0, 3), rz: 0, rx: 0 }); if (this.r() < 0.5) this.fires.push({ x: cx + this.rr(-w / 3, w / 3), y: h, z: cz + this.rr(-d / 3, d / 3) }); }
    if (th.neon) { const nc = pick(this.r.bind(this), [0xff3a8a, 0x3ab0ff, 0xffd23a, 0x39ff74]); this.glow(cx, h - 0.8, z1 + 0.25, Math.min(6, w * 0.5), 0.5, 0.1, nc); this.glow(cx, h - 0.8, z0 - 0.25, Math.min(6, w * 0.5), 0.5, 0.1, nc); this.lamps.push({ x: cx, y: h, z: z1 + 2, c: nc }); }
    return { x0, x1, z0, z1, h };
  }
  coverItem(x: number, z: number) {
    const k = pick(this.r.bind(this), this.th.cover); const ax = this.r() < 0.5 ? 'x' : 'z';
    if (k === 'crate') this.crateStack(x, z); else if (k === 'sandbag') this.sandbag(x, z, this.rr(4, 7), ax); else if (k === 'barrier') { this.barrier(x, z, ax); if (this.r() < 0.6) this.barrier(x + (ax === 'x' ? 3.3 : 0), z + (ax === 'x' ? 0 : 3.3), ax); }
    else if (k === 'barrel') { for (let i = 0; i < 3; i++) this.barrelS(x + (i % 2) * 0.7, z + Math.floor(i / 2) * 0.7); if (this.r() < 0.6) this.expBarrel(x + 1.4, z); }
    else if (k === 'jeep') this.vehicle('jeep', x, z, ax === 'x' ? 0 : Math.PI / 2, pick(this.r.bind(this), OLIVE), this.r() < 0.3);
    else if (k === 'car') this.vehicle('car', x, z, ax === 'x' ? 0 : Math.PI / 2, pick(this.r.bind(this), [0x8a2a2a, 0x2a4a7a, 0xa8a8a0, 0x3a3a3a, 0xc9a02a]), this.r() < 0.5);
    else if (k === 'rock') { this.rock(x, z, this.rr(1.4, 2.6)); } else if (k === 'log') { this.B.push({ x, y: 0.4, z, w: 4, h: 0.8, d: 0.8, c: 0x5a4028, ry: 0, rz: 0, rx: 0 }); this.addCol(x - 2, 0, z - 0.4, x + 2, 0.8, z + 0.4, 'wood'); }
    else if (k === 'container') this.container(x, z, ax, this.r() < 0.35 ? 2 : 1); else if (k === 'rubble') { for (let i = 0; i < 7; i++) this.box(x + this.rr(-1.5, 1.5), 0, z + this.rr(-1.5, 1.5), this.rr(0.6, 1.4), this.rr(0.5, 1.3), this.rr(0.6, 1.4), pick(this.r.bind(this), [0x7a7a78, 0x8a8a86, 0x6a6a68]), { ry: this.rr(0, 3) });
      this.addCol(x - 1.3, 0, z - 1.3, x + 1.3, 1.1, z + 1.3); } else if (k === 'tent') { this.box(x, 0, z, 3.4, 1.8, 3.4, 0x5a6a3a, { mat: 'wood' }); this.box(x, 1.8, z, 3.0, 0.5, 3.0, 0x4a5a2a, { col: false }); this.box(x, 2.3, z, 1.6, 0.4, 1.6, 0x4a5a2a, { col: false }); }
    else if (k === 'hay') { this.cyl(x, 0, z, 1, 1.2, 0xc9a64a, { mat: 'wood' }); } else if (k === 'tank') { this.cyl(x, 0, z, 2.6, 5, 0x9aa0a6, { mat: 'metal' }); this.cyl(x, 5, z, 2.7, 0.3, 0xb3262e, { col: false }); this.cyl(x + 2.0, 0, z, 0.2, 5.5, 0x3a3d42, { col: false }); }
  }
  genTown(z: any) {
    const th = this.th; const roadC = 0x38393d; const rw = th.road ? 11 : 9;
    this.box(z.cx, 0, 0, ZL, 0.04, rw, roadC, { col: false }); for (let x = z.x0 + 2; x < z.x1 - 2; x += 6) this.box(x, 0.04, 0, 2.6, 0.02, 0.25, 0xd8d0a0, { col: false });
    this.box(z.cx, 0, rw / 2 + 0.6, ZL, 0.12, 1.2, 0x7a7a78, { col: false }); this.box(z.cx, 0, -rw / 2 - 0.6, ZL, 0.12, 1.2, 0x7a7a78, { col: false });
    for (const side of [-1, 1]) { let x = z.x0 + 3; while (x < z.x1 - 10) { const w = this.rr(9, 15), d = this.rr(8, 12), h = th.tall ? this.rr(3.4, 3.8) : 3.2; const cz = side * (rw / 2 + 3 + d / 2 + this.rr(0.5, 3)); const fl = th.tall && this.r() < 0.7 ? 2 + Math.floor(this.r() * 3) : 1; this.building(x + w / 2, cz, w, d, { h, floors: fl, doors: [side > 0 ? 'n' : 's', this.r() < 0.4 ? (this.r() < 0.5 ? 'w' : 'e') : null].filter(Boolean) }); this.occ.push({ x0: x, x1: x + w, z0: cz - d / 2, z1: cz + d / 2 }); x += w + this.rr(3, 8); }
      for (let i = 0; i < 2; i++) { const p = this.spot(z, 8, 8, 20, 1, side > 0 ? [rw / 2 + 18, WID / 2 - 8] : [-WID / 2 + 8, -rw / 2 - 18]); if (p) this.building(p[0], p[1], this.rr(8, 11), this.rr(7, 9), { h: 3.2 }); } }
    for (let i = 0; i < 5; i++) { const x = z.x0 + 5 + i * 8.2 + this.rr(-1, 1); this.coverItem(x, this.rr(-3.4, 3.4)); }
    for (let x = z.x0 + 6; x < z.x1; x += 14) { this.lamp(x, rw / 2 + 0.4); this.lamp(x + 7, -rw / 2 - 0.4); }
    for (let i = 0; i < 6; i++) { const p = this.spot(z, 3, 3, 20, 0.5); if (p) this.coverItem(p[0], p[1]); }
    if (th.trees) for (let i = 0; i < 4; i++) this.tree(this.rr(z.x0 + 2, z.x1 - 2), this.rr(1, 2) * (this.r() < 0.5 ? 1 : -1) * (rw / 2 + 1.0), 1);
  }
  genField(z: any) {
    const th = this.th; const n = th.trees > 1.5 ? 9 : 14;
    if (th.road) { this.box(z.cx, 0, 0, ZL, 0.04, 8, 0x4a4a48, { col: false }); for (let x = z.x0 + 2; x < z.x1 - 2; x += 6) this.box(x, 0.04, 0, 2.4, 0.02, 0.2, 0xd8d0a0, { col: false }); }
    if (th.runway) { this.box(z.cx, 0, 0, ZL, 0.04, 26, 0x3a3c40, { col: false }); for (let x = z.x0 + 2; x < z.x1 - 2; x += 8) this.box(x, 0.04, 0, 4, 0.02, 0.6, 0xe8e8e0, { col: false }); }
    for (let i = 0; i < n; i++) { const p = this.spot(z, 5, 5, 25, 1); if (p) this.coverItem(p[0], p[1]); }
    const bp = this.spot(z, 9, 8, 40, 2); if (bp) this.building(bp[0], bp[1], 8, 7, { h: 3.2, furn: 'storage' });
    if (this.r() < 0.6) { const p = this.spot(z, 12, 6, 30, 1); if (p) { this.sandbag(p[0], p[1], 8, 'x'); this.sandbag(p[0] - 4, p[1] + 2.5, 5, 'z'); this.sandbag(p[0] + 4, p[1] + 2.5, 5, 'z'); this.crate(p[0], p[1] + 2, 1.2); } }
    for (let i = 0; i < Math.floor(th.trees * 10); i++) { const p = this.spot(z, 2.5, 2.5, 20, 0.5); if (p) this.tree(p[0], p[1], this.rr(0.9, 1.4)); }
    if (th.runway && this.r() < 0.8) { const p = this.spot(z, 14, 12, 30, 2, [14, 34]); if (p) { const pl = buildPlane(); pl.position.set(p[0], 0, p[1]); pl.rotation.y = this.rr(-0.3, 0.3); this.group.add(pl); this.addCol(p[0] - 7, 0, p[1] - 1, p[0] + 7, 3.4, p[1] + 1, 'metal'); this.addCol(p[0] - 1, 0, p[1] - 5, p[0] + 3, 2, p[1] + 5, 'metal'); } }
    if (th.stacks) { const p = this.spot(z, 4, 4, 20, 1); if (p) { this.cyl(p[0], 0, p[1], 1.6, 28, 0x8a8d92, { mat: 'concrete' }); for (let k = 0; k < 4; k++) this.cyl(p[0], 5 + k * 6, p[1], 1.62, 1.6, 0xb3262e, { col: false }); this.fires.push({ x: p[0], y: 28, z: p[1] }); } }
    this.tower(z.cx + this.rr(-8, 8), this.r() < 0.5 ? -18 : 18);
  }
  tower(x: number, z: number) { for (const [dx, dz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) this.box(x + dx, 0, z + dz, 0.3, 6, 0.3, 0x5a4a30, { mat: 'wood' }); this.box(x, 6, z, 3.6, 0.2, 3.6, 0x4a3a28, { col: false }); this.box(x, 6.2, z - 1.7, 3.6, 0.9, 0.1, 0x5a4a30, { col: false }); this.box(x, 8.2, z, 4.2, 0.2, 4.2, 0x4a4235, { col: false }); this.box(x - 1.4, 0, z, 0.15, 6, 0.15, 0x4a3a28, { col: false, rz: 0.0 }); }
  genCompound(z: any) {
    const th = this.th; const cw = 34, cd = 32, x0 = z.cx - cw / 2, x1 = z.cx + cw / 2, z0 = -cd / 2, z1 = cd / 2, wc = 0x8a8a84, wh = th.border === 'fence' ? 2.4 : 3.2;
    this.occ.push({ x0: x0 - 1, x1: x1 + 1, z0: z0 - 1, z1: z1 + 1 });
    const gap = (c: number, w2: number) => ({ c, w: w2, y0: 0, y1: wh + 1 });
    this.wallLine('x', z0, x0, x1, 0, wh, 0.5, wc, [gap(z.cx + this.rr(-8, 8), 5)], { ruin: th.ruin ? th.ruin * 0.6 : 0 }); this.wallLine('x', z1, x0, x1, 0, wh, 0.5, wc, [gap(z.cx + this.rr(-8, 8), 5)], { ruin: th.ruin ? th.ruin * 0.6 : 0 });
    this.wallLine('z', x0, z0, z1, 0, wh, 0.5, wc, [gap(this.rr(-6, 6), 7)]); this.wallLine('z', x1, z0, z1, 0, wh, 0.5, wc, [gap(this.rr(-6, 6), 7)]);
    for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) { this.box(px, 0, pz, 1.2, wh + 0.6, 1.2, 0x6a6a64); this.lamps.push({ x: px, y: wh, z: pz }); this.glow(px, wh + 0.3, pz, 0.5, 0.15, 0.5, 0xfff0c0); }
    if (!th.runway) { this.building(z.cx - 6 + this.rr(-2, 2), -7 + this.rr(-2, 2), 13, 9, { h: 3.4, floors: th.tall ? 2 : 1, furn: 'barracks' }); this.building(z.cx + 7, 8 + this.rr(-1, 2), 10, 8, { h: 3.2, furn: 'office' }); }
    for (let i = 0; i < 8; i++) { const x = this.rr(x0 + 3, x1 - 3), zz = this.rr(z0 + 3, z1 - 3); if (this.free(x, zz, 2.5, 0.1, 3)) this.coverItem(x, zz); }
    if (th.border === 'fence' || th.indoor) this.tower(x0 + 3, z0 + 3);
    for (let i = 0; i < 4; i++) { const p = this.spot(z, 4, 4, 15, 1); if (p) this.coverItem(p[0], p[1]); }
    if (th.runway) this.hangar(z.cx, 0);
  }
  genHall(z: any) {
    const th = this.th, wc = th.wall[0], H = 5; const x0 = z.x0, x1 = z.x1; this.hallZones[z.i] = 1;
    this.box(z.cx, H, 0, ZL, 0.5, WID, 0x2e3033, { mat: 'metal' }); // teto
    if (z.i > 0 || th.allHall) this.wallLine('z', x0, -WID / 2, WID / 2, 0, H, 0.6, wc, [{ c: this.rr(-14, 14), w: 4, y0: 0, y1: 3.2 }, { c: this.rr(-30, -20), w: 3.4, y0: 0, y1: 3.2 }]);
    const nw = 2 + Math.floor(this.r() * 2); for (let i = 0; i < nw; i++) { const px = x0 + 9 + i * 11 + this.rr(-2, 2); const side = this.r() < 0.5 ? 1 : -1; this.wallLine('x', 0, px - 0, px + 0, 0, 0, 0.1, wc); const a = side > 0 ? -WID / 2 : 4, b = side > 0 ? -4 : WID / 2; this.wallLine('z', px, a, b, 0, H, 0.5, wc, [{ c: (a + b) / 2 + this.rr(-12, 12), w: 4, y0: 0, y1: 3.2 }]); }
    for (let x = x0 + 6; x < x1 - 2; x += 10) for (let zz = -32; zz <= 32; zz += 16) { this.box(x, 0, zz + this.rr(-1, 1), 1.0, H, 1.0, 0x6a6d70, { mat: 'concrete' }); this.box(x, 0.0, zz, 1.3, 0.25, 1.3, 0x4a4d50, { col: false }); }
    for (let x = x0 + 4; x < x1 - 2; x += 8) for (let zz = -36; zz <= 36; zz += 12) { this.glow(x, H - 0.15, zz, 0.4, 0.1, 5, 0xe8f0ff); if (((x / 8) | 0) % 2 === 0 && Math.abs(zz) % 24 < 1) this.lamps.push({ x, y: H - 0.8, z: zz }); }
    for (let i = 0; i < 12; i++) { const p = this.spot(z, 4, 4, 25, 0.8); if (!p) continue; const k = this.r(); if (k < 0.4) this.crateStack(p[0], p[1]); else if (k < 0.6) this.container(p[0], p[1], this.r() < 0.5 ? 'x' : 'z'); else if (k < 0.8) { this.box(p[0], 0, p[1], 3, 1.6, 1.6, 0x4a5058, { mat: 'metal' }); this.box(p[0], 1.6, p[1], 2.4, 0.3, 1.2, 0x39ff74, { col: false }); } else this.coverItem(p[0], p[1]); }
    for (let i = 0; i < 6; i++) { const p = this.spot(z, 2, 2, 15, 0.5); if (p) { this.barrelS(p[0], p[1]); if (this.r() < 0.5) this.expBarrel(p[0] + 1, p[1]); } }
  }
  genBorder() {
    const th = this.th, L = this.len, hw = WID / 2;
    this.addCol(-2, 0, -hw - 2, L + 2, 60, -hw, 'concrete'); this.addCol(-2, 0, hw, L + 2, 60, hw + 2, 'concrete'); this.addCol(-2, 0, -hw, 0, 60, hw, 'concrete'); this.addCol(L, 0, -hw, L + 2, 60, hw, 'concrete');
    const side = (s: number) => {
      for (let x = -4; x < L + 4; x += 3.2) {
        const zz = s * (hw + 0.6);
        if (th.border === 'fence') { this.B.push({ x, y: 1.6, z: zz, w: 3.2, h: 3.2, d: 0.08, c: 0x6a7076, ry: 0, rz: 0, rx: 0 }); if (((x / 3.2) | 0) % 2 === 0) this.B.push({ x, y: 1.7, z: zz, w: 0.2, h: 3.4, d: 0.2, c: 0x4a4d52, ry: 0, rz: 0, rx: 0 }); }
        else if (th.border === 'wall') { this.B.push({ x, y: 3.5, z: zz, w: 3.3, h: 7, d: 1.0, c: sh2(th.wall[0], 0.8 + (((x / 3.2) | 0) % 3) * 0.06), ry: 0, rz: 0, rx: 0 }); }
        else if (th.border === 'cliff') { const hh = this.rr(8, 22); this.B.push({ x, y: hh / 2, z: s * (hw + this.rr(1, 4)), w: this.rr(3.5, 6), h: hh, d: this.rr(4, 8), c: sh2(th.mount, this.rr(0.8, 1.1)), ry: this.rr(-0.3, 0.3), rz: 0, rx: 0 }); }
        else if (th.border === 'trees') { this.tree(x, s * (hw + this.rr(1, 4)), this.rr(1.3, 2)); if (((x / 3.2) | 0) % 2) this.tree(x + 1, s * (hw + this.rr(4, 9)), this.rr(1.3, 2)); }
        else if (th.border === 'water') { if (s > 0) this.B.push({ x, y: -0.5, z: hw + 30, w: 3.4, h: 1, d: 60, c: 0x1f4f7a, ry: 0, rz: 0, rx: 0 }); else this.B.push({ x, y: 3.5, z: zz, w: 3.3, h: 7, d: 1.0, c: 0x6a6f73, ry: 0, rz: 0, rx: 0 }); }
      }
    };
    side(1); side(-1);
    for (let zz = -hw; zz <= hw; zz += 4) { for (const x of [-1.5, L + 1.5]) { this.B.push({ x, y: 3, z: zz, w: 2, h: 6, d: 4.2, c: sh2(th.wall[0], 0.8), ry: 0, rz: 0, rx: 0 }); } }
  }
  genScenery() {
    const th = this.th, L = this.len; // montanhas / prédios distantes
    for (let i = 0; i < 26; i++) { const x = this.rr(-120, L + 120), s = this.r() < 0.5 ? 1 : -1; const zz = s * this.rr(110, 260); const h = this.rr(40, 110); this.Co.push({ x, y: h / 2 - 2, z: zz, w: this.rr(50, 90), h, c: sh2(th.mount, this.rr(0.85, 1.1)) }); if (th.snowy || h > 85) this.Co.push({ x, y: h * 0.84, z: zz, w: 15, h: h * 0.3, c: 0xeef4f8 }); }
    for (let i = 0; i < 4; i++) { const x = i < 2 ? -80 - i * 40 : L + 80 + (i - 2) * 40; this.Co.push({ x, y: 40, z: this.rr(-150, 150), w: 80, h: 90, c: sh2(th.mount, 0.9) }); }
    if (th.tall) for (let i = 0; i < 18; i++) { const x = this.rr(-30, L + 30), s = this.r() < 0.5 ? 1 : -1; this.box(x, 0, s * this.rr(70, 130), this.rr(14, 30), this.rr(25, 70), this.rr(14, 30), sh2(0x707580, this.rr(0.7, 1.1)), { col: false }); }
  }
  // ---------- finalizar: instancing, grade, navegação ----------
  finalize(_o: any) {
    const mat = worldMat(); const make = (geo: any, list: any[], isGlow = false) => {
      if (!list.length) return null; const im = new THREE.InstancedMesh(geo, isGlow ? GLOWMAT : mat, list.length); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
      list.forEach((b, i) => { e.set(b.rx || 0, b.ry || 0, b.rz || 0, 'YXZ'); q.setFromEuler(e); p.set(b.x, b.y, b.z); if (geo === boxG || geo === glowG) s.set(b.w, b.h, b.d); else s.set(b.w, b.h, b.w); m.compose(p, q, s); im.setMatrixAt(i, m); im.setColorAt(i, c.setHex(b.c)); });
      im.castShadow = !isGlow; im.receiveShadow = !isGlow; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; this.group.add(im); return im;
    };
    make(boxG, this.B); make(cylG, this.Cy); make(coneG, this.Co); make(glowG, this.Gl, true);
    this.buildGrid(); this.buildNav(); this.buildReach();
  }
  buildReach() {
    const N = this.nav; const W = N.nx; N.reach = new Uint8Array(N.nx * N.nz); let [i, j] = this.cell(10, 0); const s = this.nearestFree(i, j); if (!s) { N.reach.fill(1); return; } const q = [s[1] * W + s[0]]; N.reach[q[0]] = 1;
    for (let h = 0; h < q.length; h++) { const c = q[h], ci = c % W, cj = (c / W) | 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { if (!a && !b) continue; const ni = ci + a, nj = cj + b; if (ni < 0 || nj < 0 || ni >= W || nj >= N.nz) continue; const n = nj * W + ni; if (N.bl[n] || N.reach[n]) continue; if (a && b && (N.bl[cj * W + ni] || N.bl[nj * W + ci])) continue; N.reach[n] = 1; q.push(n); } }
  }
  reachAt(x: number, z: number) { const N = this.nav; if (!N.reach) return true; const [i, j] = this.cell(x, z); return N.reach[j * N.nx + i] === 1; }
  buildGrid() { this.grid.clear(); for (const c of this.cols) this.gridAdd(c); }
  gridAdd(c: any) { const cs = 8; for (let i = Math.floor(c.x0 / cs); i <= Math.floor(c.x1 / cs); i++) for (let j = Math.floor(c.z0 / cs); j <= Math.floor(c.z1 / cs); j++) { const k = i * 4096 + j; let a = this.grid.get(k); if (!a) this.grid.set(k, (a = [])); a.push(c); } }
  addDynCol(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: string, ref: any) { const c = this.addCol(x0, y0, z0, x1, y1, z1, mat, ref); this.gridAdd(c); return c; }
  query(x: number, z: number, r: number) {
    const cs = 8, out = []; this.stamp++; for (let i = Math.floor((x - r) / cs); i <= Math.floor((x + r) / cs); i++) for (let j = Math.floor((z - r) / cs); j <= Math.floor((z + r) / cs); j++) { const a = this.grid.get(i * 4096 + j); if (a) for (const c of a) if (c.st !== this.stamp && c.live) { c.st = this.stamp; out.push(c); } } return out;
  }
  // resolve colisão de círculo (XZ) contra caixas
  push(p: any, r: number, y0: number, y1: number) {
    for (let it = 0; it < 2; it++) for (const c of this.query(p.x, p.z, r + 1)) {
      if (c.y1 <= y0 + 0.05 || c.y0 >= y1) continue; const cx = Math.max(c.x0, Math.min(p.x, c.x1)), cz = Math.max(c.z0, Math.min(p.z, c.z1)); let dx = p.x - cx, dz = p.z - cz; const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-6) { const d = Math.sqrt(d2); p.x += (dx / d) * (r - d); p.z += (dz / d) * (r - d); }
      else { const l = p.x - c.x0, rr = c.x1 - p.x, t = p.z - c.z0, b = c.z1 - p.z; const m = Math.min(l, rr, t, b); if (m === l) p.x = c.x0 - r; else if (m === rr) p.x = c.x1 + r; else if (m === t) p.z = c.z0 - r; else p.z = c.z1 + r; }
    }
  }
  floorY(x: number, z: number, feetY: number, r = 0.25) {
    let y = 0; for (const c of this.query(x, z, r)) { if (x > c.x0 - r && x < c.x1 + r && z > c.z0 - r && z < c.z1 + r && c.y1 <= feetY + 0.62 && c.y1 > y && c.y1 - c.y0 < 3) y = c.y1; } return y;
  }
  ceilY(x: number, z: number, headY: number, r = 0.25) { let y = 999; for (const c of this.query(x, z, r)) { if (x > c.x0 - r && x < c.x1 + r && z > c.z0 - r && z < c.z1 + r && c.y0 >= headY - 0.1 && c.y0 < y) y = c.y0; } return y; }
  ray(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxT: number) {
    let best: any = null, bt = maxT; this.stamp++; const step = 5; const n = Math.ceil(maxT / step);
    for (let s = 0; s <= n; s++) { const t = Math.min(maxT, s * step); const px = ox + dx * t, pz = oz + dz * t; const cs = 8; for (let i = Math.floor((px - 4) / cs); i <= Math.floor((px + 4) / cs); i++) for (let j = Math.floor((pz - 4) / cs); j <= Math.floor((pz + 4) / cs); j++) { const a = this.grid.get(i * 4096 + j); if (!a) continue; for (const c of a) { if (c.st === this.stamp || !c.live) continue; c.st = this.stamp; const h = rayBox(ox, oy, oz, dx, dy, dz, c.x0, c.y0, c.z0, c.x1, c.y1, c.z1); if (h && h.t < bt && h.t > 0) { bt = h.t; best = { t: h.t, c, nx: h.nx, ny: h.ny, nz: h.nz }; } } } }
    if (dy < 0) { const t = -oy / dy; if (t > 0 && t < bt) { bt = t; best = { t, c: null, nx: 0, ny: 1, nz: 0, ground: true }; } }
    return best;
  }
  los(ax: number, ay: number, az: number, bx: number, by: number, bz: number) { const dx = bx - ax, dy = by - ay, dz = bz - az; const d = Math.hypot(dx, dy, dz); if (d < 0.01) return true; const h = this.ray(ax, ay, az, dx / d, dy / d, dz / d, d - 0.05); return !h || h.ground && false; }
  // ---------- navegação ----------
  buildNav() {
    const cs = 1.5, ox = 0, oz = -WID / 2, nx = Math.ceil(this.len / cs), nz = Math.ceil(WID / cs); this.nav = { cs, ox, oz, nx, nz, bl: new Uint8Array(nx * nz) }; this.refreshNav();
  }
  refreshNav() {
    const N = this.nav, ex = 0.42; N.bl.fill(0);
    for (const c of this.cols) { if (!c.live || c.y0 > 1.4 || c.y1 < 0.6) continue; const i0 = Math.max(0, Math.floor((c.x0 - ex - N.ox) / N.cs)), i1 = Math.min(N.nx - 1, Math.floor((c.x1 + ex - N.ox) / N.cs)), j0 = Math.max(0, Math.floor((c.z0 - ex - N.oz) / N.cs)), j1 = Math.min(N.nz - 1, Math.floor((c.z1 + ex - N.oz) / N.cs)); for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) N.bl[j * N.nx + i] = 1; }
  }
  cell(x: number, z: number) { const N = this.nav; return [Math.max(0, Math.min(N.nx - 1, Math.floor((x - N.ox) / N.cs))), Math.max(0, Math.min(N.nz - 1, Math.floor((z - N.oz) / N.cs)))]; }
  isBlocked(x: number, z: number) { const N = this.nav; const [i, j] = this.cell(x, z); return N.bl[j * N.nx + i] === 1; }
  nearestFree(i: number, j: number) { const N = this.nav; if (!N.bl[j * N.nx + i]) return [i, j]; for (let r = 1; r < 6; r++) for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) { if (Math.max(Math.abs(a), Math.abs(b)) !== r) continue; const x = i + a, y = j + b; if (x >= 0 && y >= 0 && x < N.nx && y < N.nz && !N.bl[y * N.nx + x]) return [x, y]; } return null; }
  gridLine(x0: number, z0: number, x1: number, z1: number) { const d = Math.hypot(x1 - x0, z1 - z0); const n = Math.ceil(d / 0.7); for (let k = 1; k < n; k++) { const t = k / n; if (this.isBlocked(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t)) return false; } return true; }
  findPath(sx: number, sz: number, ex: number, ez: number) {
    const N = this.nav; let [si, sj] = this.cell(sx, sz), [ei, ej] = this.cell(ex, ez); const s2 = this.nearestFree(si, sj), e2 = this.nearestFree(ei, ej); if (!s2 || !e2) return null; [si, sj] = s2; [ei, ej] = e2;
    const W = N.nx, tot = N.nx * N.nz; const g = new Float32Array(tot).fill(1e9), par = new Int32Array(tot).fill(-1), cl = new Uint8Array(tot); const heap: number[] = [], fs = new Float32Array(tot);
    const push = (i: number) => { heap.push(i); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (fs[heap[p]] <= fs[heap[k]]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop()!; if (heap.length) { heap[0] = last; let k = 0; for (;;) { let l = 2 * k + 1, r = l + 1, m = k; if (l < heap.length && fs[heap[l]] < fs[heap[m]]) m = l; if (r < heap.length && fs[heap[r]] < fs[heap[m]]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    const st = sj * W + si, goal = ej * W + ei; g[st] = 0; fs[st] = 0; push(st); let it = 0; const h = (i: number, j: number) => { const dx = Math.abs(i - ei), dz = Math.abs(j - ej); return (dx + dz) + (1.414 - 2) * Math.min(dx, dz); };
    while (heap.length && it++ < 40000) { const cur = pop(); if (cl[cur]) continue; cl[cur] = 1; if (cur === goal) break; const ci = cur % W, cj = (cur / W) | 0;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { if (!a && !b) continue; const ni = ci + a, nj = cj + b; if (ni < 0 || nj < 0 || ni >= W || nj >= N.nz) continue; const n = nj * W + ni; if (N.bl[n] || cl[n]) continue; if (a && b && (N.bl[cj * W + ni] || N.bl[nj * W + ci])) continue; const ng = g[cur] + (a && b ? 1.414 : 1); if (ng < g[n]) { g[n] = ng; par[n] = cur; fs[n] = ng + h(ni, nj); push(n); } } }
    if (par[goal] < 0 && goal !== st) return null; const pts = []; let c = goal; while (c !== -1 && c !== st) { pts.push({ x: N.ox + ((c % W) + 0.5) * N.cs, z: N.oz + (((c / W) | 0) + 0.5) * N.cs }); c = par[c]; } pts.reverse();
    // suavização por visibilidade
    const out = []; let ax = sx, az = sz, i = 0; while (i < pts.length) { let j = pts.length - 1; while (j > i && !this.gridLine(ax, az, pts[j].x, pts[j].z)) j--; out.push(pts[j]); ax = pts[j].x; az = pts[j].z; i = j + 1; } return out;
  }
  coverPoint(fx: number, fz: number, tx: number, tz: number, radius = 14, tries = 22) {
    let best = null, bd = 1e9; for (let k = 0; k < tries; k++) {
      const a = Math.random() * 6.28, d = 3 + Math.random() * radius; const x = fx + Math.cos(a) * d, z = fz + Math.sin(a) * d; if (this.isBlocked(x, z) || !this.free(x, z, 0.5, 0.3, 1.8)) continue;
      if (this.los(x, 1.0, z, tx, 1.6, tz)) continue; const dd = Math.hypot(x - fx, z - fz) + Math.hypot(x - tx, z - tz) * 0.15 * (Math.hypot(x - tx, z - tz) < 8 ? -3 : 0); if (dd < bd) { bd = dd; best = { x, z }; }
    } return best;
  }
  randFree(z: any, r = 1.2, minX = 0, maxX = 1e9) { for (let k = 0; k < 80; k++) { const x = this.rr(Math.max(z ? z.x0 + 2 : 4, minX), Math.min(z ? z.x1 - 2 : this.len - 4, maxX)), zz = this.rr(-WID / 2 + 4, WID / 2 - 4); if (this.free(x, zz, r) && !this.isBlocked(x, zz) && this.reachAt(x, zz)) return { x, z: zz }; } return { x: z ? z.cx : 20, z: 0 }; }
  dispose() { this.group.traverse((o: any) => { if (o.isInstancedMesh) o.dispose(); }); }
}
function sh2(hex: number, f: number) { const c = new THREE.Color(hex); c.multiplyScalar(f); return c.getHex(); }
export function rayBox(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
  let tmin = 0, tmax = 1e9, nx = 0, ny = 0, nz = 0;
  if (Math.abs(dx) < 1e-9) { if (ox < x0 || ox > x1) return null; } else { let t1 = (x0 - ox) / dx, t2 = (x1 - ox) / dx, s = -1; if (t1 > t2) { const q = t1; t1 = t2; t2 = q; s = 1; } if (t1 > tmin) { tmin = t1; nx = s; ny = 0; nz = 0; } tmax = Math.min(tmax, t2); if (tmin > tmax) return null; }
  if (Math.abs(dy) < 1e-9) { if (oy < y0 || oy > y1) return null; } else { let t1 = (y0 - oy) / dy, t2 = (y1 - oy) / dy, s = -1; if (t1 > t2) { const q = t1; t1 = t2; t2 = q; s = 1; } if (t1 > tmin) { tmin = t1; nx = 0; ny = s; nz = 0; } tmax = Math.min(tmax, t2); if (tmin > tmax) return null; }
  if (Math.abs(dz) < 1e-9) { if (oz < z0 || oz > z1) return null; } else { let t1 = (z0 - oz) / dz, t2 = (z1 - oz) / dz, s = -1; if (t1 > t2) { const q = t1; t1 = t2; t2 = q; s = 1; } if (t1 > tmin) { tmin = t1; nx = 0; ny = 0; nz = s; } tmax = Math.min(tmax, t2); if (tmin > tmax) return null; }
  return { t: tmin, nx, ny, nz };
}
const boxG = new THREE.BoxGeometry(1, 1, 1), cylG = new THREE.CylinderGeometry(1, 1, 1, 10), coneG = new THREE.CylinderGeometry(0.001, 1, 1, 8), glowG = new THREE.BoxGeometry(1, 1, 1);
const GLOWMAT = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.2, 2.2) });
let _wm: any = null;
function worldMat() {
  if (_wm) return _wm; const m = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0.05 });
  m.onBeforeCompile = (s: any) => {
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;\nfloat h21(vec2 p){return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);}').replace('#include <color_fragment>', `#include <color_fragment>
      vec3 n_ = normalize(cross(dFdx(vWP), dFdy(vWP))); vec3 an = abs(n_);
      vec2 uv_ = (an.y > an.x && an.y > an.z) ? vWP.xz : ((an.x > an.z) ? vWP.zy : vWP.xy);
      float cell_ = h21(floor(uv_ * 1.5)); float ln_ = step(0.93, fract(uv_.x * 0.5)) + step(0.95, fract(uv_.y * 0.8));
      diffuseColor.rgb *= 0.9 + 0.2 * cell_ - 0.14 * min(ln_, 1.0);`);
  };
  return (_wm = m);
}
