/* Pirate Den: how a pirate looks. A male or female pirate dressed from Puzzle Pirates' own tailor
   (the clothing names are YPPedia's), in its standard dyes, with a familiar on the shoulder if you
   like. Everything is simple shapes on the same body, so it stays cheap to draw. Also the den's
   Jolly Roger flags. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// The tailor's standard palette (YPPedia: Clothing palette).
export const DYES = {
  aqua: '#65c9c9', black: '#2a2a2e', blue: '#2a6fd7', brown: '#7d5c35', gold: '#ffbe00', green: '#3b6c2c', grey: '#cbcdd1',
  lavender: '#d9b0ff', 'light blue': '#a8f2ff', 'light green': '#669619', lime: '#3fd837', lemon: '#fffbbf', magenta: '#c9227b',
  maroon: '#9e171b', mint: '#90ffb9', navy: '#434ca2', orange: '#f57c09', peach: '#ffd5a8', persimmon: '#ff5300', pink: '#fe79a4',
  purple: '#6104ad', red: '#d72c22', rose: '#ffc4d6', tan: '#ad8047', violet: '#bf3bc4', white: '#f6f2ea', yellow: '#f8ff35',
  // Limited editions real pirates wear: named as on YPPedia (Clothing palette), coloured as the game
  // draws them, sampled from a portrait (the wiki's swatches aren't faithful): Dignity's coat
  // (shadow) and its facings (atlantean), from hers (10 Nov).
  shadow: '#674c7b', atlantean: '#afb8fe',
};
export const SKIN = ['#f6d3b0', '#f0bf8e', '#d9a066', '#b57a4a', '#8a5530', '#5c3a22'];
export const HAIR = { black: '#1f1a17', 'dark brown': '#3b2414', brown: '#6a4020', auburn: '#7f2e16', ginger: '#c4642a', blonde: '#dcb565', grey: '#a09a92', white: '#ece8e0' };
// Monkeys only come in natural colours (YPPedia: Monkey), white (a champion's) and a few limited
// editions (lavender, from a Booch Box). A lavender monkey has a white face and tummy.
export const FUR = { brown: '#6b4423', tan: '#ad8047', ginger: '#b5652a', grey: '#8a8a8a', black: '#2a2a2e', cream: '#e9dcc0', white: '#f7f5f0', lavender: '#b9a9ea' };
const FUR_FACE = { lavender: '#fbf8ff' };

/* What there is to wear, by body. Each: [id, name, uses a second colour?]. Every piece a real
   pirate in the den wears (PIRATES, below) is here too, for both bodies where it makes sense, so you
   can dress as any of them piece by piece (the user, 10 Nov). */
export const PARTS = {
  hat: {
    m: [['none', 'No hat'], ['bandana', 'Bandana'], ['tricorne', 'Tricorne'], ['feathered', 'Feathered hat', 1], ['captain', "Captain's hat", 1], ['sleeping', 'Sleeping hat'], ['fez', 'Fez'], ['viking', 'Viking helmet']],
    f: [['none', 'No hat'], ['bandana', 'Bandana'], ['tricorne', 'Tricorne'], ['feathered', 'Feathered hat', 1], ['captain', "Captain's hat", 1], ['sleeping', 'Sleeping hat'], ['wide', 'Wide-brimmed hat', 1], ['viking', 'Viking helmet']],
  },
  hair: {
    m: [['short', 'Short'], ['ponytail', 'Ponytail'], ['long', 'Long'], ['wavy', 'Wavy'], ['bald', 'Bald']],
    f: [['long', 'Long'], ['ponytail', 'Ponytail'], ['bun', 'Bun'], ['braids', 'Braids'], ['wavy', 'Wavy'], ['short', 'Short']],
  },
  beard: {
    m: [['full', 'Full beard'], ['bushy', 'Bushy beard'], ['goatee', 'Goatee'], ['moustache', 'Moustache'], ['long', 'Long beard'], ['none', 'Clean-shaven']],
    f: [['none', 'None']],
  },
  top: {
    m: [['striped', 'Striped shirt', 1], ['plain', 'Plain shirt'], ['sash', 'Shirt with sash', 1], ['vest', 'Striped shirt with vest', 1], ['swashbuckler', "Swashbuckler's jacket", 1], ['buccaneer', 'Buccaneer jacket', 1], ['captain', "Captain's jacket", 1]],
    f: [['striped', 'Striped shirt', 1], ['belt', 'Shirt with belt'], ['corset', 'Corset', 1], ['vest', 'Striped shirt with vest', 1], ['buccaneer', 'Buccaneer jacket', 1], ['swashbuckler', "Swashbuckler's jacket", 1], ['captain', "Captain's jacket", 1]],
  },
  // Round the waist, over whatever top (a plain belt isn't worn with a corset or a shirt with sash).
  waist: {
    m: [['belt', 'Belt'], ['buckle', 'Belt with a big buckle'], ['sash', 'Sash'], ['none', 'Nothing']],
    f: [['belt', 'Belt'], ['buckle', 'Belt with a big buckle'], ['sash', 'Sash'], ['none', 'Nothing']],
  },
  legs: {
    m: [['pants', 'Pants'], ['patched', 'Patched pants', 1], ['knickers', 'Stripy knickers'], ['pantaloons', 'Pantaloons'], ['kilt', 'Kilt', 1]],
    f: [['pants', 'Pants'], ['patched', 'Patched pants', 1], ['knickers', 'Stripy knickers'], ['flare', 'Flare pants'], ['long', 'Long dress bottom'], ['short', 'Short dress bottom']],
  },
  feet: {
    m: [['boots', 'Boots'], ['shoes', 'Buckle shoes'], ['fancy', 'Fancy boots', 1], ['curled', 'Curled boots']],
    f: [['boots', 'Boots'], ['shoes', 'Buckle shoes'], ['fancy', 'Fancy boots', 1], ['curled', 'Curled slippers']],
  },
  // In the right hand.
  hand: {
    m: [['none', 'Nothing'], ['tankard', 'Tankard'], ['spyglass', 'Spyglass']],
    f: [['none', 'Nothing'], ['tankard', 'Tankard'], ['spyglass', 'Spyglass']],
  },
  fam: {
    m: [['none', 'No familiar'], ['parrot', 'Parrot', 1], ['monkey', 'Monkey'], ['octopus', 'Octopus']],
    f: [['none', 'No familiar'], ['parrot', 'Parrot', 1], ['monkey', 'Monkey'], ['octopus', 'Octopus']],
  },
};
// Earrings: none, one (in the left ear, as ever) or one in each ear.
export const EARRINGS = [[false, 'None'], [true, 'One'], ['both', 'Both ears']];
export const DEFAULT_LOOK = {
  body: 'm', skin: 1, hair: 'short', hairCol: 'brown', beard: 'full', patch: true, earring: true, smile: false,
  hat: 'bandana', hatCol: 'red', hatCol2: 'white', top: 'striped', topCol: 'red', topCol2: 'white', waist: 'belt', waistCol: 'black',
  legs: 'pants', legsCol: 'navy', legsCol2: 'tan', feet: 'boots', feetCol: 'black', feetCol2: 'black', hand: 'none', fam: 'none', famCol: 'green', famCol2: 'red',
};
const DYE_KEYS = ['hatCol', 'hatCol2', 'topCol', 'topCol2', 'waistCol', 'legsCol', 'legsCol2', 'feetCol', 'feetCol2', 'famCol', 'famCol2'];
// Saves from before 10 Nov: 'coat' was the Swashbuckler's jacket on a man and the Buccaneer jacket on a woman.
const OLD_TOP = { m: { coat: 'swashbuckler' }, f: { coat: 'buccaneer' } };
const FEMALE = { hair: 'long', beard: 'none', top: 'corset', topCol: 'maroon', topCol2: 'gold', legs: 'long', legsCol: 'navy', hatCol: 'red' };

