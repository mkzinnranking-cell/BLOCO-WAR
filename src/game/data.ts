// @ts-nocheck
// ============ DADOS DO JOGO: armas, cosméticos, missões, save ============

export const WEAPONS = [
  { id: 'fn9', name: 'FN-9 Sentinel', cat: 'Pistola', lv: 1, dmg: 24, rpm: 400, mag: 15, res: 90, rl: 1.5, sp: 1.6, ads: 0.35, rc: 1.3, rh: 0.4, range: 40, mode: 'semi', zoom: 1.2, noise: 22, snd: { k: 'pistol', sup: 1 }, price: 0, mv: 1.05, model: { pistol: 1, len: 0.2, barrel: 0.04, mag: 'pistol', sup: 1, color: 0x2b2e34, accent: 0x5a5f69, scope: 'iron' }, desc: 'Pistola semiautomática silenciada. Ideal para infiltração.' },
  { id: 'de50', name: 'DE-50 Magnum', cat: 'Pistola Pesada', lv: 2, dmg: 62, rpm: 170, mag: 7, res: 42, rl: 1.9, sp: 1.2, ads: 0.3, rc: 4.2, rh: 0.9, range: 55, mode: 'semi', zoom: 1.25, noise: 95, snd: { k: 'pistol', big: 1 }, price: 900, mv: 1.0, model: { pistol: 1, len: 0.25, barrel: 0.07, mag: 'pistol', color: 0xa0a4ab, accent: 0x30343a, scope: 'iron' }, desc: 'Calibre .50. Poder de parada brutal, recuo enorme.' },
  { id: 'mp7', name: 'MP-7 Compacta', cat: 'Submetralhadora', lv: 1, dmg: 19, rpm: 820, mag: 30, res: 180, rl: 1.9, sp: 2.4, ads: 0.4, rc: 0.7, rh: 0.4, range: 32, mode: 'auto', zoom: 1.3, noise: 70, snd: { k: 'smg' }, price: 800, mv: 1.08, model: { len: 0.3, barrel: 0.1, stock: 'skeleton', mag: 'stick', scope: 'reddot', hand: 'short', color: 0x2c2f35, accent: 0x666b75 }, desc: 'Compacta e ágil. Excelente em ambientes fechados.' },
  { id: 'vector', name: 'Vector-X', cat: 'SMG Alta Cadência', lv: 5, dmg: 16, rpm: 1150, mag: 33, res: 198, rl: 2.0, sp: 2.8, ads: 0.45, rc: 0.55, rh: 0.5, range: 28, mode: 'auto', zoom: 1.3, noise: 75, snd: { k: 'smg', hi: 1 }, price: 1800, mv: 1.06, model: { len: 0.34, barrel: 0.06, stock: 'skeleton', mag: 'stickfwd', scope: 'reddot', hand: 'boxy', color: 0x8a7a55, accent: 0x2c2f35 }, desc: 'Cadência altíssima. Derrete alvos a curta distância.' },
  { id: 'ar76', name: 'AR-76 Vanguard', cat: 'Rifle de Assalto', lv: 1, dmg: 27, rpm: 640, mag: 30, res: 180, rl: 2.2, sp: 2.0, ads: 0.3, rc: 1.1, rh: 0.4, range: 75, mode: 'auto', zoom: 1.4, noise: 95, snd: { k: 'rifle' }, price: 0, mv: 1, model: { len: 0.42, barrel: 0.2, stock: 'fixed', mag: 'curved', hand: 'rail', scope: 'reddot', color: 0x2f3238, accent: 0x6a6f78 }, desc: 'Rifle de assalto padrão da Força-Tarefa Aurora.' },
  { id: 'scart', name: 'SCAR-T Tática', cat: 'Rifle Tático', lv: 3, dmg: 36, rpm: 450, mag: 20, res: 120, rl: 2.3, sp: 1.6, ads: 0.25, rc: 1.5, rh: 0.4, range: 90, mode: 'burst', zoom: 1.6, noise: 100, snd: { k: 'rifle', big: 1 }, price: 1600, mv: 0.97, model: { len: 0.45, barrel: 0.22, stock: 'fixed', mag: 'stick', hand: 'rail', scope: 'acog', color: 0x8c7b57, accent: 0x2f3238 }, desc: 'Rajadas de 3 tiros com muito dano e precisão.' },
  { id: 'dmr', name: 'DMR-M14 Marksman', cat: 'Rifle de Precisão', lv: 6, dmg: 58, rpm: 210, mag: 10, res: 60, rl: 2.5, sp: 1.0, ads: 0.12, rc: 2.2, rh: 0.5, range: 140, mode: 'semi', zoom: 3, noise: 105, snd: { k: 'rifle', big: 1 }, price: 2400, mv: 0.94, model: { len: 0.5, barrel: 0.34, stock: 'wood', mag: 'box', scope: 'long', hand: 'wood', color: 0x3a3d43, accent: 0x6b4a2b }, desc: 'Semiautomático de longo alcance com mira ampliada 3x.' },
  { id: 'pump12', name: 'Pump-12 Breacher', cat: 'Espingarda', lv: 1, dmg: 13, pel: 9, rpm: 75, mag: 6, res: 36, rl: 0.55, sp: 5.5, ads: 0.7, rc: 5, rh: 1.0, range: 16, mode: 'pump', zoom: 1.2, noise: 100, snd: { k: 'shot' }, price: 700, mv: 1.0, model: { len: 0.4, barrel: 0.36, stock: 'wood', mag: 'tube', hand: 'wood', pump: 1, color: 0x2b2d31, accent: 0x6b4a2b }, desc: 'Espingarda de ação por bombeamento. Devastadora de perto.' },
  { id: 'aa12', name: 'AA-12 Hurricane', cat: 'Espingarda Automática', lv: 8, dmg: 10, pel: 8, rpm: 300, mag: 20, res: 100, rl: 3.0, sp: 6, ads: 0.75, rc: 3.2, rh: 1.2, range: 17, mode: 'auto', zoom: 1.2, noise: 100, snd: { k: 'shot', auto: 1 }, price: 3000, mv: 0.95, model: { len: 0.5, barrel: 0.25, stock: 'fixed', mag: 'drum', hand: 'short', color: 0x2f3238, accent: 0x7a7f88 }, desc: 'Espingarda automática com tambor de 20 cartuchos.' },
  { id: 'm249', name: 'M249 Hammer', cat: 'Metralhadora Leve', lv: 5, dmg: 25, rpm: 720, mag: 100, res: 300, rl: 5.0, sp: 3.0, ads: 0.5, rc: 0.9, rh: 0.7, range: 80, mode: 'auto', zoom: 1.3, noise: 105, snd: { k: 'lmg' }, price: 3200, mv: 0.85, model: { len: 0.5, barrel: 0.36, stock: 'fixed', mag: 'belt', hand: 'long', bipod: 1, carry: 1, color: 0x2c2f35, accent: 0x5b6b45 }, desc: 'Fogo de supressão com cinto de 100 munições.' },
  { id: 'mg50', name: 'MG-50 Titan', cat: 'Metralhadora Pesada', lv: 9, dmg: 42, rpm: 520, mag: 120, res: 240, rl: 6.0, sp: 3.4, ads: 0.6, rc: 1.8, rh: 0.9, range: 100, mode: 'auto', zoom: 1.3, noise: 115, snd: { k: 'lmg', big: 1 }, price: 4500, mv: 0.75, model: { len: 0.6, barrel: 0.5, stock: 'heavy', mag: 'belt', hand: 'heavy', bipod: 1, carry: 1, color: 0x4a5238, accent: 0x23252a }, desc: 'Calibre .50 com fogo contínuo. Pesada, mas implacável.' },
  { id: 'reaper', name: 'AWP-L Reaper', cat: 'Sniper de Ferrolho', lv: 4, dmg: 160, rpm: 48, mag: 5, res: 30, rl: 3.2, sp: 0.6, ads: 0.02, rc: 5, rh: 0.5, range: 400, mode: 'bolt', zoom: 6, noise: 120, snd: { k: 'snipe' }, price: 3000, mv: 0.88, model: { len: 0.52, barrel: 0.55, stock: 'heavy', mag: 'box', scope: 'long', bipod: 1, bolt: 1, color: 0x3a4030, accent: 0x1c1e22 }, desc: 'Um tiro, uma eliminação. Mira ampliada 6x.' },
  { id: 'svd', name: 'SVD-S Longbow', cat: 'Sniper Semiautomática', lv: 7, dmg: 95, rpm: 140, mag: 10, res: 50, rl: 3.0, sp: 0.8, ads: 0.05, rc: 3.5, rh: 0.5, range: 300, mode: 'semi', zoom: 5, noise: 115, snd: { k: 'snipe', semi: 1 }, price: 3800, mv: 0.9, model: { len: 0.55, barrel: 0.45, stock: 'skeleton2', mag: 'curved', scope: 'long', hand: 'wood', color: 0x34373d, accent: 0x6b4a2b }, desc: 'Sniper semiautomática com mira 5x.' },
];
export const WMAP = Object.fromEntries(WEAPONS.map((w) => [w.id, w]));