// A look from anywhere (storage, a crewmate) made safe: only things on the lists get through.
export function cleanLook(o) {
  const o2 = o && typeof o === 'object' ? o : {}, body = o2.body === 'f' ? 'f' : 'm';
  const src = { ...o2, top: OLD_TOP[body][o2.top] || o2.top };
  const L = { ...DEFAULT_LOOK, ...(body === 'f' ? FEMALE : {}), body };
  for (const slot of Object.keys(PARTS)) if (PARTS[slot][body].some(([id]) => id === src[slot])) L[slot] = src[slot];
  for (const kk of DYE_KEYS) if (DYES[src[kk]]) L[kk] = src[kk];
  if (!DYES[src.feetCol2]) L.feetCol2 = L.feetCol;   // (fancy boots' tops were the boots' own colour)
  if (HAIR[src.hairCol]) L.hairCol = src.hairCol;
  if (Number.isInteger(src.skin) && SKIN[src.skin]) L.skin = src.skin;
  for (const kk of ['patch', 'smile']) if (typeof src[kk] === 'boolean') L[kk] = src[kk];
  if (EARRINGS.some(([v]) => v === src.earring)) L.earring = src.earring;
  if (L.fam === 'monkey' && !FUR[src.famCol]) L.famCol = 'brown';
  if (L.fam === 'monkey' && FUR[src.famCol]) L.famCol = src.famCol;
  return L;
}
const pickOf = (o) => Object.keys(o)[Math.floor(Math.random() * Object.keys(o).length)];
const pickIn = (list) => list[Math.floor(Math.random() * list.length)][0];
export function randomLook(body = Math.random() < 0.5 ? 'm' : 'f') {
  const L = { body, skin: Math.floor(Math.random() * SKIN.length), hairCol: pickOf(HAIR), patch: Math.random() < 0.4, earring: pickIn(EARRINGS), smile: Math.random() < 0.5 };
  for (const slot of Object.keys(PARTS)) L[slot] = pickIn(PARTS[slot][body]);
  for (const kk of DYE_KEYS) L[kk] = pickOf(DYES);
  if (L.fam === 'monkey') L.famCol = pickOf(FUR);
  return cleanLook(L);
}
export const partName = (look, slot) => PARTS[slot][look.body].find(([id]) => id === look[slot])?.[1] || '';
export const twoColours = (look, slot) => !!PARTS[slot][look.body].find(([id]) => id === look[slot])?.[2];

/* Real Puzzle Pirates pirates in the den, by their pirate names only, each just a look: all they
   wear is in the wardrobe above, so nobody's drawn as a one-off (the user, 10 Nov: "Dalnoth just
   happens to be a guy dressed in yellow gold with a Viking helmet"). Each drawn from their portrait
   (RULES.md). Put one in the den with makePirate({ look: PIRATES.Dignity }). */
export const PIRATES = Object.fromEntries(Object.entries({
  // Dalnoth (his YPPedia portrait, 9 Nov): dark skin and a big black beard, a Viking helmet with
  // yellow fur, gold earrings, a long gold coat over a white shirt, a white sash, gold breeches and
  // boots, a frothing tankard, and his white monkey (the Champion one, which comes to you).
  Dalnoth: {
    body: 'm', skin: 5, hair: 'bald', hairCol: 'black', beard: 'bushy', patch: false, earring: 'both',
    hat: 'viking', hatCol: 'gold', top: 'swashbuckler', topCol: 'gold', topCol2: 'gold', waist: 'sash', waistCol: 'white',
    legs: 'pants', legsCol: 'gold', feet: 'boots', feetCol: 'gold', hand: 'tankard', fam: 'monkey', famCol: 'white',
  },
  // Dignity (her Emerald portrait, 10 Nov), the imperial checkpoint's commander: tan-brown skin,
  // smiling, wavy blonde hair loose to her shoulders, an eyepatch; a long Buccaneer jacket in shadow
  // (a dusky purple) with atlantean (pale periwinkle) facings, wide cuffs and gold buttons over a
  // white shirt, a black belt with a big round gold buckle, shadow pants, shadow fancy boots with
  // atlantean tops, and Bella, her lavender monkey. (Shadow and atlantean are real Puzzle Pirates
  // dyes, sampled against her portrait: 10 Nov.)
  // And her brass spyglass, for peering out from the checkpoint's gate (10 Nov).
  Dignity: {
    body: 'f', skin: 3, hair: 'wavy', hairCol: 'blonde', patch: true, earring: false, smile: true,
    hat: 'none', top: 'buccaneer', topCol: 'shadow', topCol2: 'atlantean', waist: 'buckle', waistCol: 'black',
    legs: 'pants', legsCol: 'shadow', feet: 'fancy', feetCol: 'shadow', feetCol2: 'atlantean', hand: 'spyglass', fam: 'monkey', famCol: 'lavender',
  },
}).map(([name, look]) => [name, cleanLook(look)]));

// ---------- building one ----------
const hexOf = (c) => DYES[c] || HAIR[c] || FUR[c] || (/^#[0-9a-f]{6}$/i.test(c) ? c : '#888888');
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: hexOf(c), roughness: 0.85, ...o });
function part(geo, m, x = 0, y = 0, z = 0) {
  const p = new THREE.Mesh(geo, m);
  p.position.set(x, y, z);
  p.castShadow = true; p.receiveShadow = true;
  return p;
}
function tex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const texCache = new Map();
const cached = (key, make) => (texCache.has(key) ? texCache.get(key) : texCache.set(key, make()).get(key));
const stripeTex = (a, b, n = 8) => cached(`s${a}${b}${n}`, () => tex(4, 64, (g) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? hexOf(b) : hexOf(a); g.fillRect(0, i * 64 / n, 4, 64 / n); } }));
const patchTex = (a, b) => cached(`p${a}${b}`, () => tex(64, 64, (g) => {
  g.fillStyle = hexOf(a); g.fillRect(0, 0, 64, 64);
  for (const [x, y, w, h] of [[8, 10, 18, 16], [38, 36, 16, 18]]) {
    g.fillStyle = hexOf(b); g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(0,0,0,.55)'; g.setLineDash([3, 3]); g.lineWidth = 1.5; g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  }
}));
const tartanTex = (a, b) => cached(`t${a}${b}`, () => tex(64, 64, (g) => {
  g.fillStyle = hexOf(a); g.fillRect(0, 0, 64, 64);
  g.globalAlpha = 0.55; g.fillStyle = hexOf(b);
  for (let i = 0; i < 64; i += 16) { g.fillRect(i, 0, 6, 64); g.fillRect(0, i, 64, 6); }
  g.globalAlpha = 0.5; g.fillStyle = '#111';
  for (let i = 8; i < 64; i += 16) { g.fillRect(i, 0, 1.5, 64); g.fillRect(0, i, 64, 1.5); }
}));
// The torso's outline (radius, height) from the hips up, by body.
const TORSO = {
  m: [[0.29, 0], [0.29, 0.1], [0.27, 0.3], [0.255, 0.5], [0.22, 0.6], [0.15, 0.64]],
  f: [[0.27, 0], [0.27, 0.08], [0.215, 0.26], [0.235, 0.4], [0.24, 0.47], [0.2, 0.6], [0.14, 0.64]],
};
const lathe = (pts, scale = 1, from = 0, gap = 0) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r * scale, y)), 20, from + gap, Math.PI * 2 - 2 * gap);

/* A pirate in the given look. Returns the parts the den animates: `legs` and `arms` swing from
   the hip and shoulder, `body` is everything above the hips. `opts.sword` gives them a cutlass. */
export function dressPirate(look, opts = {}) {
  const L = { ...DEFAULT_LOOK, ...look }, F = L.body === 'f';
  L.top = OLD_TOP[L.body]?.[L.top] || L.top;
  const g = new THREE.Group(), body = new THREE.Group();
  body.position.y = 0.72;
  g.add(body);
  const skin = M(SKIN[L.skin] || SKIN[1]), black = M('#1d1a18'), white = M('white');
  const gold = M('#e8b23a', { metalness: 0.7, roughness: 0.3 });
  const hairM = M(HAIR[L.hairCol] || L.hairCol);
  const top = L.topCol, top2 = L.topCol2;
  const shirtM = {
    striped: () => M('#ffffff', { map: stripeTex(top2, top) }), plain: () => M(top), sash: () => M(top), belt: () => M(top),
    vest: () => M('#ffffff', { map: stripeTex('white', top2) }), swashbuckler: () => M('white'), buccaneer: () => M('white'), captain: () => M('white'), corset: () => M('white'),
  }[L.top]?.() || M(top);
  const coat = L.top === 'swashbuckler' || L.top === 'buccaneer' || L.top === 'captain', bucc = L.top === 'buccaneer';
  const sleeveM = coat ? M(top) : shirtM;

  // Legs: a thigh and a shin, from the hip, then the feet.
  const thinner = F ? 0.88 : 1;
  const thighM = { pants: () => M(L.legsCol), patched: () => M('#fff', { map: patchTex(L.legsCol, L.legsCol2) }), knickers: () => M('#fff', { map: stripeTex('white', L.legsCol, 6) }),
    pantaloons: () => M(L.legsCol), flare: () => M(L.legsCol), kilt: () => skin, long: () => M(L.legsCol), short: () => M('white') }[L.legs]?.() || M(L.legsCol);
  const shinM = { knickers: white, pantaloons: white, kilt: white, short: white }[L.legs] || thighM;
  const legs = [-1, 1].map((s) => {
    const hip = new THREE.Group();
    hip.position.set((F ? 0.12 : 0.13) * s, 0.72, 0);
    const thigh = L.legs === 'pantaloons' ? part(new THREE.SphereGeometry(0.13, 12, 10), thighM, 0, -0.16) : part(new THREE.CylinderGeometry(0.095 * thinner, 0.09 * thinner, 0.31, 10), thighM, 0, -0.15);
    if (L.legs === 'pantaloons') thigh.scale.set(1, 1.45, 1);
    const shin = part(new THREE.CylinderGeometry(0.088 * thinner, L.legs === 'flare' ? 0.14 : 0.08 * thinner, 0.29, 10), shinM, 0, -0.44);
    hip.add(thigh, shin);
    if (L.legs === 'knickers') hip.add(part(new THREE.CylinderGeometry(0.1 * thinner, 0.1 * thinner, 0.04, 10), M(L.legsCol), 0, -0.3));
    const fc = M(L.feetCol);
    // (Under a dress the feet come a little further forward, so they peep out from under it.)
    const fz = L.legs === 'long' || L.legs === 'short' ? 0.1 : 0.05;
    const foot = part(new RoundedBoxGeometry(0.18 * thinner, L.feet === 'shoes' ? 0.1 : 0.15, 0.3, 2, 0.045), fc, 0, L.feet === 'shoes' ? -0.645 : -0.62, fz);
    hip.add(foot);
    if (L.feet === 'boots' || L.feet === 'fancy') hip.add(part(new THREE.CylinderGeometry(0.1 * thinner, 0.1 * thinner, 0.24, 10), fc, 0, -0.48));
    // Fancy boots' wide turned-down tops, in their second colour.
    // (Low enough on the shin to show under a long coat.)
    if (L.feet === 'fancy') hip.add(part(new THREE.CylinderGeometry(0.14 * thinner, 0.112 * thinner, 0.12, 12), M(L.feetCol2 || L.feetCol), 0, -0.39));
    if (L.feet === 'shoes') hip.add(part(new THREE.BoxGeometry(0.08, 0.05, 0.02), gold, 0, -0.6, fz + 0.13));
    if (L.feet === 'curled') {
      const curl = part(new THREE.TorusGeometry(0.05, 0.022, 6, 12, Math.PI * 1.3), fc, 0, -0.6, fz + 0.15);
      curl.rotation.y = Math.PI / 2;
      hip.add(curl);
    }
    g.add(hip);
    return hip;
  });

  // The torso and what's over it.
  const shape = TORSO[L.body];
  const torso = part(lathe(shape), shirtM, 0, 0.02);
  body.add(torso);
  // Round the waist: a belt (with a small square buckle or a big round one), a sash knotted at the
  // side with its ends hanging, or nothing. (A plain belt isn't worn with a corset or shirt with sash.)
  const wr = shape[0][0], wc = M(L.waistCol);
  const waist = () => {
    if (L.waist === 'belt' || L.waist === 'buckle') {
      body.add(part(new THREE.CylinderGeometry(wr + 0.005, wr + 0.005, 0.08, 16), wc, 0, 0.07));
      if (L.waist === 'belt') body.add(part(new THREE.BoxGeometry(0.11, 0.09, 0.03), gold, 0, 0.07, wr));
      else {
        body.add(part(new THREE.TorusGeometry(0.065, 0.02, 8, 20), gold, 0, 0.07, wr + 0.02));
        body.add(part(new THREE.BoxGeometry(0.018, 0.1, 0.02), gold, -0.012, 0.07, wr + 0.025));
      }
    } else if (L.waist === 'sash') {
      body.add(part(new THREE.CylinderGeometry(wr + 0.045, wr + 0.045, 0.11, 18), wc, 0, 0.1, 0.02));
      const end = part(new THREE.BoxGeometry(0.09, 0.3, 0.04), wc, 0.17, -0.08, wr + 0.01);
      end.rotation.z = 0.12;
      body.add(end);
    }
  };
  if (!(L.waist === 'belt' && (L.top === 'sash' || L.top === 'corset'))) waist();
  if (L.top === 'sash') {
    const sash = part(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 16), M(top2), 0, 0.08);
    sash.rotation.z = 0.08;
    const tails = part(new THREE.BoxGeometry(0.08, 0.26, 0.04), M(top2), 0.27, -0.06, 0.08);
    tails.rotation.z = 0.2;
    body.add(sash, tails);
  } else if (L.top === 'corset') {
    body.add(part(lathe(shape.filter(([, y]) => y <= 0.42), 1.05), M(top), 0, 0.03));
    for (let i = 0; i < 4; i++) {
      const y = 0.1 + i * 0.075;
      for (const s of [-1, 1]) {
        const lace = part(new THREE.BoxGeometry(0.075, 0.012, 0.012), M(top2), 0, y, 0.235 + (F ? -0.01 : 0));
        lace.rotation.z = 0.5 * s;
        body.add(lace);
      }
    }
  }
  if (L.top === 'vest') {
    const vest = part(lathe(shape.filter(([, y]) => y >= 0.05), 1.06, 0, 0.42), M(top), 0, 0.02);
    vest.material.side = THREE.DoubleSide;
    body.add(vest);
  }
  if (coat) {
    const shell = part(lathe(shape, 1.07, 0, 0.3), M(top), 0, 0.02);
    const skirt = part(lathe([[0.31, 0], [0.33, -0.15], [0.37, -0.42]].reverse(), 1, 0, 0.5), M(top), 0, 0.07);
    shell.material.side = skirt.material.side = THREE.DoubleSide;
    body.add(shell, skirt);
    if (bucc) {
      // The Buccaneer jacket: facings in its second colour down both edges of the front, widening
      // into lapels at the chest, with gold buttons in two rows down them.
      const strip = (pts, sc, a, w) => [a, Math.PI * 2 - a - w].map((from) => {
        const m = part(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r * sc, y)), 6, from, w), M(top2, { side: THREE.DoubleSide }), 0, 0.02);
        body.add(m);
        return m;
      });
      strip(shape.filter(([, y]) => y <= 0.35), 1.08, 0.3, 0.26);
      strip(shape.filter(([, y]) => y >= 0.3), 1.08, 0.3, 0.42);
      strip([[0.31, 0], [0.33, -0.15], [0.37, -0.42]].reverse(), 1.01, 0.5, 0.22).forEach((m) => { m.position.y = 0.07; });
      const rAt = (y) => { for (let i = 1; i < shape.length; i++) if (shape[i][1] >= y) { const [r0, y0] = shape[i - 1], [r1, y1] = shape[i]; return r0 + (r1 - r0) * (y - y0) / (y1 - y0); } return shape[shape.length - 1][0]; };
      for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
        const y = 0.1 + i * 0.11, r = rAt(y - 0.02) * 1.08 + 0.012, a = 0.44;
        body.add(part(new THREE.SphereGeometry(0.022, 8, 6), gold, Math.sin(a) * r * s, y, Math.cos(a) * r));
      }
    } else for (let i = 0; i < 3; i++) for (const s of [-1, 1]) body.add(part(new THREE.SphereGeometry(0.022, 8, 6), L.top === 'captain' ? gold : M(top2), 0.11 * s, 0.2 + i * 0.13, 0.27 - i * 0.012));
    if (L.top === 'captain') {
      for (const s of [-1, 1]) {
        const ep = part(new THREE.SphereGeometry(0.1, 12, 8), gold, 0.27 * s, 0.6, 0);
        ep.scale.set(1.1, 0.35, 0.9);
        body.add(ep);
      }
    }
  }
  if (L.legs === 'kilt') body.add(part(lathe([[0.37, -0.36], [0.31, 0.08]], 1), M('#fff', { map: tartanTex(L.legsCol, L.legsCol2), side: THREE.DoubleSide }), 0, 0));
  if (L.legs === 'long' || L.legs === 'short') {
    // Ankle length at most, and not too wide at the hem: whatever's on your feet always shows.
    const len = L.legs === 'long' ? 0.44 : 0.32;
    const skirt = part(lathe([[0.3, -len], [0.31, -len * 0.5], [0.28, 0.08]], 1), M(L.legsCol, { side: THREE.DoubleSide }), 0, 0);
    body.add(skirt);
  }

  // The head.
  const hr = F ? 0.235 : 0.25;
  body.add(part(new THREE.SphereGeometry(hr, 20, 16), skin, 0, 0.9));
  body.add(part(new THREE.SphereGeometry(F ? 0.045 : 0.055, 10, 8), skin, 0, 0.87, hr - 0.005));
  const eye = (x) => part(new THREE.SphereGeometry(0.035, 8, 6), black, x, 0.95, hr - 0.035);
  body.add(eye(0.085));
  if (L.patch) {
    const pt = part(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 14), black, -0.09, 0.95, hr - 0.035);
    pt.rotation.x = Math.PI / 2 - 0.35;
    const strap = part(new THREE.TorusGeometry(hr + 0.002, 0.012, 6, 32), black, 0, 0.96);
    strap.rotation.set(Math.PI / 2 - 0.25, 0.35, 0);
    body.add(pt, strap);
  } else body.add(eye(-0.085));
  if (L.smile) {
    const smile = part(new THREE.TorusGeometry(0.055, 0.011, 6, 14, Math.PI * 0.8), M(F ? '#b8473f' : '#5a2c22'), 0, F ? 0.83 : 0.835, hr - 0.02);
    smile.rotation.z = Math.PI * 1.1;
    body.add(smile);
  } else if (F) {
    const lips = part(new THREE.SphereGeometry(0.05, 10, 6), M('#b8473f'), 0, 0.815, hr - 0.025);
    lips.scale.set(1, 0.42, 0.5);
    body.add(lips);
  }
  for (const s of L.earring === 'both' ? [1, -1] : L.earring ? [1] : []) {
    const ring = part(new THREE.TorusGeometry(0.04, 0.012, 6, 16), gold, hr * s, 0.83, 0);
    ring.rotation.y = Math.PI / 2;
    body.add(ring);
  }

  // Hair, tilted back so the face shows.
  if (L.hair !== 'bald') {
    const cap = part(new THREE.SphereGeometry(hr + 0.014, 20, 12, 0, Math.PI * 2, 0, Math.PI * (F ? 0.6 : 0.55)), hairM, 0, 0.9, -0.005);
    cap.rotation.x = -0.5;
    body.add(cap);
  }
  if (L.hair === 'long') {
    const curtain = part(new THREE.CylinderGeometry(hr + 0.008, hr + 0.04, F ? 0.5 : 0.36, 16, 1, true, Math.PI / 2, Math.PI), hairM, 0, F ? 0.68 : 0.76, -0.01);
    curtain.material.side = THREE.DoubleSide;
    body.add(curtain);
  } else if (L.hair === 'ponytail') {
    body.add(part(new THREE.SphereGeometry(0.05, 8, 6), hairM, 0, 0.88, -hr - 0.01));
    const tail = part(new THREE.ConeGeometry(0.065, 0.36, 10), hairM, 0, 0.7, -hr - 0.05);
    tail.rotation.x = Math.PI + 0.2;
    body.add(tail);
  } else if (L.hair === 'wavy') {
    // Wavy, loose and full to the shoulders, framing the face (the user, 10 Nov: "nice, long kind of
    // hair", not "straight long hair gathered at the back", no "bumps" or "pigtails"; and then "it
    // needs a bit more"): volume at the crown, a fall of hair open only at the face, separate wavy
    // locks falling past the shoulders, two framing the face, and a fringe swept to one side.
    const ends = 0.66, open = 0.82;   // (where the fall ends; half the gap at the face, either side of ahead)
    const crown = part(new THREE.SphereGeometry(hr + 0.045, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), hairM, 0, 0.93, -0.03);
    crown.scale.set(1.04, 0.85, 1.06);
    crown.rotation.x = -0.35;
    body.add(crown);
    const prof = [[hr - 0.02, 1.08], [hr + 0.035, 0.98], [hr + 0.06, 0.87], [hr + 0.075, 0.76], [hr + 0.08, ends]].map(([r, y]) => new THREE.Vector2(r, y));
    const geo = new THREE.LatheGeometry(prof, 32, open, Math.PI * 2 - 2 * open), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(x, z), drop = Math.max(0, (0.98 - y) / (0.98 - ends));
      const k = 1 + drop * 0.08 * Math.sin(a * 7 + y * 16);
      pos.setXYZ(i, x * k, y - (y < ends + 1e-4 ? 0.03 + 0.025 * Math.sin(a * 9) : 0), z * k);
    }
    geo.computeVertexNormals();
    hairM.side = THREE.DoubleSide;
    body.add(part(geo, hairM, 0, 0, -0.01));
    // A lock: thick at its root, tapering, waving as it falls.
    const lock = (a, len, w, y0, out = 0.07) => {
      const lp = [[0.001, 0], [w * 0.8, -0.03], [w, -len * 0.3], [w * 0.75, -len * 0.7], [0.012, -len]].map(([r, y]) => new THREE.Vector2(r, y));
      const lg = new THREE.LatheGeometry(lp, 7), q = lg.attributes.position;
      for (let i = 0; i < q.count; i++) q.setX(i, q.getX(i) + 0.03 * Math.sin(q.getY(i) * 15 + a * 3));   // (its wave)
      lg.computeVertexNormals();
      const at = new THREE.Group(), m = part(lg, hairM);
      at.position.set(Math.sin(a) * (hr + out), y0, Math.cos(a) * (hr + out) - 0.01);
      at.rotation.y = a;   // (facing out from her head)
      m.rotation.x = -0.18;   // (leaning out a little as it falls)
      at.add(m);
      body.add(at);
    };
    [[1.3, 0.3], [1.85, 0.36], [2.45, 0.34], [3.14, 0.38], [3.8, 0.34], [4.4, 0.36], [4.98, 0.3]].forEach(([a, len]) => lock(a, len, 0.05, 0.8));
    for (const s2 of [-1, 1]) lock(s2 * 0.95, 0.22, 0.06, 0.86, 0.03);   // (framing her face: short, full, not tails)
    // The fringe, swept across from a side part, and a lock of it falling past one temple.
    const fringe = part(new THREE.SphereGeometry(0.085, 12, 8), hairM, 0.03, 1.07, 0.1);
    fringe.scale.set(2.1, 0.75, 1.15);
    fringe.rotation.z = -0.22;
    body.add(fringe);
    const sweep = part(new THREE.SphereGeometry(0.06, 10, 8), hairM, 0.15, 0.98, 0.15);
    sweep.scale.set(0.8, 1.5, 0.9);
    sweep.rotation.z = 0.35;
    body.add(sweep);
  } else if (L.hair === 'bun') body.add(part(new THREE.SphereGeometry(0.11, 12, 10), hairM, 0, 1.03, -0.17));
  else if (L.hair === 'braids') {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 5; i++) body.add(part(new THREE.SphereGeometry(0.045 - i * 0.003, 8, 6), hairM, 0.2 * s, 0.82 - i * 0.075, 0.03));
      body.add(part(new THREE.SphereGeometry(0.022, 6, 5), M(L.hatCol), 0.2 * s, 0.47, 0.03));
    }
  }
  // A beard, in the same colour.
  if (L.beard === 'full' || L.beard === 'long' || L.beard === 'bushy') body.add(part(new THREE.SphereGeometry(0.17, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), hairM, 0, 0.82, 0.07));
  // A bushy beard: bigger, up the sides of the face.
  if (L.beard === 'bushy') {
    const bush = part(new THREE.SphereGeometry(0.2, 14, 10, 0, Math.PI * 2, Math.PI / 2.3, Math.PI / 1.8), hairM, 0, 0.84, 0.06);
    bush.scale.set(1.08, 1.15, 1);
    body.add(bush);
  }
  if (L.beard === 'long') {
    const tip = part(new THREE.ConeGeometry(0.12, 0.3, 12), hairM, 0, 0.6, 0.14);
    tip.rotation.x = Math.PI - 0.15;
    body.add(tip);
  }
  if (L.beard === 'goatee') {
    const gt = part(new THREE.ConeGeometry(0.055, 0.14, 10), hairM, 0, 0.71, 0.19);
    gt.rotation.x = Math.PI - 0.3;
    body.add(gt);
  }
  if (L.beard === 'goatee' || L.beard === 'moustache') for (const s of [-1, 1]) {
    const mo = part(new THREE.CapsuleGeometry(0.022, 0.08, 4, 8), hairM, 0.055 * s, 0.835, hr - 0.02);
    mo.rotation.z = 1.25 * s;
    body.add(mo);
  }

  // The hat.
  const hat = new THREE.Group(), hc = M(L.hatCol), hc2 = M(L.hatCol2);
  body.add(hat);
  if (L.hat === 'bandana') {
    const band = part(new THREE.SphereGeometry(hr + 0.012, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.3), hc, 0, 0.93);
    band.rotation.x = -0.18;
    hat.add(band, part(new THREE.SphereGeometry(0.07, 10, 8), hc, 0, 1.0, -hr));
    const tail = part(new THREE.BoxGeometry(0.07, 0.2, 0.03), hc, 0.04, 0.88, -hr - 0.03);
    tail.rotation.z = 0.3;
    hat.add(tail);
  } else if (L.hat === 'tricorne') {
    hat.add(part(new THREE.CylinderGeometry(0.2, 0.24, 0.18, 16), hc, 0, 1.15));
    const brim = part(new THREE.ConeGeometry(0.44, 0.17, 3, 1, true), M(L.hatCol, { side: THREE.DoubleSide }), 0, 1.09);
    brim.rotation.set(Math.PI, Math.PI, 0);
    const trim = part(new THREE.TorusGeometry(0.44, 0.02, 4, 3), gold, 0, 1.175);
    trim.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
    hat.add(brim, trim);
    hat.rotation.x = -0.1;
  } else if (L.hat === 'feathered' || L.hat === 'wide') {
    const wide = L.hat === 'wide';
    hat.add(part(new THREE.CylinderGeometry(wide ? 0.5 : 0.43, wide ? 0.5 : 0.43, 0.025, 28), hc, 0, 1.08));
    hat.add(part(new THREE.CylinderGeometry(0.19, 0.23, wide ? 0.17 : 0.22, 18), hc, 0, 1.19));
    hat.add(part(new THREE.CylinderGeometry(0.235, 0.235, 0.05, 18), hc2, 0, 1.12));
    if (!wide) {
      const feather = part(new THREE.SphereGeometry(0.06, 10, 8), hc2, 0.14, 1.27, -0.12);
      feather.scale.set(0.7, 0.45, 4.2);
      feather.rotation.set(0.55, 0.45, 0);
      hat.add(feather);
    }
    hat.rotation.z = wide ? -0.1 : 0.14;
  } else if (L.hat === 'captain') {
    const half = part(new THREE.CylinderGeometry(0.34, 0.34, 0.09, 24, 1, false, -Math.PI / 2, Math.PI), hc, 0, 1.07);
    half.rotation.x = -Math.PI / 2;
    half.scale.x = 1.3;
    const trim = part(new THREE.TorusGeometry(0.34, 0.03, 6, 24, Math.PI), hc2, 0, 1.07, 0.03);
    trim.scale.x = 1.3;
    const trim2 = trim.clone();
    trim2.position.z = -0.03;
    hat.add(half, trim, trim2, part(new THREE.SphereGeometry(0.055, 10, 8), gold, 0, 1.2, 0.06));
  } else if (L.hat === 'sleeping') {
    const sm = M('#fff', { map: stripeTex(L.hatCol, 'white', 6) });
    hat.add(part(new THREE.CylinderGeometry(0.17, hr + 0.015, 0.22, 16), sm, 0, 1.06));
    const flop = part(new THREE.ConeGeometry(0.17, 0.42, 14), sm, 0.2, 1.15);
    flop.rotation.z = -2.0;
    hat.add(flop, part(new THREE.SphereGeometry(0.07, 10, 8), white, 0.39, 1.06));
  } else if (L.hat === 'fez') {
    hat.add(part(new THREE.CylinderGeometry(0.15, 0.19, 0.22, 16), hc, 0, 1.17));
    const cord = part(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 5), black, 0.08, 1.22, -0.08);
    cord.rotation.z = 0.9;
    hat.add(cord, part(new THREE.SphereGeometry(0.03, 8, 6), gold, 0.14, 1.17, -0.12));
  } else if (L.hat === 'viking') {
    // A steel dome with a gold rim, gold bands over the top and down the nose, a spike, white horns
    // curling up and out, and a tuft of fur (the hat's colour) where each meets the helmet.
    const steel = M('#d4d7dc', { metalness: 0.6, roughness: 0.35 }), gilt = M('#e0a92a', { metalness: 0.5, roughness: 0.4 }), ivory = M('#f2ead8', { roughness: 0.6 });
    const at = (m, x, y, z) => { m.position.set(x, y, z); hat.add(m); return m; };
    at(part(new THREE.SphereGeometry(hr + 0.025, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), steel), 0, 1.0, 0).scale.y = 0.75;
    at(part(new THREE.TorusGeometry(hr + 0.025, 0.026, 6, 28), gilt), 0, 1.0, 0).rotation.x = Math.PI / 2;
    const band = at(part(new THREE.TorusGeometry(hr + 0.03, 0.022, 6, 20, Math.PI), gilt), 0, 1.0, 0);
    band.rotation.y = Math.PI / 2; band.scale.y = 0.75;
    at(part(new THREE.TorusGeometry(hr + 0.03, 0.02, 6, 20, Math.PI), gilt), 0, 1.0, 0).scale.y = 0.75;
    at(part(new THREE.BoxGeometry(0.045, 0.12, 0.025), gilt), 0, 0.95, hr + 0.015);
    at(part(new THREE.ConeGeometry(0.035, 0.09, 8), steel), 0, 1.0 + hr * 0.75 + 0.05, 0);
    for (const s of [-1, 1]) {
      at(part(new THREE.ConeGeometry(0.07, 0.24, 10), ivory), s * (hr + 0.07), 1.1, 0).rotation.z = -s * 1.0;
      at(part(new THREE.ConeGeometry(0.046, 0.22, 10), ivory), s * (hr + 0.197), 1.27, 0).rotation.z = -s * 0.25;
      at(part(new THREE.SphereGeometry(0.075, 10, 8), hc), s * (hr + 0.02), 1.03, 0.02).scale.set(1, 1.2, 1.3);
    }
  }

  // Arms, from the shoulder.
  const shX = F ? 0.28 : 0.31, ar = F ? 0.85 : 1;
  const arms = [-1, 1].map((s) => {
    const sh = new THREE.Group();
    sh.position.set(shX * s, 0.58, 0);
    sh.add(part(new THREE.CylinderGeometry(0.07 * ar, 0.065 * ar, 0.48, 10), sleeveM, 0, -0.24));
    if (L.top === 'corset') {
      const puff = part(new THREE.SphereGeometry(0.1, 12, 10), white, 0, -0.04);
      puff.scale.set(1, 0.9, 1);
      sh.add(puff);
    }
    if (bucc) sh.add(part(new THREE.CylinderGeometry(0.1, 0.115, 0.15, 12), M(top2), 0, -0.4));   // (wide cuffs)
    else if (coat) sh.add(part(new THREE.CylinderGeometry(0.085, 0.085, 0.09, 10), L.top === 'captain' ? gold : M(top2), 0, -0.42));
    sh.add(part(new THREE.SphereGeometry(0.075 * ar, 10, 8), skin, 0, -0.5));
    body.add(sh);
    return sh;
  });
  if (opts.sword) {
    const blade = part(new THREE.BoxGeometry(0.04, 0.05, 0.62), M('#d8dde2', { metalness: 0.8, roughness: 0.25 }), 0, -0.52, 0.34);
    arms[1].add(blade, part(new THREE.BoxGeometry(0.16, 0.05, 0.04), gold, 0, -0.52, 0.04));
  }
  let held = null;   // what's in the right hand, if anything
  if (L.hand === 'tankard') {
    // A pewter tankard in the right hand, frothing over.
    const pewter = M('#b9bec4', { metalness: 0.7, roughness: 0.3 }), foam = M('#fff6d8'), tk = new THREE.Group();
    tk.add(part(new THREE.CylinderGeometry(0.075, 0.08, 0.17, 14), pewter));
    const froth = part(new THREE.SphereGeometry(0.085, 12, 8), foam, 0, 0.09);
    froth.scale.y = 0.55;
    const handle = part(new THREE.TorusGeometry(0.05, 0.014, 6, 12, Math.PI), pewter, -0.08);
    handle.rotation.z = Math.PI / 2;
    tk.add(froth, part(new THREE.CapsuleGeometry(0.022, 0.07, 4, 8), foam, 0.05, 0.04, 0.05), handle);
    tk.position.set(0, -0.56, 0.1);
    arms[0].add(tk);
    held = tk;
  } else if (L.hand === 'spyglass') {
    // A brass spyglass in the right hand, drawn out: a narrow eyepiece, a leather grip, a wide end
    // with a rim. Along its own +z from where it's held (the eyepiece behind), carried pointing down
    // and forward; a scene raises it to an eye by turning the arm and it (`held`).
    const brass = M('#c9a13c', { metalness: 0.75, roughness: 0.3 }), leather = M('#5a3420', { roughness: 0.8 }), glass = M('#9fd3e6', { metalness: 0.2, roughness: 0.1 });
    const sp = new THREE.Group(), seg = (r0, r1, len, z, m) => { const c = part(new THREE.CylinderGeometry(r1, r0, len, 14), m, 0, 0, z); c.rotation.x = Math.PI / 2; sp.add(c); };
    seg(0.022, 0.022, 0.1, -0.12, brass);    // the eyepiece
    seg(0.026, 0.026, 0.012, -0.068, brass);
    seg(0.032, 0.032, 0.12, 0.0, leather);   // the grip
    seg(0.036, 0.036, 0.016, 0.066, brass);
    seg(0.036, 0.042, 0.2, 0.17, brass);     // the wide end
    seg(0.05, 0.05, 0.03, 0.28, brass);      // its rim
    const lens = part(new THREE.CircleGeometry(0.042, 14), glass, 0, 0, 0.296);
    sp.add(lens);
    sp.position.set(0, -0.56, 0.04);
    sp.rotation.x = 1.0;
    arms[0].add(sp);
    held = sp;
  }
  // A familiar rides on the left shoulder, as in Puzzle Pirates' portraits.
  const fam = makeFamiliar(L);
  if (fam) {
    fam.g.position.set(shX + 0.05, 0.6, 0);
    body.add(fam.g);
  }
  g.traverse((x) => { if (x.isMesh) x.castShadow = true; });
  return { g, legs, arms, body, phase: 0, fam, look: L, held };
}