export const EQUIP = [
  { id: 'frag', name: 'Granada de Fragmentação', key: 'G' },
  { id: 'smoke', name: 'Granada de Fumaça', key: 'Q' },
  { id: 'scan', name: 'Pulso Tático (radar)', key: 'V' },
  { id: 'medkit', name: 'Kit Médico', key: 'H' },
];

// ---------- cosméticos ----------
export const UNIFORMS = [
  { id: 'aurora', name: 'Aurora Oliva', lv: 1, base: 0x56633f, dark: 0x3b452b },
  { id: 'urban', name: 'Cinza Urbano', lv: 1, base: 0x5f646b, dark: 0x41454b },
  { id: 'desert', name: 'Deserto Tan', lv: 2, base: 0x9a8760, dark: 0x75664a },
  { id: 'navy', name: 'Marinha Azul', lv: 4, base: 0x34445a, dark: 0x232f40 },
  { id: 'night', name: 'Operações Noturnas', lv: 6, base: 0x25272c, dark: 0x16181b },
  { id: 'arctic', name: 'Ártico Branco', lv: 8, base: 0xc9d2d8, dark: 0x9aa6af },
  { id: 'crimson', name: 'Carmesim', lv: 12, base: 0x6b2a2a, dark: 0x4a1c1c },
  { id: 'gold', name: 'Elite Dourada', lv: 16, base: 0x7d6a2b, dark: 0x574a1e },
  // inimigos (ocultos)
  { id: 'dominion', name: 'Dominion', lv: 99, hidden: 1, base: 0x4a4c52, dark: 0x2e3034 },
  { id: 'dominion_d', name: 'Dominion Elite', lv: 99, hidden: 1, base: 0x24252a, dark: 0x15161a },
  { id: 'dominion_c', name: 'Dominion Comando', lv: 99, hidden: 1, base: 0x5a2e2e, dark: 0x3a1c1c },
  { id: 'ghillie', name: 'Ghillie', lv: 99, hidden: 1, base: 0x4d5a33, dark: 0x343f22 },
];
export const CAMOS = [
  { id: 'none', name: 'Sem camuflagem', lv: 1 },
  { id: 'woodland', name: 'Floresta', lv: 1 },
  { id: 'desert', name: 'Deserto', lv: 3 },
  { id: 'urban', name: 'Urbano', lv: 5 },
  { id: 'snow', name: 'Neve', lv: 7 },
  { id: 'digital', name: 'Digital', lv: 9 },
  { id: 'tiger', name: 'Tigre', lv: 11 },
];
export const OPT = {
  helmet: [{ id: 'none', name: 'Sem capacete', lv: 1 }, { id: 'standard', name: 'Capacete Padrão', lv: 1 }, { id: 'tactical', name: 'Capacete Tático', lv: 2 }, { id: 'boonie', name: 'Chapéu Boonie', lv: 3 }, { id: 'beanie', name: 'Gorro', lv: 4 }, { id: 'beret', name: 'Boina', lv: 6 }, { id: 'heavy', name: 'Capacete Pesado', lv: 9 }],
  mask: [{ id: 'none', name: 'Sem máscara', lv: 1 }, { id: 'bandana', name: 'Bandana', lv: 2 }, { id: 'balaclava', name: 'Balaclava', lv: 3 }, { id: 'skull', name: 'Caveira', lv: 7 }, { id: 'gas', name: 'Máscara de Gás', lv: 10 }],
  glasses: [{ id: 'none', name: 'Sem óculos', lv: 1 }, { id: 'tac', name: 'Óculos Tático', lv: 1 }, { id: 'sun', name: 'Óculos Escuros', lv: 3 }, { id: 'goggles', name: 'Goggles', lv: 5 }, { id: 'nvg', name: 'Visão Noturna', lv: 8 }],
  backpack: [{ id: 'none', name: 'Sem mochila', lv: 1 }, { id: 'small', name: 'Mochila Pequena', lv: 1 }, { id: 'large', name: 'Mochila de Campanha', lv: 3 }, { id: 'radio', name: 'Rádio Tático', lv: 5 }, { id: 'medic', name: 'Mochila Médica', lv: 7 }],
  vest: [{ id: 'none', name: 'Sem colete', lv: 1 }, { id: 'light', name: 'Colete Leve', lv: 1 }, { id: 'plate', name: 'Porta-Placas', lv: 2 }, { id: 'heavy', name: 'Colete Pesado', lv: 6 }],
  gloves: [{ id: 'black', name: 'Luvas Pretas', lv: 1 }, { id: 'tan', name: 'Luvas Tan', lv: 1 }, { id: 'green', name: 'Luvas Verdes', lv: 2 }, { id: 'white', name: 'Luvas Brancas', lv: 5 }, { id: 'skin', name: 'Sem luvas', lv: 1 }],
  boots: [{ id: 'black', name: 'Botas Pretas', lv: 1 }, { id: 'brown', name: 'Botas Marrons', lv: 1 }, { id: 'tan', name: 'Botas Tan', lv: 2 }, { id: 'green', name: 'Botas Verdes', lv: 4 }],
  acc: [{ id: 'none', name: 'Nenhum', lv: 1 }, { id: 'headset', name: 'Fone de Rádio', lv: 1 }, { id: 'knee', name: 'Joelheiras/Cotoveleiras', lv: 2 }, { id: 'scarf', name: 'Lenço', lv: 3 }, { id: 'grenades', name: 'Granadas no Colete', lv: 4 }, { id: 'tags', name: 'Plaquetas', lv: 6 }, { id: 'lamp', name: 'Lanterna de Ombro', lv: 8 }],
  emblem: [{ id: 'eagle', name: 'Águia', lv: 1, sym: '🦅', color: 0x3b82c4 }, { id: 'shield', name: 'Escudo', lv: 2, sym: '🛡', color: 0xd9a21b }, { id: 'bolt', name: 'Raio', lv: 4, sym: '⚡', color: 0xf0d020 }, { id: 'wolf', name: 'Lobo', lv: 6, sym: '🐺', color: 0x8d99a6 }, { id: 'skull', name: 'Caveira', lv: 8, sym: '💀', color: 0xe8e8e8 }, { id: 'star', name: 'Estrela', lv: 10, sym: '⭐', color: 0xffd23f }, { id: 'dragon', name: 'Dragão', lv: 13, sym: '🐉', color: 0xd13b3b }, { id: 'crown', name: 'Coroa', lv: 17, sym: '👑', color: 0xffc400 }],
  color: [{ id: 'blue', name: 'Azul Aurora', lv: 1, hex: 0x2f7fd1 }, { id: 'red', name: 'Vermelho', lv: 1, hex: 0xc23a3a }, { id: 'green', name: 'Verde', lv: 1, hex: 0x3f9a4a }, { id: 'orange', name: 'Laranja', lv: 3, hex: 0xe07a1f }, { id: 'white', name: 'Branco', lv: 5, hex: 0xe8ecef }, { id: 'black', name: 'Preto', lv: 5, hex: 0x1d1f23 }, { id: 'gold', name: 'Dourado', lv: 9, hex: 0xd6a92a }, { id: 'purple', name: 'Roxo', lv: 12, hex: 0x7d4bc2 }],
  skin: [{ id: 's1', name: 'Pele 1', lv: 1, hex: 0xe0ac8a }, { id: 's2', name: 'Pele 2', lv: 1, hex: 0xc58c64 }, { id: 's3', name: 'Pele 3', lv: 1, hex: 0x8d5a3b }, { id: 's4', name: 'Pele 4', lv: 1, hex: 0x5a3825 }, { id: 's5', name: 'Pele 5', lv: 1, hex: 0xf1cfb3 }],
};
export const CAT_LABEL = { uniform: 'Uniforme', camo: 'Camuflagem', helmet: 'Capacete', mask: 'Máscara', glasses: 'Óculos', backpack: 'Mochila', vest: 'Colete', gloves: 'Luvas', boots: 'Botas', acc: 'Acessório', emblem: 'Emblema', color: 'Cor de Detalhe', skin: 'Pele' };
export function optList(cat) { return cat === 'uniform' ? UNIFORMS.filter((u) => !u.hidden) : cat === 'camo' ? CAMOS : OPT[cat]; }
export const DEFAULT_LOOK = { uniform: 'aurora', camo: 'none', helmet: 'standard', mask: 'none', glasses: 'tac', backpack: 'small', vest: 'plate', gloves: 'black', boots: 'black', acc: 'headset', emblem: 'eagle', color: 'blue', skin: 's1' };

// ---------- inimigos ----------
const EL = (o) => Object.assign({ uniform: 'dominion', camo: 'none', helmet: 'standard', mask: 'none', glasses: 'none', backpack: 'small', vest: 'light', gloves: 'black', boots: 'black', acc: 'none', emblem: 'dragon', color: 'red', skin: 's2' }, o);
export const ENEMY = {
  rifle: { name: 'Soldado', hp: 100, wp: 'ar76', speed: 3.4, acc: 1, vis: 55, burst: [3, 6], pause: [0.5, 1.3], look: EL({ helmet: 'standard', mask: 'bandana', vest: 'light' }), xp: 10 },
  heavy: { name: 'Pesado', hp: 280, wp: 'aa12', speed: 2.7, acc: 0.9, vis: 45, burst: [4, 8], pause: [0.8, 1.6], scale: 1.12, look: EL({ helmet: 'heavy', mask: 'gas', vest: 'heavy', backpack: 'large', acc: 'grenades' }), xp: 25 },
  sniper: { name: 'Atirador', hp: 70, wp: 'reaper', speed: 2.8, acc: 1.4, vis: 120, burst: [1, 1], pause: [2.2, 3.5], look: EL({ uniform: 'ghillie', helmet: 'boonie', mask: 'bandana', backpack: 'none', vest: 'none', glasses: 'tac' }), ghillie: 1, xp: 25, hold: 1 },
  mg: { name: 'Metralhador', hp: 170, wp: 'm249', speed: 2.8, acc: 0.85, vis: 60, burst: [8, 16], pause: [0.8, 1.6], look: EL({ helmet: 'tactical', mask: 'balaclava', vest: 'plate', backpack: 'large' }), belt: 1, xp: 25 },
  spec: { name: 'Especialista', hp: 110, wp: 'mp7', speed: 4.0, acc: 1, vis: 55, burst: [3, 7], pause: [0.5, 1.1], look: EL({ helmet: 'beanie', mask: 'skull', glasses: 'goggles', vest: 'light', backpack: 'radio', acc: 'grenades' }), nades: 3, xp: 20 },
  elite: { name: 'Elite', hp: 190, wp: 'scart', speed: 4.3, acc: 1.5, vis: 75, burst: [3, 5], pause: [0.3, 0.8], look: EL({ uniform: 'dominion_d', helmet: 'tactical', mask: 'skull', glasses: 'nvg', vest: 'plate', backpack: 'small', acc: 'knee', gloves: 'black' }), xp: 40 },
  shield: { name: 'Escudeiro', hp: 170, wp: 'fn9', speed: 2.9, acc: 1, vis: 45, burst: [1, 2], pause: [0.5, 1.0], look: EL({ helmet: 'heavy', mask: 'balaclava', vest: 'heavy', backpack: 'none', acc: 'knee' }), shield: 1, xp: 30 },
  cmd: { name: 'Comandante', hp: 320, wp: 'de50', speed: 3.4, acc: 1.3, vis: 70, burst: [1, 2], pause: [0.5, 1.0], look: EL({ uniform: 'dominion_c', helmet: 'beret', mask: 'none', glasses: 'sun', vest: 'light', backpack: 'none', acc: 'tags', skin: 's5' }), coat: 1, epaulets: 1, scale: 1.05, xp: 80 },
};
export const ALLY_LOOKS = [
  { ...DEFAULT_LOOK, uniform: 'aurora', helmet: 'tactical', glasses: 'tac', backpack: 'large', vest: 'plate', skin: 's2', camo: 'woodland' },
  { ...DEFAULT_LOOK, uniform: 'aurora', helmet: 'standard', mask: 'bandana', backpack: 'radio', vest: 'plate', skin: 's3', camo: 'woodland', color: 'green' },
  { ...DEFAULT_LOOK, uniform: 'urban', helmet: 'boonie', glasses: 'sun', backpack: 'medic', vest: 'light', skin: 's4', camo: 'none', color: 'orange' },
  { ...DEFAULT_LOOK, uniform: 'aurora', helmet: 'heavy', mask: 'balaclava', glasses: 'none', backpack: 'small', vest: 'heavy', skin: 's1', camo: 'digital', acc: 'knee' },
  { ...DEFAULT_LOOK, uniform: 'night', helmet: 'tactical', glasses: 'nvg', mask: 'skull', backpack: 'small', vest: 'plate', skin: 's5', color: 'white' },
];
export const NAMES = ['Vega', 'Reis', 'Torres', 'Matos', 'Lima', 'Duarte', 'Costa', 'Ramos', 'Hale', 'Falcão'];