// ---------- familiars ----------
function makeFamiliar(L) {
  if (L.fam === 'none' || !PARTS.fam[L.body].some(([id]) => id === L.fam)) return null;
  const g = new THREE.Group(), black = M('#121212'), white = M('white');
  const eyes = (r, x, y, z) => [-1, 1].forEach((s) => { g.add(part(new THREE.SphereGeometry(r, 8, 6), white, x * s, y, z)); g.add(part(new THREE.SphereGeometry(r * 0.55, 6, 5), black, x * s, y, z + r * 0.6)); });
  const fam = { g, kind: L.fam, t: Math.random() * 10 };
  if (L.fam === 'parrot') {
    const c1 = M(L.famCol), c2 = M(L.famCol2);
    const bodyM = part(new THREE.SphereGeometry(0.085, 12, 10), c1, 0, 0.12, 0);
    bodyM.scale.set(0.85, 1.3, 0.95);
    const head = new THREE.Group();
    head.position.set(0, 0.24, 0.02);
    head.add(part(new THREE.SphereGeometry(0.065, 12, 10), c1));
    const beak = part(new THREE.ConeGeometry(0.026, 0.07, 8), M('#f2c14e'), 0, -0.012, 0.075);
    beak.rotation.x = Math.PI / 2 + 0.5;
    head.add(beak);
    [-1, 1].forEach((s) => { head.add(part(new THREE.SphereGeometry(0.02, 8, 6), white, 0.045 * s, 0.015, 0.035)); head.add(part(new THREE.SphereGeometry(0.011, 6, 5), black, 0.055 * s, 0.017, 0.042)); });
    const wings = [-1, 1].map((s) => {
      const w = new THREE.Group();
      w.position.set(0.07 * s, 0.18, -0.01);
      const f = part(new THREE.SphereGeometry(0.06, 10, 8), c2, 0, -0.07, 0);
      f.scale.set(0.35, 1.5, 0.9);
      w.add(f);
      g.add(w);
      return w;
    });
    const tail = part(new THREE.BoxGeometry(0.06, 0.2, 0.02), c2, 0, -0.02, -0.07);
    tail.rotation.x = 0.45;
    g.add(bodyM, head, tail);
    [-1, 1].forEach((s) => g.add(part(new THREE.SphereGeometry(0.018, 6, 5), M('#555'), 0.03 * s, 0.01, 0.03)));
    Object.assign(fam, { head, wings });
  } else if (L.fam === 'monkey') {
    const fur = M(FUR[L.famCol] || L.famCol), face = M(FUR_FACE[L.famCol] || '#e8c9a0');
    const bodyM = part(new THREE.SphereGeometry(0.095, 12, 10), fur, 0, 0.1, 0);
    bodyM.scale.set(1, 1.15, 0.9);
    if (FUR_FACE[L.famCol]) {
      const tum = part(new THREE.SphereGeometry(0.07, 10, 8), face, 0, 0.09, 0.04);
      tum.scale.set(0.9, 1.1, 0.8);
      g.add(tum);
    }
    const head = new THREE.Group();
    head.position.set(0, 0.25, 0.02);
    head.add(part(new THREE.SphereGeometry(0.085, 12, 10), fur));
    const mask = part(new THREE.SphereGeometry(0.066, 12, 10), face, 0, -0.012, 0.045);
    mask.scale.set(1, 0.9, 0.6);
    head.add(mask);
    [-1, 1].forEach((s) => {
      const ear = part(new THREE.SphereGeometry(0.035, 8, 6), face, 0.088 * s, 0.01, 0);
      ear.scale.z = 0.5;
      head.add(ear);
      head.add(part(new THREE.SphereGeometry(0.018, 8, 6), black, 0.032 * s, 0.014, 0.083));
      head.add(part(new THREE.SphereGeometry(0.006, 5, 4), white, 0.036 * s, 0.021, 0.099));   // (a glint)
    });
    // A little mouth, shut; a scene opens it (chattering).
    const mouth = part(new THREE.SphereGeometry(0.016, 8, 6), M('#4a2233'), 0, -0.042, 0.079);
    mouth.scale.set(1.3, 0.3, 0.5);
    head.add(mouth);
    const curve = new THREE.CatmullRomCurve3([[0, 0.04, -0.08], [0, -0.1, -0.17], [0.05, -0.28, -0.16], [0, -0.38, -0.07], [-0.05, -0.32, -0.02]].map((p) => new THREE.Vector3(...p)));
    const tailG = new THREE.Group();
    tailG.add(part(new THREE.TubeGeometry(curve, 24, 0.016, 6), fur));
    [-1, 1].forEach((s) => g.add(part(new THREE.SphereGeometry(0.035, 8, 6), fur, 0.055 * s, 0.03, 0.07)));
    // Little arms from the shoulders, paws folded on the tummy; a scene can move them (familiars do
    // things in the scenes: the user, 10 Nov). [0] is the monkey's right, as a pirate's arms.
    const arms = [-1, 1].map((s) => {
      const a = new THREE.Group();
      a.position.set(0.075 * s, 0.16, 0.03);
      a.add(part(new THREE.CapsuleGeometry(0.019, 0.06, 4, 8), fur, 0, -0.045, 0));
      a.add(part(new THREE.SphereGeometry(0.024, 8, 6), face, 0, -0.09, 0));
      a.rotation.set(-0.75, 0, -0.35 * s);
      g.add(a);
      return a;
    });
    g.add(bodyM, head, tailG);
    Object.assign(fam, { head, tail: tailG, arms, mouth });
  } else if (L.fam === 'octopus') {
    const c = M(L.famCol);
    const mantle = part(new THREE.SphereGeometry(0.1, 14, 12), c, 0, 0.19, -0.01);
    mantle.scale.set(1, 1.3, 1);
    g.add(mantle);
    eyes(0.028, 0.045, 0.14, 0.075);
    const arms = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3, ca = Math.cos(a), sa = Math.sin(a);
      const curve = new THREE.CatmullRomCurve3([[ca * 0.06, 0.08, sa * 0.06], [ca * 0.13, 0.0, sa * 0.13], [ca * 0.16, -0.1, sa * 0.15], [ca * 0.12, -0.17, sa * 0.1]].map((p) => new THREE.Vector3(...p)));
      const arm = new THREE.Group();
      arm.add(part(new THREE.TubeGeometry(curve, 16, 0.02, 6), c));
      g.add(arm);
      arms.push(arm);
    }
    Object.assign(fam, { tentacles: arms });
  }
  return fam;
}
// Little bits of life: a parrot bobs and now and then flaps, a monkey looks about and swishes its
// tail, an octopus wriggles.
export function familiarTick(fam, dt) {
  if (!fam) return;
  const t = (fam.t += dt);
  if (fam.kind === 'parrot') {
    fam.head.rotation.x = Math.sin(t * 3) * 0.12;
    fam.head.rotation.y = Math.sin(t * 0.7) * 0.5;
    const flap = (t % 5) < 0.8 ? Math.abs(Math.sin(t * 18)) * 0.9 : 0;
    fam.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * flap; });
  } else if (fam.kind === 'monkey') {
    fam.head.rotation.y = Math.sin(t * 0.9) * 0.6;
    fam.tail.rotation.y = Math.sin(t * 1.6) * 0.35;
  } else if (fam.kind === 'octopus') fam.tentacles.forEach((a, i) => { a.rotation.x = Math.sin(t * 2.5 + i) * 0.15; a.rotation.z = Math.cos(t * 2 + i * 1.3) * 0.12; });
}