// ---------- nível / xp ----------
export const xpFor = (l) => 50 * l * (l - 1);
export function levelOf(xp) { let l = 1; while (xp >= xpFor(l + 1) && l < 25) l++; return l; }

// ---------- missões ----------
const RADIO = (t, who, txt) => ({ at: { t }, do: 'radio', who, txt });
export const MISSIONS = [
  { id: 1, name: 'PRIMEIRO CONTATO', sub: 'Base de Treinamento Alfa', theme: 'base', time: 'day', weather: 'clear', zones: 3, allies: 2, diff: 0.7, xp: 300,
    brief: 'A guerra entre a Aliança Aurora e o Exército Dominion chegou às nossas fronteiras. Sua unidade, o Esquadrão Bloco, faz a primeira operação real. Siga o treinamento e neutralize a patrulha na borda da base.',
    zoneE: [{}, { rifle: 3 }, { rifle: 3, mg: 1 }],
    obj: [{ t: 'reach', zone: 0, text: 'Mova-se até o ponto de treino (WASD, Shift para correr)' }, { t: 'kill', zone: 1, text: 'Elimine a patrulha inimiga (botão esquerdo atira, botão direito mira)' }, { t: 'kill', zone: 2, text: 'Limpe a posição avançada' }, { t: 'reach', zone: 'end', text: 'Chegue ao ponto de extração' }],
    ev: [RADIO(1, 'Cap. Vega', 'Esquadrão Bloco, aqui é Vega. Mantenham-se juntos. Contato à frente.'), RADIO(25, 'Cap. Vega', 'Use cobertura. Recarregue com R, granadas com G.')], ambient: ['arty'] },
  { id: 2, name: 'LINHA DE FRENTE', sub: 'Vila de Santa Rita', theme: 'village', time: 'day', weather: 'clear', zones: 4, allies: 2, diff: 0.8, xp: 400,
    brief: 'O Dominion tomou a vila de Santa Rita e instalou blindados na praça. Invada a posição, destrua os veículos e limpe a vila casa por casa.',
    zoneE: [{ rifle: 1 }, { rifle: 4, mg: 1 }, { rifle: 3, heavy: 1 }, { rifle: 4, spec: 1, sniper: 1 }],
    obj: [{ t: 'kill', zone: 1, text: 'Tome a entrada da vila' }, { t: 'destroy', zone: 2, count: 2, kind: 'jeep', text: 'Destrua os veículos inimigos' }, { t: 'kill', zone: 3, text: 'Elimine os defensores da praça' }, { t: 'reach', zone: 'end', text: 'Avance até a igreja' }],
    ev: [RADIO(2, 'Cap. Vega', 'Fogo inimigo na vila. Avancem com cobertura!')], ambient: ['arty', 'heli'] },
  { id: 3, name: 'EXTRAÇÃO', sub: 'Floresta de Cedro', theme: 'forest', time: 'dusk', weather: 'fog', zones: 4, allies: 1, diff: 0.85, xp: 450,
    brief: 'O Sargento Reis foi capturado durante o reconhecimento. Ele está num acampamento escondido na floresta. Localize-o, liberte-o e extraia antes que o Dominion reforce a área.',
    zoneE: [{ rifle: 2 }, { rifle: 3, sniper: 1 }, { rifle: 4, heavy: 1, spec: 1 }, { rifle: 3 }],
    obj: [{ t: 'reach', zone: 1, text: 'Infiltre-se na floresta' }, { t: 'rescue', zone: 2, text: 'Liberte o Sargento Reis (segure E)' }, { t: 'extract', zone: 'end', text: 'Escolte o Sargento até a extração' }],
    ev: [RADIO(2, 'Cap. Vega', 'Reis deve estar no acampamento central. Silêncio de rádio quando possível.'), { at: { obj: 2 }, do: 'reinf', n: 5 }, { at: { obj: 2 }, do: 'alarm' }], ambient: ['heli'] },
  { id: 4, name: 'EMBOSCADA', sub: 'Estrada Vermelha', theme: 'road', time: 'dusk', weather: 'clear', zones: 4, allies: 3, diff: 0.9, xp: 500,
    brief: 'O comboio foi atingido por uma emboscada. Sobreviva ao ataque inicial, reagrupe com o esquadrão e rompa o bloqueio inimigo na estrada.',
    zoneE: [{ rifle: 5, spec: 1 }, { rifle: 3 }, { rifle: 4, mg: 1, heavy: 1 }, { rifle: 4, shield: 1, sniper: 1 }],
    obj: [{ t: 'kill', zone: 0, text: 'Rompa a emboscada! Elimine os atacantes' }, { t: 'reach', zone: 2, text: 'Reagrupe no ponto de encontro' }, { t: 'destroy', zone: 3, count: 1, kind: 'jeep', text: 'Destrua o veículo do bloqueio' }, { t: 'reach', zone: 'end', text: 'Atravesse o bloqueio' }],
    ev: [{ at: 'start', do: 'ambush', n: 6 }, { at: 'start', do: 'arty' }, RADIO(1, 'Cap. Vega', 'EMBOSCADA! Todos para cobertura!'), { at: { obj: 1 }, do: 'convoy' }], ambient: ['arty', 'convoy'] },
  { id: 5, name: 'CONTRA-ATAQUE', sub: 'Posto do Desfiladeiro', theme: 'mountains', time: 'dusk', weather: 'snow', zones: 2, allies: 5, diff: 1, xp: 600,
    brief: 'O Dominion lança uma grande ofensiva contra o Posto do Desfiladeiro. Segure a posição por 3 minutos até o apoio chegar. Não deixe o inimigo tomar o ponto de defesa.',
    zoneE: [{}, { rifle: 2 }],
    obj: [{ t: 'reach', zone: 0, text: 'Ocupe o ponto de defesa' }, { t: 'defend', time: 150, text: 'Defenda o posto' }, { t: 'kill', zone: 'all', text: 'Elimine os atacantes restantes' }],
    ev: [RADIO(3, 'Cap. Vega', 'Radar mostra centenas de contatos! Segurem a linha!'), { at: { obj: 1 }, do: 'alarm' }, { at: { obj: 1 }, do: 'heli' }], ambient: ['arty', 'heli'] },
  { id: 6, name: 'INFILTRAÇÃO', sub: 'Fábrica Kessler', theme: 'factory', time: 'day', weather: 'clear', zones: 4, allies: 0, diff: 1, xp: 650, stealth: 1,
    brief: 'Entre na Fábrica Kessler sem ser detectado. Invada os sistemas, roube os documentos do projeto de míssil e saia. Use a pistola silenciada. Se o alarme tocar, o reforço virá.',
    zoneE: [{ rifle: 2 }, { rifle: 3, sniper: 1 }, { rifle: 3, spec: 1 }, { rifle: 3, elite: 1 }],
    obj: [{ t: 'reach', zone: 1, stealth: 1, text: 'Infiltre-se no pátio sem ser visto' }, { t: 'hack', zone: 2, count: 2, text: 'Desative as câmeras (segure E nos terminais)' }, { t: 'collect', zone: 2, count: 1, kind: 'docs', text: 'Roube os documentos do projeto (E)' }, { t: 'reach', zone: 'end', text: 'Escape pela doca de carga' }],
    ev: [RADIO(2, 'Cap. Vega', 'Você está sozinho aí dentro. Pistola silenciada e paciência.')], ambient: [] },
  { id: 7, name: 'SABOTAGEM', sub: 'Porto de Calheta', theme: 'port', time: 'dusk', weather: 'clear', zones: 4, allies: 2, diff: 1.05, xp: 700,
    brief: 'O porto de Calheta abastece toda a frente inimiga. Destrua os tanques de combustível e o radar costeiro. Use explosivos (E perto do alvo) ou muito fogo.',
    zoneE: [{ rifle: 3 }, { rifle: 4, mg: 1 }, { rifle: 3, heavy: 1, spec: 1 }, { rifle: 4, elite: 1 }],
    obj: [{ t: 'destroy', zone: 1, count: 2, kind: 'fueltank', text: 'Destrua os tanques de combustível' }, { t: 'destroy', zone: 2, count: 2, kind: 'radar', text: 'Destrua os radares costeiros' }, { t: 'kill', zone: 3, text: 'Elimine a guarda do cais' }, { t: 'reach', zone: 'end', text: 'Embarque no bote de extração' }],
    ev: [{ at: { obj: 1 }, do: 'siren' }, { at: { obj: 1 }, do: 'reinf', n: 4 }], ambient: ['arty', 'heli'] },
  { id: 8, name: 'CIDADE EM GUERRA', sub: 'Nova Esperança', theme: 'city', time: 'day', weather: 'fog', zones: 5, allies: 3, diff: 1.1, xp: 800,
    brief: 'Combate urbano em Nova Esperança. Recupere os documentos do quartel inimigo, destrua o tanque de comando e abra caminho até o ponto de evacuação.',
    zoneE: [{ rifle: 3 }, { rifle: 4, spec: 1 }, { rifle: 4, sniper: 1, mg: 1 }, { rifle: 3, heavy: 2 }, { rifle: 4, elite: 1 }],
    obj: [{ t: 'kill', zone: 1, text: 'Limpe a avenida principal' }, { t: 'collect', zone: 2, count: 2, kind: 'docs', text: 'Recupere os documentos de inteligência (E)' }, { t: 'destroy', zone: 3, count: 1, kind: 'tank', text: 'Destrua o tanque de comando' }, { t: 'reach', zone: 'end', text: 'Alcance o ponto de evacuação' }],
    ev: [{ at: { t: 30 }, do: 'collapse' }, { at: { obj: 1 }, do: 'heli' }, { at: { obj: 2 }, do: 'siren' }], ambient: ['arty', 'heli', 'convoy'] },
  { id: 9, name: 'OPERAÇÃO NOTURNA', sub: 'Distrito Neon', theme: 'nightcity', time: 'night', weather: 'rain', zones: 4, allies: 2, diff: 1.15, xp: 900,
    brief: 'Noite fechada no Distrito Neon. Use a lanterna (F) e a visão noturna (N). Invada o centro de comando, localize a informante Dra. Hale e extraia-a.',
    zoneE: [{ rifle: 3 }, { rifle: 3, spec: 1, sniper: 1 }, { rifle: 4, elite: 1 }, { rifle: 3, elite: 1, shield: 1 }],
    obj: [{ t: 'reach', zone: 1, text: 'Avance pelas ruas escuras' }, { t: 'hack', zone: 2, count: 1, text: 'Hackeie o terminal de comando (segure E)' }, { t: 'rescue', zone: 3, text: 'Localize e liberte a Dra. Hale (E)' }, { t: 'extract', zone: 'end', text: 'Extraia a Dra. Hale' }],
    ev: [RADIO(2, 'Cap. Vega', 'Visão noturna no N. Eles não enxergam melhor que você.'), { at: { obj: 2 }, do: 'alarm' }, { at: { obj: 2 }, do: 'reinf', n: 5 }], ambient: ['arty'] },
  { id: 10, name: 'CERCO', sub: 'Bunker Titã', theme: 'bunker', time: 'night', weather: 'clear', zones: 3, allies: 3, diff: 1.2, xp: 1000,
    brief: 'Você e o esquadrão estão cercados no Bunker Titã. Sobreviva a 5 ondas de ataque, depois abra caminho para a saída de emergência.',
    zoneE: [{ rifle: 2 }, {}, { rifle: 3, heavy: 1 }],
    obj: [{ t: 'reach', zone: 1, text: 'Ocupe a sala de comando' }, { t: 'survive', waves: 5, text: 'Sobreviva às ondas de ataque' }, { t: 'reach', zone: 'end', text: 'Alcance a saída de emergência' }],
    ev: [{ at: { obj: 1 }, do: 'alarm' }, RADIO(3, 'Cap. Vega', 'Eles estão vindo por todos os lados! Mantenham o fogo!')], ambient: ['arty'] },
  { id: 11, name: 'RESGATE', sub: 'Dunas de Kharan', theme: 'desert', time: 'day', weather: 'sand', zones: 5, allies: 2, diff: 1.25, xp: 1100,
    brief: 'Dois soldados aliados estão presos em campos inimigos no deserto. Liberte-os e leve todos à extração. O Dominion já está atrás de vocês.',
    zoneE: [{ rifle: 3 }, { rifle: 4, sniper: 1 }, { rifle: 4, mg: 1, spec: 1 }, { rifle: 4, heavy: 1, shield: 1 }, { rifle: 3, elite: 2 }],
    obj: [{ t: 'rescue', zones: [2, 3], text: 'Liberte os prisioneiros (E)' }, { t: 'extract', zone: 'end', text: 'Leve os prisioneiros à extração' }],
    ev: [{ at: { obj: 0 }, do: 'heli' }, { at: { obj: 0 }, do: 'reinf', n: 5 }], ambient: ['arty', 'heli', 'convoy'] },
  { id: 12, name: 'ÚLTIMA OFENSIVA', sub: 'Aeroporto de Ferro', theme: 'airport', time: 'day', weather: 'clear', zones: 5, allies: 4, diff: 1.3, xp: 1300,
    brief: 'O Aeroporto de Ferro é o último grande nó logístico do Dominion. Destrua as defesas antiaéreas e os caças em solo, depois avance até a torre de controle.',
    zoneE: [{ rifle: 4, spec: 1 }, { rifle: 4, mg: 1, heavy: 1 }, { rifle: 5, sniper: 1 }, { rifle: 4, elite: 2, shield: 1 }, { rifle: 4, heavy: 2, elite: 1 }],
    obj: [{ t: 'kill', zone: 0, text: 'Tome o portão de acesso' }, { t: 'destroy', zone: 1, count: 2, kind: 'aa', text: 'Destrua as baterias antiaéreas' }, { t: 'destroy', zone: 2, count: 2, kind: 'plane', text: 'Destrua os caças em solo' }, { t: 'kill', zone: 3, text: 'Elimine a guarda do hangar' }, { t: 'reach', zone: 'end', text: 'Tome a torre de controle' }],
    ev: [{ at: { obj: 1 }, do: 'heli' }, { at: { obj: 2 }, do: 'siren' }, { at: { obj: 2 }, do: 'convoy' }], ambient: ['arty', 'heli', 'convoy'] },
  { id: 13, name: 'FIM DA GUERRA', sub: 'Fortaleza Dominion', theme: 'industrial', time: 'dusk', weather: 'fog', zones: 6, allies: 4, diff: 1.45, xp: 2000,
    brief: 'A operação final. Desligue os geradores da fortaleza, invada o centro de comando, elimine o General Kragen e destrua o núcleo de energia. Depois, corra para a extração antes da detonação.',
    zoneE: [{ rifle: 4, heavy: 1 }, { rifle: 4, mg: 1, spec: 1 }, { rifle: 4, elite: 2, sniper: 1 }, { rifle: 4, shield: 2, heavy: 1 }, { cmd: 1, elite: 3, shield: 1 }, { rifle: 3, elite: 2 }],
    obj: [{ t: 'reach', zone: 0, text: 'Rompa o perímetro externo' }, { t: 'destroy', zone: 1, count: 3, kind: 'generator', text: 'Destrua os 3 geradores' }, { t: 'hack', zone: 2, count: 2, text: 'Invada o centro de comando (segure E)' }, { t: 'kill', zone: 4, text: 'Elimine o General Kragen e sua guarda' }, { t: 'destroy', zone: 5, count: 1, kind: 'core', text: 'Plante explosivo no núcleo de energia (E)' }, { t: 'escape', zone: 'end', time: 75, text: 'FUJA! Chegue à extração antes da detonação' }],
    ev: [RADIO(2, 'Cap. Vega', 'É isso, pessoal. Acabem com esta guerra.'), { at: { obj: 1 }, do: 'alarm' }, { at: { obj: 3 }, do: 'heli' }, { at: { obj: 4 }, do: 'collapse' }], ambient: ['arty', 'heli', 'convoy'] },
];

export const CHALLENGES = [
  { id: 'k25', name: 'Recruta de Elite', desc: 'Faça 25 eliminações', stat: 'kills', goal: 25, xp: 150 },
  { id: 'k100', name: 'Máquina de Guerra', desc: 'Faça 100 eliminações', stat: 'kills', goal: 100, xp: 400 },
  { id: 'k400', name: 'Lenda do Campo', desc: 'Faça 400 eliminações', stat: 'kills', goal: 400, xp: 1000 },
  { id: 'h10', name: 'Mira Cirúrgica', desc: '10 tiros na cabeça', stat: 'headshots', goal: 10, xp: 200 },
  { id: 'h60', name: 'Caçador de Cabeças', desc: '60 tiros na cabeça', stat: 'headshots', goal: 60, xp: 600 },
  { id: 'm1', name: 'Primeira Missão', desc: 'Complete 1 missão', stat: 'missions', goal: 1, xp: 150 },
  { id: 'm7', name: 'Veterano', desc: 'Complete 7 missões', stat: 'missions', goal: 7, xp: 500 },
  { id: 'm13', name: 'Fim da Guerra', desc: 'Complete a campanha', stat: 'missions', goal: 13, xp: 1500 },
  { id: 'g8', name: 'Granadeiro', desc: '8 eliminações com granada', stat: 'grenadeKills', goal: 8, xp: 250 },
  { id: 'w5', name: 'Sobrevivente', desc: 'Chegue à onda 5 na Sobrevivência', stat: 'bestWave', goal: 5, xp: 300 },
  { id: 'w12', name: 'Imparável', desc: 'Chegue à onda 12 na Sobrevivência', stat: 'bestWave', goal: 12, xp: 900 },
  { id: 'w1', name: 'Vitória em Equipe', desc: 'Vença 3 partidas multijogador', stat: 'wins', goal: 3, xp: 400 },
];