// ---------- the den's Jolly Roger ----------
export const FLAGS = [['skull', 'Skull and crossbones'], ['cutlass', 'Skull and cutlasses'], ['anchor', 'Anchor'], ['kraken', 'Kraken'], ['heart', 'Bleeding heart']];
export const PATTERNS = [['plain', 'Plain'], ['border', 'Border'], ['stripes', 'Stripes'], ['hoist', 'Hoist band']];
// Things you can put up round the den (Decorate).
export const DECOR = [['flag', 'Jolly Roger'], ['banner', 'Banner'], ['lantern', 'Lantern'], ['barrel', 'Rum barrel']];
export const MAX_DECOR = 24;
const DESIGN = { flag: 'skull', flagCol: 'black', flagCol2: 'white', flagCol3: 'red', pat: 'plain' };
// Where the den is: the barren cave it started as, a seaside hideout or a jungle one.
export const BIOMES = [['barren', 'Barren cave'], ['seaside', 'Seaside hideout'], ['jungle', 'Jungle hideout']];
// The gun tower's paint: gunwale, rail and crates ('none' is Gunnery's own red, gold and light wood).
export const DEFAULT_DEN = { ...DESIGN, paint: 'none', roof: 'maroon', gunwale: 'none', rail: 'none', crates: 'none', biome: 'barren', decor: [] };
// A flag's design: its emblem, pattern and three colours.
export function cleanDesign(o) {
  const src = o && typeof o === 'object' ? o : {}, D = { ...DESIGN };
  if (FLAGS.some(([id]) => id === src.flag)) D.flag = src.flag;
  if (PATTERNS.some(([id]) => id === src.pat)) D.pat = src.pat;
  for (const kk of ['flagCol', 'flagCol2', 'flagCol3']) if (DYES[src[kk]]) D[kk] = src[kk];
  return D;
}
export const designOf = (D) => ({ flag: D.flag, flagCol: D.flagCol, flagCol2: D.flagCol2, flagCol3: D.flagCol3, pat: D.pat });
export function cleanDen(o) {
  const src = o && typeof o === 'object' ? o : {}, D = { ...DEFAULT_DEN, ...cleanDesign(src) };
  for (const kk of ['paint', 'roof', 'gunwale', 'rail', 'crates']) if (src[kk] === 'none' || DYES[src[kk]]) D[kk] = src[kk];
  if (BIOMES.some(([id]) => id === src.biome)) D.biome = src.biome;
  const num = (v, a, b) => (typeof v === 'number' && isFinite(v) ? Math.max(a, Math.min(b, v)) : null);
  D.decor = (Array.isArray(src.decor) ? src.decor : []).slice(0, MAX_DECOR).map((it) => {
    if (!it || !DECOR.some(([id]) => id === it.k)) return null;
    const x = num(it.x, -40, 40), z = num(it.z, -5, 15), r = num(it.r, 0, 3);
    if (x == null || z == null) return null;
    return { k: it.k, x, z, r: Math.round(r || 0), ...(it.k === 'flag' || it.k === 'banner' ? { d: cleanDesign(it.d) } : {}) };
  }).filter(Boolean);
  return D;
}
export function drawFlag(x, w, h, D) {
  const f = hexOf(D.flagCol), p3 = hexOf(D.flagCol3 || 'red');
  x.fillStyle = f; x.fillRect(0, 0, w, h);
  let ox = 0;
  if (D.pat === 'border') { const b = Math.min(w, h) * 0.09; x.strokeStyle = p3; x.lineWidth = b * 2; x.strokeRect(0, 0, w, h); }
  else if (D.pat === 'stripes') { x.fillStyle = p3; for (let i = 1; i < 7; i += 2) x.fillRect(0, i * h / 7, w, h / 7); }
  else if (D.pat === 'hoist') { x.fillStyle = p3; ox = (w > h ? w : h * 0.0) * 0.22; if (w > h) x.fillRect(0, 0, ox, h); else x.fillRect(0, 0, w, h * 0.2); }
  const e = hexOf(D.flagCol2), cx = w / 2 + ox / 2, cy = h / 2 + (w <= h && D.pat === 'hoist' ? h * 0.1 : 0), s = Math.min(h, w * 0.64) / 100;
  if (D.pat === 'stripes') { x.fillStyle = f; x.beginPath(); x.ellipse(cx, cy, 52 * s, 46 * s, 0, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = x.strokeStyle = e; x.lineCap = 'round'; x.lineJoin = 'round';
  const skull = (y) => {
    x.beginPath(); x.arc(cx, y, 20 * s, 0, Math.PI * 2); x.fill();
    x.fillRect(cx - 11 * s, y + 10 * s, 22 * s, 16 * s);
    x.fillStyle = f;
    for (const d of [-1, 1]) { x.beginPath(); x.arc(cx + d * 8 * s, y - 1 * s, 6 * s, 0, Math.PI * 2); x.fill(); }
    x.beginPath(); x.moveTo(cx, y + 6 * s); x.lineTo(cx - 3 * s, y + 12 * s); x.lineTo(cx + 3 * s, y + 12 * s); x.fill();
    for (let i = -1; i <= 1; i++) x.fillRect(cx + i * 6 * s - 1 * s, y + 18 * s, 2 * s, 8 * s);
    x.fillStyle = e;
  };
  const bone = (a) => {
    const dx = Math.cos(a) * 38 * s, dy = Math.sin(a) * 38 * s;
    x.lineWidth = 8 * s; x.beginPath(); x.moveTo(cx - dx, cy + 14 * s - dy); x.lineTo(cx + dx, cy + 14 * s + dy); x.stroke();
    for (const k of [-1, 1]) for (const o of [-1, 1]) { x.beginPath(); x.arc(cx + k * dx + o * Math.sin(a) * 5 * s, cy + 14 * s + k * dy - o * Math.cos(a) * 5 * s, 6 * s, 0, Math.PI * 2); x.fill(); }
  };
  const cutlass = (d) => {
    x.save(); x.translate(cx, cy + 12 * s); x.rotate(d * 0.75);
    x.lineWidth = 7 * s; x.beginPath(); x.moveTo(0, 40 * s); x.quadraticCurveTo(6 * s * d, -10 * s, 0, -42 * s); x.stroke();
    x.lineWidth = 5 * s; x.beginPath(); x.moveTo(-10 * s, 30 * s); x.lineTo(10 * s, 30 * s); x.stroke();
    x.restore();
  };
  if (D.flag === 'skull') { bone(0.5); bone(-0.5); skull(cy - 12 * s); }
  else if (D.flag === 'cutlass') { cutlass(1); cutlass(-1); skull(cy - 16 * s); }
  else if (D.flag === 'anchor') {
    x.lineWidth = 9 * s;
    x.beginPath(); x.moveTo(cx, cy - 30 * s); x.lineTo(cx, cy + 32 * s); x.stroke();
    x.beginPath(); x.moveTo(cx - 18 * s, cy - 18 * s); x.lineTo(cx + 18 * s, cy - 18 * s); x.stroke();
    x.beginPath(); x.arc(cx, cy - 36 * s, 7 * s, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.arc(cx, cy + 4 * s, 30 * s, 0.25 * Math.PI, 0.75 * Math.PI); x.stroke();
    for (const d of [-1, 1]) { x.beginPath(); x.moveTo(cx + d * 21 * s, cy + 25 * s); x.lineTo(cx + d * 33 * s, cy + 12 * s); x.lineTo(cx + d * 30 * s, cy + 30 * s); x.fill(); }
  } else if (D.flag === 'kraken') {
    x.beginPath(); x.ellipse(cx, cy - 14 * s, 20 * s, 24 * s, 0, 0, Math.PI * 2); x.fill();
    x.lineWidth = 7 * s;
    for (let i = 0; i < 6; i++) {
      const sx = cx - 15 * s + i * 6 * s, side = i < 3 ? -1 : 1;
      x.beginPath(); x.moveTo(sx, cy + 4 * s); x.bezierCurveTo(sx + side * 10 * s, cy + 22 * s, sx + side * 26 * s, cy + 18 * s, sx + side * (22 + i % 3 * 6) * s, cy + 38 * s); x.stroke();
    }
    x.fillStyle = f;
    for (const d of [-1, 1]) { x.beginPath(); x.arc(cx + d * 8 * s, cy - 12 * s, 5 * s, 0, Math.PI * 2); x.fill(); }
  } else if (D.flag === 'heart') {
    x.beginPath(); x.moveTo(cx, cy + 22 * s);
    x.bezierCurveTo(cx - 40 * s, cy - 4 * s, cx - 22 * s, cy - 36 * s, cx, cy - 16 * s);
    x.bezierCurveTo(cx + 22 * s, cy - 36 * s, cx + 40 * s, cy - 4 * s, cx, cy + 22 * s); x.fill();
    for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(cx - 8 * s + i * 8 * s, cy + 30 * s + i % 2 * 6 * s, 3 * s, 5 * s, 0, 0, Math.PI * 2); x.fill(); }
    x.lineWidth = 6 * s; x.beginPath(); x.moveTo(cx + 26 * s, cy - 36 * s); x.lineTo(cx - 4 * s, cy - 2 * s); x.stroke();
  }
}
export const dyeHex = hexOf;