// ---------- configurações / save ----------
export const DEFAULT_BINDS = { fwd: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD', run: 'ShiftLeft', crouch: 'ControlLeft', jump: 'Space', reload: 'KeyR', use: 'KeyE', light: 'KeyF', frag: 'KeyG', smoke: 'KeyQ', scan: 'KeyV', medkit: 'KeyH', nvg: 'KeyN', map: 'KeyM', shop: 'KeyB' };
export const BIND_LABEL = { fwd: 'Frente', back: 'Trás', left: 'Esquerda', right: 'Direita', run: 'Correr', crouch: 'Agachar', jump: 'Pular', reload: 'Recarregar', use: 'Interagir', light: 'Lanterna', frag: 'Granada', smoke: 'Fumaça', scan: 'Pulso Tático', medkit: 'Kit Médico', nvg: 'Visão Noturna', map: 'Minimapa', shop: 'Loja' };
export const DEFAULT_SETTINGS = { master: 0.8, music: 0.5, sfx: 0.9, sens: 1, quality: 'medium', scale: 1, fpsLimit: 0, shadows: 'medium', dist: 200, particles: 'medium', lang: 'pt', diff: 'normal', fov: 80, binds: DEFAULT_BINDS, minimap: true };

export const defaultSave = () => ({
  xp: 0, done: {}, best: {}, loadout: ['ar76', 'fn9', 'mp7', 'pump12'], look: { ...DEFAULT_LOOK }, settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
  stats: { kills: 0, headshots: 0, missions: 0, grenadeKills: 0, deaths: 0, bestWave: 0, wins: 0, shots: 0, hits: 0 },
  scores: { survival: [], training: [], tdm: [], dom: [], sd: [] }, claimed: {},
});
const KEY = 'blocowar_save_v1';
function merge(a, b) { if (b == null) return a; if (typeof a !== 'object' || Array.isArray(a) || a === null) return b; const o = { ...a }; for (const k in b) o[k] = k in a ? merge(a[k], b[k]) : b[k]; return o; }
export function loadSave() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) return merge(defaultSave(), s); } catch (e) { /* ignore */ } return defaultSave(); }
export function writeSave(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ } }

// ---------- idiomas ----------
const D = {
  pt: { campaign: 'CAMPANHA', multi: 'MULTIJOGADOR / BOT', survival: 'SOBREVIVÊNCIA', domination: 'DOMINAÇÃO', destruction: 'DESTRUIÇÃO', training: 'TREINAMENTO', arsenal: 'ARSENAL', custom: 'PERSONALIZAÇÃO', settings: 'CONFIGURAÇÕES', quit: 'SAIR', back: 'VOLTAR', resume: 'CONTINUAR', menu: 'MENU PRINCIPAL', start: 'INICIAR', level: 'Nível', mission: 'Missão', audio: 'Áudio', video: 'Vídeo', controls: 'Controles', game: 'Jogo' },
  en: { campaign: 'CAMPAIGN', multi: 'MULTIPLAYER / BOT', survival: 'SURVIVAL', domination: 'DOMINATION', destruction: 'DEMOLITION', training: 'TRAINING', arsenal: 'ARSENAL', custom: 'CUSTOMIZE', settings: 'SETTINGS', quit: 'QUIT', back: 'BACK', resume: 'RESUME', menu: 'MAIN MENU', start: 'START', level: 'Level', mission: 'Mission', audio: 'Audio', video: 'Video', controls: 'Controls', game: 'Game' },
};
export const tr = (lang, k) => (D[lang] && D[lang][k]) || D.pt[k] || k;
