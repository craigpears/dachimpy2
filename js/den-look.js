/* Pirate Den: how a pirate looks. A male or female pirate dressed from Puzzle Pirates' own tailor
   (the clothing names are YPPedia's), in its standard dyes, with a familiar on the shoulder if you
   like. Everything is simple shapes on the same body, so it stays cheap to draw. Also the den's
   Jolly Roger flags. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// The tailor's standard palette (YPPedia: Clothing palette).
export const DYES = {
  // (Blue and light blue sampled from Tzz's portrait, 13 Nov: her knickers' stripes and her Rag shirt; the
  // wiki's swatches were a deep royal blue and an icy cyan the game doesn't draw.)
  aqua: '#65c9c9', black: '#2a2a2e', blue: '#4d78cf', brown: '#7d5c35', gold: '#ffbe00', green: '#3b6c2c', grey: '#cbcdd1',
  lavender: '#d9b0ff', 'light blue': '#8cc8f6', 'light green': '#669619', lime: '#3fd837', lemon: '#fffbbf', magenta: '#c9227b',
  maroon: '#9e171b', mint: '#90ffb9', navy: '#434ca2', orange: '#f57c09', peach: '#ffd5a8', persimmon: '#ff5300', pink: '#fe79a4',
  purple: '#6104ad', red: '#d72c22', rose: '#ffc4d6', tan: '#ad8047', violet: '#bf3bc4', white: '#f6f2ea', yellow: '#f8ff35',
  // Limited editions real pirates wear: named as on YPPedia (Clothing palette), coloured as the game
  // draws them, sampled from a portrait (the wiki's swatches aren't faithful): Dignity's coat
  // (shadow) and its facings (atlantean), from hers (10 Nov).
  shadow: '#674c7b', atlantean: '#afb8fe',
  // Mischievious's (her Emerald portraits, 11 Nov): plum (a seasonal limited edition: her dress and
  // boots in "Son of a Nutcracker!") and crimson (the deep, blue-ish red of her "What is Love?" gown).
  plum: '#86094f', crimson: '#a8031f',
  // Tzz's D'rizzle (her Emerald portrait, 11 Nov): a dragon in silver and vibrant red, the February 2025
  // gold box's (YPPedia: Dragon, "Silver/Vibrant Red"; silver is also a clothing chroma, YPPedia:
  // Clothing palette). Sampled from her portrait: his horns, and his body.
  silver: '#a6a9bf', 'vibrant red': '#d7094a',
};
// (The last, a cool deep brown: Helium's, sampled from their portrait, 13 Nov; the warmer browns before it
// drew them orange.)
export const SKIN = ['#f6d3b0', '#f0bf8e', '#d9a066', '#b57a4a', '#8a5530', '#5c3a22', '#9a887c'];
// (Red: Mischievious's deep red curls, from her portraits, 11 Nov. Light brown: Tzz's, sampled from hers.
// Silver: Helium's, sampled from theirs, 13 Nov: a grey-white, not Gravee's white.)
export const HAIR = { black: '#1f1a17', 'dark brown': '#3b2414', brown: '#6a4020', 'light brown': '#8e7543', auburn: '#7f2e16', red: '#9a0a08', ginger: '#c4642a', blonde: '#dcb565', grey: '#a09a92', silver: '#b2b9c6', white: '#ece8e0' };
// Monkeys and squirrels only come in natural colours (YPPedia: Monkey), white (a champion's) and a
// few limited editions (lavender, from a Booch Box; pink, Mischievious's monkey in "What is Love?").
// A lavender monkey has a white face and tummy. (Plum: Helium's King, their Emerald pirate page's "plum"
// monkey, a violet in his portrait, sampled from it, 12 Nov, and again closer, 13 Nov: a deeper, bluer purple
// than first drawn, his face and tummy a pale lilac; not the plum dye, a magenta.)
export const FUR = { brown: '#6b4423', tan: '#ad8047', ginger: '#b5652a', grey: '#8a8a8a', black: '#2a2a2e', cream: '#e9dcc0', white: '#f7f5f0', lavender: '#b9a9ea', pink: '#be667f', plum: '#734b91' };
const FUR_FACE = { lavender: '#fbf8ff', plum: '#a98bc4' };
// Familiars in FUR's natural colours (the rest take any dye), and the colour each falls back to.
export const FURRY = { monkey: 'brown', squirrel: 'grey' };
// The palette a slot's first colour is chosen from, for the wardrobe: FUR for a furry familiar.
export const paletteOf = (look, slot) => (slot === 'fam' && FURRY[look.fam] ? FUR : DYES);

/* What there is to wear, by body. Each: [id, name, uses a second colour?]. Every piece a real
   pirate in the den wears (PIRATES, below) is here too, for both bodies where it makes sense, so you
   can dress as any of them piece by piece (the user, 10 Nov). */
export const PARTS = {
  // (Veil, Tiara: the tailor's. Butterfly, Feminine feline, Wicked witch: the palace shoppe's
  // Halloween masks and hats, women's only: YPPedia, Clothing (hats). Berserker pelt: a bear's head and
  // its fur, either body, a prize from a 2011 event made since from a design: YPPedia; Gravee's, white.)
  hat: {
    m: [['none', 'No hat'], ['bandana', 'Bandana'], ['tricorne', 'Tricorne'], ['feathered', 'Feathered hat', 1], ['captain', "Captain's hat", 1], ['sleeping', 'Sleeping hat'], ['fez', 'Fez'], ['viking', 'Viking helmet'], ['roses', 'Crown of roses', 1], ['pelt', 'Berserker pelt']],
    f: [['none', 'No hat'], ['bandana', 'Bandana'], ['tricorne', 'Tricorne'], ['feathered', 'Feathered hat', 1], ['captain', "Captain's hat", 1], ['sleeping', 'Sleeping hat'], ['wide', 'Wide-brimmed hat', 1], ['viking', 'Viking helmet'],
      ['veil', 'Veil', 1], ['tiara', 'Tiara', 1], ['butterfly', 'Butterfly'], ['feline', 'Feminine feline', 1], ['witch', 'Wicked witch', 1], ['roses', 'Crown of roses', 1], ['pelt', 'Berserker pelt']],
  },
  // (Swept up: Helium's, swept up off the face and over the crown, a fall of it by one cheek, 13 Nov. Twists:
  // Tzz's, twisted locks drawn back over the head and tied behind, 13 Nov.)
  hair: {
    m: [['short', 'Short'], ['ponytail', 'Ponytail'], ['long', 'Long'], ['wavy', 'Wavy'], ['curly', 'Curly'], ['swept', 'Swept up'], ['twists', 'Twists'], ['bald', 'Bald']],
    f: [['long', 'Long'], ['ponytail', 'Ponytail'], ['bun', 'Bun'], ['braids', 'Braids'], ['wavy', 'Wavy'], ['curly', 'Curly'], ['swept', 'Swept up'], ['twists', 'Twists'], ['short', 'Short']],
  },
  beard: {
    m: [['full', 'Full beard'], ['bushy', 'Bushy beard'], ['goatee', 'Goatee'], ['moustache', 'Moustache'], ['long', 'Long beard'], ['none', 'Clean-shaven']],
    f: [['none', 'None']],
  },
  top: {
    m: [['striped', 'Striped shirt', 1], ['plain', 'Plain shirt'], ['sash', 'Shirt with sash', 1], ['vest', 'Striped shirt with vest', 1], ['swashbuckler', "Swashbuckler's jacket", 1], ['buccaneer', 'Buccaneer jacket', 1], ['captain', "Captain's jacket", 1],
      ['frilly', 'Frilly shirt with sash', 1], ['raiment', 'Vampire raiment', 1], ['rag', 'Rag shirt']],
    f: [['striped', 'Striped shirt', 1], ['belt', 'Shirt with belt'], ['corset', 'Corset', 1], ['vest', 'Striped shirt with vest', 1], ['buccaneer', 'Buccaneer jacket', 1], ['swashbuckler', "Swashbuckler's jacket", 1], ['captain', "Captain's jacket", 1],
      ['dresstop', 'Dress top', 1], ['frilly', 'Frilly shirt with sash', 1], ['midriff', 'Midriff blouse with scarf', 1], ['raiment', 'Vampire raiment', 1], ['tied', 'Top tied at the front'], ['rag', 'Rag shirt']],
  },
  // Round the waist, over whatever top (a plain belt isn't worn with a corset or a shirt with sash).
  waist: {
    m: [['belt', 'Belt'], ['buckle', 'Belt with a big buckle'], ['sash', 'Sash'], ['none', 'Nothing']],
    f: [['belt', 'Belt'], ['buckle', 'Belt with a big buckle'], ['sash', 'Sash'], ['none', 'Nothing']],
  },
  legs: {
    m: [['pants', 'Pants'], ['patched', 'Patched pants', 1], ['knickers', 'Stripy knickers'], ['pantaloons', 'Pantaloons'], ['kilt', 'Kilt', 1]],
    f: [['pants', 'Pants'], ['patched', 'Patched pants', 1], ['knickers', 'Stripy knickers'], ['flare', 'Flare pants'], ['long', 'Long dress bottom'], ['short', 'Short dress bottom'],
      ['gown', 'Gown', 1], ['bloomers', 'Bloomers', 1], ['ragged', 'Ragged skirt']],
  },
  feet: {
    m: [['boots', 'Boots'], ['shoes', 'Buckle shoes'], ['fancy', 'Fancy boots', 1], ['curled', 'Curled boots'], ['bare', 'Bare feet']],
    f: [['boots', 'Boots'], ['shoes', 'Buckle shoes'], ['fancy', 'Fancy boots', 1], ['curled', 'Curled slippers'], ['bare', 'Bare feet']],
  },
  // In the right hand: props, not clothing (only a bouquet and a present take a colour: its flowers', its paper).
  // (The Atlantis trinket: Helium's, a glowing blue jar worked in gold, from their portrait, 13 Nov.)
  hand: {
    m: [['none', 'Nothing'], ['tankard', 'Tankard'], ['spyglass', 'Spyglass'], ['bouquet', 'Bouquet'], ['pistol', 'Pistol'], ['goblet', 'Wine glass'], ['scepter', 'Sceptre'], ['jug', 'Stone jug'], ['candle', 'Candle'], ['gift', 'Present'], ['atlantis', 'Atlantis trinket']],
    f: [['none', 'Nothing'], ['tankard', 'Tankard'], ['spyglass', 'Spyglass'], ['bouquet', 'Bouquet'], ['pistol', 'Pistol'], ['goblet', 'Wine glass'], ['scepter', 'Sceptre'], ['jug', 'Stone jug'], ['candle', 'Candle'], ['gift', 'Present'], ['atlantis', 'Atlantis trinket']],
  },
  // (Squirrel, bat, krakling: real familiars, from expeditions and treasure chests: YPPedia, Familiar.
  // Dragon: from gold boxes; its first colour is its horns', its second its body's, as YPPedia says
  // dragons' colours go: Tzz's D'rizzle, silver and vibrant red.)
  fam: {
    m: [['none', 'No familiar'], ['parrot', 'Parrot', 1], ['monkey', 'Monkey'], ['octopus', 'Octopus'], ['squirrel', 'Squirrel'], ['bat', 'Bat'], ['krakling', 'Krakling'], ['dragon', 'Dragon', 1]],
    f: [['none', 'No familiar'], ['parrot', 'Parrot', 1], ['monkey', 'Monkey'], ['octopus', 'Octopus'], ['squirrel', 'Squirrel'], ['bat', 'Bat'], ['krakling', 'Krakling'], ['dragon', 'Dragon', 1]],
  },
};
// The props that take a colour (the rest are what they're made of).
export const HAND_DYED = ['bouquet', 'gift'];
// Earrings: none, one or one in each ear. One is in the right ear, the eyepatch's side, as the portraits
// have it (Tzz's and Helium's, 13 Nov).
export const EARRINGS = [[false, 'None'], [true, 'One'], ['both', 'Both ears']];
// `hook`: a hook for a left hand (Mischievious has one in nearly every portrait). `tongue` out, blue
// swirling `tattoos` (on whatever skin a top leaves bare) and a `wristband` (in the top's colour, on
// the right wrist): Kikkit's (11 Nov). A blue `starfish` stuck to the cheek: Gravee's (her portrait, 11
// Nov; a starfish on the face is a Puzzle Pirates thing: YPPedia lists Starfish repellent for it). A
// `pegleg` for the right leg: Tzz's (her portrait, 11 Nov). The eyepatch, the hook, the pegleg and the
// starfish are Puzzle Pirates' four injuries, from being sunk (YPPedia: Injury). A `grin`, the mouth wide
// open, laughing: Tzz's (her portrait, 13 Nov).
export const DEFAULT_LOOK = {
  body: 'm', skin: 1, hair: 'short', hairCol: 'brown', beard: 'full', patch: true, earring: true, smile: false, grin: false, hook: false, tongue: false, tattoos: false, wristband: false, starfish: false, pegleg: false,
  hat: 'bandana', hatCol: 'red', hatCol2: 'white', top: 'striped', topCol: 'red', topCol2: 'white', waist: 'belt', waistCol: 'black',
  legs: 'pants', legsCol: 'navy', legsCol2: 'tan', feet: 'boots', feetCol: 'black', feetCol2: 'black', hand: 'none', handCol: 'red', fam: 'none', famCol: 'green', famCol2: 'red',
};
const DYE_KEYS = ['hatCol', 'hatCol2', 'topCol', 'topCol2', 'waistCol', 'legsCol', 'legsCol2', 'feetCol', 'feetCol2', 'handCol', 'famCol', 'famCol2'];
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
  for (const kk of ['patch', 'smile', 'grin', 'hook', 'tongue', 'tattoos', 'wristband', 'starfish', 'pegleg']) if (typeof src[kk] === 'boolean') L[kk] = src[kk];
  if (EARRINGS.some(([v]) => v === src.earring)) L.earring = src.earring;
  if (FURRY[L.fam]) L.famCol = FUR[src.famCol] ? src.famCol : FURRY[L.fam];
  return L;
}
const pickOf = (o) => Object.keys(o)[Math.floor(Math.random() * Object.keys(o).length)];
const pickIn = (list) => list[Math.floor(Math.random() * list.length)][0];
export function randomLook(body = Math.random() < 0.5 ? 'm' : 'f') {
  const L = { body, skin: Math.floor(Math.random() * SKIN.length), hairCol: pickOf(HAIR), patch: Math.random() < 0.4, earring: pickIn(EARRINGS), smile: Math.random() < 0.5, grin: Math.random() < 0.15, hook: Math.random() < 0.15,
    tongue: Math.random() < 0.08, tattoos: Math.random() < 0.15, wristband: Math.random() < 0.15, starfish: Math.random() < 0.05, pegleg: Math.random() < 0.08 };
  for (const slot of Object.keys(PARTS)) L[slot] = pickIn(PARTS[slot][body]);
  for (const kk of DYE_KEYS) L[kk] = pickOf(DYES);
  if (FURRY[L.fam]) L.famCol = pickOf(FUR);
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
  // Mischievious (Emerald), as in her portrait now, "Son of a Nutcracker!" (a Wanted poster, 26 Oct
  // 2026; checked 11 Nov): a mass of black curls, a big grin, gold earrings; the Feminine feline
  // (a black eye mask with cat's ears), a plum Dress top trimmed white, a plum short dress bottom,
  // plum fancy boots with white tops; a pistol in her right hand, a hook for her left, her grey squirrel.
  Mischievious: {
    body: 'f', skin: 2, hair: 'curly', hairCol: 'black', patch: false, earring: 'both', smile: true, hook: true,
    hat: 'feline', hatCol: 'black', hatCol2: 'black', top: 'dresstop', topCol: 'plum', topCol2: 'white', waist: 'none',
    legs: 'short', legsCol: 'plum', feet: 'fancy', feetCol: 'plum', feetCol2: 'white', hand: 'pistol', fam: 'squirrel', famCol: 'grey',
  },
  // Kikkit (her Emerald portrait, as IDEAS.md has it, 10 Nov), out on her island by the reef: black
  // curls crowned with red roses, an eyepatch, gold hoops, her tongue out, blue swirling tattoos on her
  // arms and middle, a red top tied at the front, a red wristband, a ragged black skirt on a black belt
  // with a big gold buckle, bare feet, a stone jug marked XXX, and Rodrigo, her monkey (her ship's
  // named for him: the user, 10 Nov, "it's definitely Rodrigo").
  Kikkit: {
    body: 'f', skin: 1, hair: 'curly', hairCol: 'black', patch: true, earring: 'both', smile: false, tongue: true, tattoos: true, wristband: true,
    hat: 'roses', hatCol: 'red', top: 'tied', topCol: 'red', waist: 'buckle', waistCol: 'black',
    legs: 'ragged', legsCol: 'black', feet: 'bare', hand: 'jug', fam: 'monkey', famCol: 'brown',
  },
  // Gravee (her Emerald pirate page's portrait, checked 11 Nov), the portrait collector with a house in
  // the den's district (Bedside Manors): brown skin, white hair under a white Berserker pelt (a polar
  // bear's head, its snout over her brow, fangs at her forehead, its fur down to her shoulders), an
  // eyepatch, a blue starfish stuck to her cheek, a green Dress top (its puffed sleeves white) and a
  // green Gown with a white panel down the front, a hook for her left hand, a lit candle in her right,
  // and Spud, her tan monkey.
  Gravee: {
    body: 'f', skin: 3, hair: 'long', hairCol: 'white', patch: true, earring: false, smile: true, hook: true, starfish: true,
    hat: 'pelt', hatCol: 'white', top: 'dresstop', topCol: 'green', topCol2: 'white', waist: 'none',
    legs: 'gown', legsCol: 'green', legsCol2: 'white', feet: 'shoes', feetCol: 'black', hand: 'candle', fam: 'monkey', famCol: 'tan',
  },
  // Tzz (her Emerald pirate page's portrait, checked 11 Nov), who teaches Sailing as balloon animals on
  // her island by Kikkit's: light brown hair tied back, an eyepatch, a gold hoop earring, a big grin, a
  // ragged light blue Rag shirt off one shoulder, blue-and-white Stripy knickers to below the knee, a peg
  // leg, a bare foot, and on her shoulder D'rizzle, a red dragon with silver horns (silver, vibrant red).
  // (Looked at again closely, 13 Nov, the user: the quality "really needs working on": her hair's twisted
  // locks drawn back, not a smooth ponytail; her grin's open, laughing; a blue starfish on her cheek too.)
  Tzz: {
    body: 'f', skin: 1, hair: 'twists', hairCol: 'light brown', patch: true, earring: true, smile: true, grin: true, starfish: true, pegleg: true,
    hat: 'none', top: 'rag', topCol: 'light blue', waist: 'none',
    legs: 'knickers', legsCol: 'blue', feet: 'bare', hand: 'none', fam: 'dragon', famCol: 'silver', famCol2: 'vibrant red',
  },
  // Helium (their Emerald pirate page's portrait, checked 12 Nov), who teaches Distilling at the still on their
  // island past the checkpoint: dark skin, white hair swept up, the Feminine feline in black (a black eye
  // mask with cat's ears), an eyepatch, a gold hoop earring, a blue starfish on the cheek, a black Vampire
  // raiment (high collar, gold buttons, lined in gold), black pants, black fancy boots with plum tops, a
  // hook for the left hand, and King, their plum monkey, on their shoulder. Drawn as the pirate is, a woman.
  // Looked at again closely, 13 Nov (the user: the portrait "looks really good, but her character in the game
  // really does not"): their skin a cool deep brown, not orange; their hair silver and swept up off the face
  // over the crown, a fall of it by the right cheek (no bun: there's none in the portrait); the raiment cut
  // low at the front, its gold-lined tails flaring out at the hips; and in their right hand the glowing blue
  // Atlantis trinket, a jar worked in gold, a wardrobe item now.
  Helium: {
    body: 'f', skin: 6, hair: 'swept', hairCol: 'silver', patch: true, earring: true, smile: true, hook: true, starfish: true,
    hat: 'feline', hatCol: 'black', hatCol2: 'black', top: 'raiment', topCol: 'black', topCol2: 'gold', waist: 'none',
    legs: 'pants', legsCol: 'black', feet: 'fancy', feetCol: 'black', feetCol2: 'plum', hand: 'atlantis', fam: 'monkey', famCol: 'plum',
  },
}).map(([name, look]) => [name, cleanLook(look)]));

/* Mischievious through her gallery (Emerald, 399 portraits, checked 11 Nov), to choose which of her
   you'd marry: her portrait now and four of her most distinct, each by its own title (and `plain`,
   the same in plain letters). Always her: the curls, a hook for her left hand. */
const MISCH = { body: 'f', skin: 2, hair: 'curly', patch: false, earring: 'both', hook: true, waist: 'none', feet: 'shoes', feetCol: 'black' };
export const MISCHIEVIOUS_VERSIONS = [
  { title: 'Son of a Nutcracker!', plain: 'Son of a Nutcracker!', look: PIRATES.Mischievious },
  // (18 Feb 2023) Red curls, the red Feminine feline with black ears, a crimson Dress top and Gown, a
  // glass of wine, a pink monkey.
  { title: 'What is Love?', plain: 'What is Love?', look: { ...MISCH, hairCol: 'red', smile: false, hat: 'feline', hatCol: 'crimson', hatCol2: 'black',
    top: 'dresstop', topCol: 'crimson', topCol2: 'crimson', legs: 'gown', legsCol: 'crimson', legsCol2: 'crimson', hand: 'goblet', fam: 'monkey', famCol: 'pink' } },
  // (22 Sep 2020) Brown curls, an eyepatch, a gold Tiara with a white band, a purple Dress top and
  // Gown, a golden sceptre, a lemon krakling.
  { title: 'Taco Princess', plain: 'Taco Princess', look: { ...MISCH, hairCol: 'dark brown', patch: true, earring: false, smile: true, hat: 'tiara', hatCol: 'gold', hatCol2: 'white',
    top: 'dresstop', topCol: 'purple', topCol2: 'purple', legs: 'gown', legsCol: 'purple', legsCol2: 'purple', hand: 'scepter', fam: 'krakling', famCol: 'lemon' } },
  // (28 Oct 2024) The Wicked witch (a black hat, a lime face), a black Vampire raiment lined in gold,
  // a black Gown, a black bat.
  { title: '𝕎𝕀ℂ𝕂𝔼𝔻', plain: 'Wicked', look: { ...MISCH, hairCol: 'black', smile: true, hat: 'witch', hatCol: 'black', hatCol2: 'lime',
    top: 'raiment', topCol: 'black', topCol2: 'gold', legs: 'gown', legsCol: 'black', legsCol2: 'black', fam: 'bat', famCol: 'black' } },
  // (17 Feb 2024) Red curls, the red Feminine feline, a crimson Midriff blouse with a black scarf
  // (gold collar, armbands and belt), crimson Bloomers.
  { title: '🔥llǝH uɐɥ⊥ ɹǝʇʇoH🔥', plain: 'Hotter Than Hell', look: { ...MISCH, hairCol: 'red', smile: false, hat: 'feline', hatCol: 'crimson', hatCol2: 'black',
    top: 'midriff', topCol: 'crimson', topCol2: 'black', legs: 'bloomers', legsCol: 'crimson', legsCol2: 'crimson', feetCol: 'crimson' } },
].map((v) => ({ ...v, look: cleanLook(v.look) }));

// ---------- building one ----------
// (Three-digit hex too: '#fff', the white under a textured garment, fell to grey here and drew Stripy knickers,
// patched pants, a kilt and a sleeping hat at a quarter of their brightness, till 13 Nov.)
const hexOf = (c) => DYES[c] || HAIR[c] || FUR[c] || (/^#([0-9a-f]{3}){1,2}$/i.test(c) ? c : '#888888');
/* A pirate's shading, every part of them and their familiar (the user, 13 Nov, of Helium and Tzz beside
   their portraits: "the whole tone and colour of everything, like the shading"): the den's own light, then
   two cheap touches in the same shader, no extra lights or meshes. Undersides fall a little into shade, as
   a portrait's painted shading does, so each part has its form; and a soft sheen round the edges, half of it
   the part's own colour, so black clothes read as cloth and a figure stands out from what's behind it. */
function pirateShade(sh) {
  // (Lines joined, not a template's: the bundle keeps its line breaks few, tests/bundle.test.ts.)
  sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', [
    '{',
    '  vec3 wn = inverseTransformDirection( normal, viewMatrix );',
    '  outgoingLight *= mix( 0.78, 1.0, smoothstep( -0.85, 0.35, wn.y ) );',
    '  float rim = pow( 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) ), 3.0 );',
    '  outgoingLight += rim * 0.3 * mix( vec3( 0.86, 0.9, 1.0 ), diffuseColor.rgb, 0.4 );',
    '}',
    '#include <opaque_fragment>',
  ].join('\n'));
}
const PIRATE_SHADE = () => 'pirate-shade';
const M = (c, o = {}) => Object.assign(new THREE.MeshStandardMaterial({ color: hexOf(c), roughness: 0.85, ...o }), { onBeforeCompile: pirateShade, customProgramCacheKey: PIRATE_SHADE });
function part(geo, m, x = 0, y = 0, z = 0) {
  const p = new THREE.Mesh(geo, m);
  p.position.set(x, y, z);
  // (A pirate casts a shadow but takes none, even their own: lit whole, as in a portrait. Their own body's
  // shadow left everything below the waist murky: 13 Nov, beside Tzz's and Helium's portraits.)
  p.castShadow = true; p.receiveShadow = false;
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
// Stripes down (round a leg, say): Stripy knickers' (Tzz's portrait, 11 Nov: blue and white, down the leg).
const vstripeTex = (a, b, n = 10) => cached(`v${a}${b}${n}`, () => tex(64, 4, (g) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? hexOf(b) : hexOf(a); g.fillRect(i * 64 / n, 0, 64 / n + 0.5, 4); } }));
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
// Blue swirling tattoos on skin (Kikkit's): spirals and curls over the skin's colour.
const tattooTex = (sk) => cached(`ink${sk}`, () => tex(128, 128, (g, w, h) => {
  g.fillStyle = sk; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#2e5fb8'; g.lineWidth = 3; g.lineCap = 'round';
  for (const [x, y, r0] of [[28, 30, 16], [92, 44, 14], [54, 92, 18], [110, 108, 12], [12, 96, 10]]) {
    g.beginPath();
    for (let t = 0; t < 16; t++) { const a = t * 0.55, r = r0 * (1 - t / 18); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    g.stroke();
  }
}));
// Hair's strands: its colour, streaked lighter and darker across (down a head's cap, its strands fall from the
// crown), one per colour.
const hairTex = (c) => cached(`hair${c}`, () => tex(128, 4, (g, w, h) => {
  const base = new THREE.Color(hexOf(c)), k = new THREE.Color();
  let seed = 11, v = 0;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let x = 0; x < w; x++) {
    v = v * 0.55 + (rnd() - 0.5) * 0.6;
    k.copy(base).offsetHSL(0, 0, v * 0.14);
    g.fillStyle = `#${k.getHexString()}`; g.fillRect(x, 0, 1, h);
  }
}));
// A soft round glow, bright in the middle and gone at the edge (something glowing: Helium's trinket).
const glowTex = () => cached('glow', () => tex(64, 64, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}));
// A stone jug's glaze, XXX on it.
const jugTex = () => cached('jug', () => tex(64, 64, (g, w, h) => {
  g.fillStyle = '#cdbd9a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#5a3a22'; g.font = 'bold 13px serif'; g.textAlign = 'center'; g.fillText('XXX', w / 4, h * 0.6);
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
  // Blue swirling tattoos, on skin a top leaves bare (Kikkit's arms and middle).
  const inked = L.tattoos ? M('#ffffff', { map: tattooTex(SKIN[L.skin] || SKIN[1]) }) : skin;
  const gold = M('#e8b23a', { metalness: 0.7, roughness: 0.3 });
  // (Streaked with strands on a cap or a fall; plain on locks and curls, each its own strand.)
  const hairHex = hexOf(HAIR[L.hairCol] || L.hairCol), hairM = M('#ffffff', { map: hairTex(hairHex) }), hairPlain = M(hairHex);
  const top = L.topCol, top2 = L.topCol2;
  const shirtM = {
    striped: () => M('#ffffff', { map: stripeTex(top2, top) }), plain: () => M(top), sash: () => M(top), belt: () => M(top),
    vest: () => M('#ffffff', { map: stripeTex('white', top2) }), swashbuckler: () => M('white'), buccaneer: () => M('white'), captain: () => M('white'), corset: () => M('white'),
    dresstop: () => skin, midriff: () => skin, frilly: () => M('white'), raiment: () => M(top),   // (off the shoulder and a bare midriff: skin under them)
    tied: () => (L.tattoos ? inked : skin),
    rag: () => (F ? (L.tattoos ? inked : skin) : M(top)),   // (a woman's off one shoulder: skin under it)
  }[L.top]?.() || M(top);
  const coat = L.top === 'swashbuckler' || L.top === 'buccaneer' || L.top === 'captain', bucc = L.top === 'buccaneer';
  const sleeveM = coat ? M(top) : shirtM === skin || L.top === 'rag' ? inked : shirtM;

  // Legs: a thigh and a shin, from the hip, then the feet.
  const thinner = F ? 0.88 : 1;
  const thighM = { pants: () => M(L.legsCol), patched: () => M('#fff', { map: patchTex(L.legsCol, L.legsCol2) }), knickers: () => M('#fff', { map: vstripeTex('white', L.legsCol, 6) }),
    pantaloons: () => M(L.legsCol), flare: () => M(L.legsCol), kilt: () => skin, long: () => M(L.legsCol), short: () => M('white'), ragged: () => skin,
    gown: () => M(L.legsCol), bloomers: () => M(L.legsCol) }[L.legs]?.() || M(L.legsCol);
  // (Stockings under knickers and the like; bare legs over bare feet.)
  const shinM = { knickers: L.feet === 'bare' ? skin : white, pantaloons: white, kilt: white, short: white }[L.legs] || thighM;
  const legs = [-1, 1].map((s) => {
    const hip = new THREE.Group();
    hip.position.set((F ? 0.12 : 0.13) * s, 0.72, 0);
    const puffy = L.legs === 'pantaloons' || L.legs === 'bloomers';
    // (Stripy knickers are loose: Tzz's portrait, 13 Nov.)
    const knick = L.legs === 'knickers', loose = knick ? 1.15 : 1;
    const thigh = puffy ? part(new THREE.SphereGeometry(0.13, 12, 10), thighM, 0, -0.16) : part(new THREE.CylinderGeometry(0.095 * thinner * loose, 0.09 * thinner * loose, 0.31, 12), thighM, 0, -0.15);
    if (puffy) thigh.scale.set(1, 1.45, 1);
    // Bloomers: full and loose to the ankle, gathered there into a cuff in their second colour.
    const shin = L.legs === 'bloomers' ? part(new THREE.SphereGeometry(0.12, 12, 10), thighM, 0, -0.42) : part(new THREE.CylinderGeometry(0.088 * thinner, L.legs === 'flare' ? 0.14 : 0.08 * thinner, 0.29, 10), shinM, 0, -0.44);
    if (L.legs === 'bloomers') {
      shin.scale.set(1, 1.3, 1);
      hip.add(part(new THREE.CylinderGeometry(0.075, 0.08, 0.05, 10), M(L.legsCol2), 0, -0.55));
    }
    // A peg leg for the right leg (Tzz's): from under the knee, a leather cup and a wooden peg, no foot.
    // (Under Stripy knickers, which come to the middle of the shin, the peg starts below them.)
    const peg = L.pegleg && s === -1, pegTop = knick ? -0.5 : -0.36;
    hip.add(thigh);
    if (peg) {
      const wood = M('#94621c', { roughness: 0.7 });
      hip.add(part(new THREE.CylinderGeometry(0.085 * thinner, 0.06, 0.1, 10), M('#5a3a22'), 0, pegTop));
      hip.add(part(new THREE.CylinderGeometry(0.05, 0.03, pegTop + 0.66, 8), wood, 0, (pegTop - 0.74) / 2));
      hip.add(part(new THREE.CylinderGeometry(0.036, 0.036, 0.03, 8), M('#3a2a1a'), 0, -0.7));
    } else hip.add(shin);
    // Stripy knickers: on down over the knee to the middle of the shin, a band at the hem.
    if (knick) {
      hip.add(part(new THREE.CylinderGeometry(0.09 * thinner * loose, 0.098 * thinner * loose, 0.17, 12), thighM, 0, -0.38));
      hip.add(part(new THREE.CylinderGeometry(0.1 * thinner * loose, 0.1 * thinner * loose, 0.04, 12), M(L.legsCol), 0, -0.47));
    }
    const fc = M(L.feetCol);
    // (Under a dress the feet come a little further forward, so they peep out from under it.)
    const fz = L.legs === 'long' || L.legs === 'short' || L.legs === 'ragged' ? 0.1 : L.legs === 'gown' ? 0.16 : 0.05;
    if (peg) { /* (no foot on a peg) */ } else if (L.feet === 'bare') {
      // Bare feet: a foot in the skin's colour, and its toes.
      hip.add(part(new RoundedBoxGeometry(0.14 * thinner, 0.08, 0.25, 2, 0.035), skin, 0, -0.67, fz));
      for (let i = 0; i < 4; i++) hip.add(part(new THREE.SphereGeometry(0.022, 6, 5), skin, (-0.045 + i * 0.03) * thinner, -0.675, fz + 0.125));
    } else {
      const foot = part(new RoundedBoxGeometry(0.18 * thinner, L.feet === 'shoes' ? 0.1 : 0.15, 0.3, 2, 0.045), fc, 0, L.feet === 'shoes' ? -0.645 : -0.62, fz);
      hip.add(foot);
    }
    if ((L.feet === 'boots' || L.feet === 'fancy') && !peg) hip.add(part(new THREE.CylinderGeometry(0.1 * thinner, 0.1 * thinner, 0.24, 10), fc, 0, -0.48));
    // Fancy boots' wide turned-down tops, in their second colour.
    // (Low enough on the shin to show under a long coat.)
    if (L.feet === 'fancy' && !peg) hip.add(part(new THREE.CylinderGeometry(0.14 * thinner, 0.112 * thinner, 0.12, 12), M(L.feetCol2 || L.feetCol), 0, -0.39));
    if (L.feet === 'shoes' && !peg) hip.add(part(new THREE.BoxGeometry(0.08, 0.05, 0.02), gold, 0, -0.6, fz + 0.13));
    if (L.feet === 'curled' && !peg) {
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
  // (Nor anything round the waist of a midriff blouse: its scarf and belt are its own.)
  if (!(L.waist === 'belt' && (L.top === 'sash' || L.top === 'corset' || L.top === 'frilly')) && L.top !== 'midriff') waist();
  const rAt = (y) => { for (let i = 1; i < shape.length; i++) if (shape[i][1] >= y) { const [r0, y0] = shape[i - 1], [r1, y1] = shape[i]; return r0 + (r1 - r0) * (y - y0) / (y1 - y0); } return shape[shape.length - 1][0]; };
  const ring = (r, tube, y, m, z = 0) => { const t = part(new THREE.TorusGeometry(r, tube, 6, 28), m, 0, y, z); t.rotation.x = Math.PI / 2; body.add(t); return t; };
  const brass = M('#e8b23a', { metalness: 0.6, roughness: 0.35 });
  if (L.top === 'dresstop') {
    // The Dress top: a bodice off the shoulder, a frill along its neckline in the second colour
    // (puffed short sleeves are with the arms).
    const neck = 0.47;
    body.add(part(lathe(shape.filter(([, y]) => y <= neck).concat([[rAt(neck), neck]]), 1.04), M(top), 0, 0.02));
    ring(rAt(neck) * 1.04, 0.024, neck + 0.02, M(top2));
    ring(rAt(0.06) * 1.04, 0.018, 0.08, M(top2));
  } else if (L.top === 'midriff') {
    // The Midriff blouse with scarf: a band of blouse across the bust, off the shoulder, with a gold
    // brooch, a gold collar; and the scarf, in the second colour, tied low round the hips with a gold
    // belt and a jewel, a panel of it hanging in front.
    body.add(part(lathe([[rAt(0.3), 0.3], [rAt(0.4), 0.4], [rAt(0.48), 0.48]], 1.06), M(top), 0, 0.02));
    body.add(part(new THREE.SphereGeometry(0.024, 8, 6), brass, 0, 0.47, rAt(0.45) * 1.06 + 0.01));
    ring(0.085, 0.022, 0.64, brass);
    body.add(part(lathe([[0.29, -0.06], [0.285, 0.04], [0.27, 0.1]], 1), M(top2, { side: THREE.DoubleSide }), 0, 0));
    ring(0.275, 0.018, 0.08, brass);
    body.add(part(new THREE.SphereGeometry(0.022, 8, 6), M('#b0102a', { roughness: 0.3 }), 0, 0.08, 0.29));
    const panel = part(new THREE.BoxGeometry(0.18, 0.34, 0.02), M(top2), 0, -0.12, 0.29);
    panel.rotation.x = -0.12;
    body.add(panel);
  } else if (L.top === 'tied') {
    // A top tied at the front (Kikkit's): a short top across the bust, up over the shoulders, its
    // fronts knotted under it with the ends hanging, the midriff bare.
    body.add(part(lathe([[rAt(0.32), 0.32], [rAt(0.4), 0.4], [rAt(0.52), 0.52], [rAt(0.6) * 0.98, 0.6]], 1.05), M(top, { side: THREE.DoubleSide }), 0, 0.02));
    const knot = part(new THREE.SphereGeometry(0.045, 10, 8), M(top), 0, 0.33, rAt(0.32) * 1.05 + 0.01);
    knot.scale.set(1.3, 0.8, 0.8);
    body.add(knot);
    for (const s of [-1, 1]) {
      const end = part(new THREE.ConeGeometry(0.035, 0.12, 6), M(top), 0.035 * s, 0.26, rAt(0.3) * 1.05 + 0.01);
      end.rotation.set(Math.PI, 0, -0.35 * s);
      body.add(end);
    }
  } else if (L.top === 'rag') {
    // The Rag shirt (YPPedia: Rags, what clothes turn to as they dust): loose, torn to points round its
    // hem, a little short of the waist; a woman's worn off the left shoulder (Tzz's), a man's whole.
    const hem = 0.1, m = M(top, { side: THREE.DoubleSide });
    const from = (y0, y1) => [[rAt(y0), y0], ...shape.filter(([, y]) => y > y0 && y < y1), [rAt(y1), y1]];
    if (F) {
      body.add(part(lathe(from(hem, 0.44), 1.06), m, 0, 0.02));
      // (up over the right shoulder: half round, from the back to the front on the right)
      body.add(part(new THREE.LatheGeometry(from(0.42, 0.6).map(([r, y]) => new THREE.Vector2(r * 1.06, y)), 10, Math.PI, Math.PI), m, 0, 0.02));
    } else body.add(part(lathe(from(hem, 0.64), 1.06), m, 0, 0.02));
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, r = rAt(hem) * 1.06, pt = part(new THREE.ConeGeometry(0.04, 0.07 + (i % 3) * 0.03, 4), m, Math.sin(a) * r, hem - 0.02 - (i % 3) * 0.012, Math.cos(a) * r);
      pt.rotation.set(Math.PI, a, 0);
      pt.scale.z = 0.35;
      body.add(pt);
    }
  } else if (L.top === 'frilly') {
    // The Frilly shirt with sash: a white shirt with a ruffle down its front (a man's under an open
    // vest in its first colour), and a sash striped in both.
    for (let i = 0; i < 5; i++) {
      const y = 0.52 - i * 0.08, fr = part(new THREE.SphereGeometry(0.05, 10, 6), white, 0, y, rAt(y) + 0.008);
      fr.scale.set(1.3 - i * 0.12, 0.55, 0.45);
      body.add(fr);
    }
    if (!F) {
      const vest = part(lathe(shape.filter(([, y]) => y >= 0.12), 1.06, 0, 0.5), M(top), 0, 0.02);
      vest.material.side = THREE.DoubleSide;
      body.add(vest);
    }
    const sm = M('#ffffff', { map: stripeTex(F ? top : top2, F ? top2 : top, 6) });
    body.add(part(new THREE.CylinderGeometry(wr + 0.02, wr + 0.02, 0.12, 18), sm, 0, 0.1));
    const tails = part(new THREE.BoxGeometry(0.08, 0.24, 0.04), sm, -0.2, -0.04, 0.17);
    tails.rotation.z = -0.15;
    body.add(tails);
  } else if (L.top === 'raiment') {
    // The Vampire raiment: fitted to the waist, buttoned down the front, a tall collar standing round
    // the neck, and tails behind the hips lined in the second colour.
    // (A woman's cut low at the front, in a V to the bust, buttoned in two rows below it, as Helium's portrait
    // has it; and the tails flare out from the hips, their lining showing either side from the front: 13 Nov.)
    const collar = part(new THREE.CylinderGeometry(0.16, 0.1, 0.14, 18, 1, true, Math.PI * 0.25, Math.PI * 1.5), M(top, { side: THREE.DoubleSide }), 0, 0.71);
    body.add(collar);
    const buttonM = M(top2, { metalness: 0.5, roughness: 0.4 });
    if (F) {
      // The V of skin, laid on the torso's curve: rows from its top (wide) down to its point.
      const vTop = 0.6, vPt = 0.42, rows = 5, vs = [], idx = [];
      for (let j = 0; j <= rows; j++) {
        const y = vTop - (vTop - vPt) * j / rows, w = 0.09 * (1 - j / rows), r = rAt(y - 0.02) + 0.004;
        for (const x of [-w, 0, w]) vs.push(x, y + 0.02, Math.sqrt(Math.max(0, r * r - x * x)));
        if (j) { const a = (j - 1) * 3, b = j * 3; idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); }
      }
      const vg = new THREE.BufferGeometry();
      vg.setAttribute('position', new THREE.Float32BufferAttribute(vs, 3));
      vg.setIndex(idx);
      vg.computeVertexNormals();
      body.add(part(vg, skin));
      for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const y = 0.13 + i * 0.075, x = 0.04 * s; body.add(part(new THREE.SphereGeometry(0.016, 8, 6), buttonM, x, y, Math.sqrt(rAt(y - 0.02) ** 2 - x * x) + 0.01)); }
    } else for (let i = 0; i < 5; i++) { const y = 0.12 + i * 0.08; body.add(part(new THREE.SphereGeometry(0.018, 8, 6), buttonM, 0, y, rAt(y - 0.02) + 0.012)); }
    for (const s of [-1, 1]) {
      const tail = new THREE.Group();
      tail.position.set(0.19 * s, 0.14, -0.15);
      tail.rotation.set(0.15, 0.75 * s, 0.3 * s, 'YXZ');
      const outer = part(new THREE.BoxGeometry(0.13, 0.44, 0.02), M(top), 0, -0.22, -0.006);
      const lining = part(new THREE.BoxGeometry(0.118, 0.42, 0.012), M(top2), 0, -0.22, 0.01);
      tail.add(outer, lining);
      body.add(tail);
    }
  }
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
  if (L.legs === 'long' || L.legs === 'short' || L.legs === 'ragged') {
    // Ankle length at most, and not too wide at the hem: whatever's on your feet always shows.
    const len = L.legs === 'long' ? 0.44 : L.legs === 'ragged' ? 0.36 : 0.32;
    const skirt = part(lathe([[0.3, -len], [0.31, -len * 0.5], [0.28, 0.08]], 1), M(L.legsCol, { side: THREE.DoubleSide }), 0, 0);
    body.add(skirt);
    // The short dress bottom's hem is ragged, cut in points (YPPedia's picture of it; Mischievious's).
    // (A ragged skirt's torn longer and rougher: Kikkit's.)
    if (L.legs === 'short' || L.legs === 'ragged') for (let i = 0; i < 14; i++) {
      const rag = L.legs === 'ragged' ? 1.8 : 1;
      const a = (i / 14) * Math.PI * 2, pt = part(new THREE.ConeGeometry(0.045, (0.08 + (i % 3) * 0.025) * rag, 4), skirt.material, Math.sin(a) * 0.29, -len - 0.04 * rag - (i % 3) * 0.012 * rag, Math.cos(a) * 0.29);
      pt.rotation.set(Math.PI, a, 0);
      pt.scale.z = 0.35;
      body.add(pt);
    }
  }
  if (L.legs === 'gown') {
    // The Gown: a full skirt to the floor in its first colour, a broad panel down its front, two bands
    // near the hem and a frill round it, in its second.
    const prof = [[0.48, -0.6], [0.44, -0.4], [0.36, -0.15], [0.29, 0.08]];
    body.add(part(lathe(prof, 1), M(L.legsCol, { side: THREE.DoubleSide }), 0, 0));
    const g2 = M(L.legsCol2, { side: THREE.DoubleSide });
    body.add(part(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r * 1.012, y)), 6, -0.32, 0.64), g2, 0, 0));
    for (const y of [-0.42, -0.5]) {
      const r = 0.44 + (0.48 - 0.44) * ((-0.4 - y) / 0.2);
      ring(r * 1.015, 0.012, y, g2);
    }
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const fr = part(new THREE.SphereGeometry(0.04, 8, 6), g2, Math.sin(a) * 0.48, -0.6, Math.cos(a) * 0.48);
      fr.scale.set(1, 0.7, 0.6);
      fr.rotation.y = a;
      body.add(fr);
    }
  }

  // The head.
  const hr = F ? 0.235 : 0.25;
  // (The Wicked witch colours your face its second colour, and gives you a long nose.)
  const faceM = L.hat === 'witch' ? M(L.hatCol2) : skin;
  body.add(part(new THREE.SphereGeometry(hr, 20, 16), faceM, 0, 0.9));
  if (L.hat === 'witch') {
    const nose = part(new THREE.ConeGeometry(0.045, 0.16, 10), faceM, 0, 0.88, hr + 0.05);
    nose.rotation.x = Math.PI / 2 + 0.35;
    body.add(nose);
  } else body.add(part(new THREE.SphereGeometry(F ? 0.045 : 0.055, 10, 8), skin, 0, 0.87, hr - 0.005));
  const eye = (x) => part(new THREE.SphereGeometry(0.035, 8, 6), black, x, 0.95, hr - 0.035);
  body.add(eye(0.085));
  if (L.patch) {
    const pt = part(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 14), black, -0.09, 0.95, hr - 0.035);
    pt.rotation.x = Math.PI / 2 - 0.35;
    const strap = part(new THREE.TorusGeometry(hr + 0.002, 0.012, 6, 32), black, 0, 0.96);
    strap.rotation.set(Math.PI / 2 - 0.25, 0.35, 0);
    body.add(pt, strap);
  } else body.add(eye(-0.085));
  // (A woman's lips a rose drawn from her own skin, so they sit right on any of it: a bright red stood out like
  // paint on Helium's, 13 Nov.)
  const lipCol = `#${new THREE.Color(SKIN[L.skin] || SKIN[1]).lerp(new THREE.Color('#8a2020'), 0.6).getHexString()}`;
  if (L.grin) {
    // A grin: the mouth wide open, laughing, a D on its side (its flat edge the top lip), dark inside, a
    // tongue at the bottom (Tzz's).
    const mouth = new THREE.Shape();
    mouth.moveTo(-0.075, 0.012); mouth.lineTo(0.075, 0.012);
    mouth.absarc(0, 0.012, 0.075, 0, -Math.PI, true);
    const lip = part(new THREE.ExtrudeGeometry(mouth, { depth: 0.012, bevelEnabled: false }), M('#3a0f12', { roughness: 0.6 }), 0, 0.825, hr - 0.018);
    lip.scale.set(1, 0.85, 1);
    lip.rotation.x = 0.45;
    const tg = part(new THREE.SphereGeometry(0.04, 10, 6), M('#d0606a'), 0, 0.785, hr - 0.026);
    tg.scale.set(1.15, 0.45, 0.3);
    tg.rotation.x = 0.45;
    body.add(lip, tg);
  } else if (L.smile) {
    const smile = part(new THREE.TorusGeometry(0.055, 0.011, 6, 14, Math.PI * 0.8), M(F ? lipCol : '#5a2c22'), 0, F ? 0.83 : 0.835, hr - 0.02);
    smile.rotation.z = Math.PI * 1.1;
    body.add(smile);
  } else if (F) {
    const lips = part(new THREE.SphereGeometry(0.05, 10, 6), M(lipCol), 0, 0.815, hr - 0.025);
    lips.scale.set(1, 0.42, 0.5);
    body.add(lips);
  }
  if (L.starfish) {
    // A blue starfish stuck to the cheek (Gravee's), on the side without the eyepatch.
    const st = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.026 : 0.066; st[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
    const sf = part(new THREE.ExtrudeGeometry(st, { depth: 0.014, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1 }), M('#2f8fe6', { roughness: 0.5 }), 0.12, 0.865, hr - 0.06);
    sf.rotation.set(-0.1, 0.5, 0.25);
    body.add(sf);
  }
  if (L.tongue) {
    // Her tongue out, a little to one side (Kikkit's).
    const tg = part(new THREE.CapsuleGeometry(0.028, 0.04, 4, 8), M('#e0707a'), 0.02, 0.795, hr - 0.005);
    tg.rotation.set(1.1, 0, 0.25);
    body.add(tg);
  }
  for (const s of L.earring === 'both' ? [1, -1] : L.earring ? [-1] : []) {
    const ring = part(new THREE.TorusGeometry(0.04, 0.012, 6, 16), gold, hr * s, 0.83, 0);
    ring.rotation.y = Math.PI / 2;
    body.add(ring);
  }

  // Hair, tilted back so the face shows.
  if (L.hair !== 'bald') {
    const cap = part(new THREE.SphereGeometry(hr + 0.014, 20, 12, 0, Math.PI * 2, 0, Math.PI * (F ? 0.6 : 0.55)), hairM, 0, 0.9, -0.005);
    // (Hair drawn back off the face starts higher on the brow, and comes further down the nape.)
    cap.rotation.x = L.hair === 'swept' || L.hair === 'twists' ? -0.85 : -0.5;
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
  } else if (L.hair === 'curly') {
    // Curly: a big loose mass of curls, full on the crown and falling past the shoulders, open only
    // at the face (Mischievious's, 11 Nov). Each curl a little ball, all in one mesh to stay cheap.
    // (Under a hat that sits over the crown, the curls start below its brim.)
    const capped = !['none', 'veil', 'feline', 'butterfly', 'tiara', 'roses'].includes(L.hat);
    const curls = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const ball = (x, y, z, r) => { const g2 = new THREE.SphereGeometry(r, 7, 5); g2.translate(x, y, z); curls.push(g2); };
    // Rows from the crown down: [height, distance out from the head's centre, half the gap at the face].
    const rows = [[1.12, 0.17, 0], [1.06, 0.225, 0.45], [0.98, 0.26, 0.8], [0.9, 0.275, 0.95], [0.82, 0.28, 1.05], [0.74, 0.29, 1.15], [0.66, 0.3, 1.3], [0.58, 0.3, 1.45], [0.5, 0.28, 1.65]];
    for (const [y, out, gap] of rows) {
      if (capped && y > 1.0) continue;
      const n = Math.round((Math.PI * 2 - 2 * gap) * out / 0.075) || 1;
      for (let i = 0; i < n; i++) {
        const a = gap + (i + 0.5) * (Math.PI * 2 - 2 * gap) / n + (rnd() - 0.5) * 0.15;
        const o = out + (rnd() - 0.5) * 0.04;
        ball(Math.sin(a) * o, y + (rnd() - 0.5) * 0.04, Math.cos(a) * o - 0.02, 0.06 + rnd() * 0.025);
      }
    }
    // A few curls tumbling over the brow, to one side.
    if (!capped) for (const [x, y] of [[-0.12, 1.05], [-0.04, 1.08], [0.06, 1.07], [0.15, 1.02]]) ball(x, y, 0.17, 0.055);
    body.add(part(mergeGeometries(curls), hairPlain, 0, 0, 0));
  } else if (L.hair === 'swept' || L.hair === 'twists') {
    // Hair laid over the head in strands, each along a path over it: from where it starts (a direction from
    // the head's middle: `az` round from the face, + to the left, `el` up), up over `top`, to where it goes,
    // lifted `lift` off the scalp at its middle. All one mesh, to stay cheap.
    const dir = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    // (`peak` under 1 lifts it most early on: a wave rising off the brow.)
    const over = (a, top, b, lift, n = 9, peak = 1) => {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, d = t < 0.5 ? a.clone().lerp(top, t * 2) : top.clone().lerp(b, t * 2 - 1);
        pts.push(d.normalize().multiplyScalar(hr + 0.012 + lift * Math.sin(Math.PI * t ** peak)).add(new THREE.Vector3(0, 0.9, -0.005)));
      }
      return pts;
    };
    const strands = [];
    // A strand as a tube tapering to a point at both ends (so no open end shows), `r` thick at its middle;
    // `ribs`, swelling and narrowing that many times along it, as a twisted lock does.
    const tube = (pts, r, ends = 0.25, ribs = 0) => {
      const curve = new THREE.CatmullRomCurve3(pts), segs = ribs ? ribs * 4 : 14, rad = 7, geo = new THREE.TubeGeometry(curve, segs, r, rad), q = geo.attributes.position, c = new THREE.Vector3();
      for (let i = 0; i <= segs; i++) {
        const t = i / segs, k = (ends + (1 - ends) * Math.sin(Math.PI * t) ** 0.5) * (ribs ? 0.78 + 0.22 * Math.abs(Math.sin(Math.PI * ribs * t)) : 1);
        curve.getPointAt(t, c);
        for (let j = 0; j <= rad; j++) { const x = i * (rad + 1) + j; q.setXYZ(x, c.x + (q.getX(x) - c.x) * k, c.y + (q.getY(x) - c.y) * k, c.z + (q.getZ(x) - c.z) * k); }
      }
      geo.computeVertexNormals();
      strands.push(geo);
    };
    const twist = (pts, r) => tube(pts, r, 0.4, Math.max(3, Math.round(new THREE.CatmullRomCurve3(pts).getLength() / (r * 1.7))));
    const from = (az, el, out = 0.02) => dir(az, el).multiplyScalar(hr + out).add(new THREE.Vector3(0, 0.9, 0));
    if (L.hair === 'swept') {
      // Swept up (Helium's portrait, 13 Nov): drawn up off the brow in a full wave from a low side part on the
      // right, over the crown and back to the nape; a fall of it down by the right cheek; tucked behind the left ear.
      for (const [a0, e0, lift, r] of [[-1.4, 0.32, 0.05, 0.045], [-1.05, 0.52, 0.075, 0.05], [-0.68, 0.66, 0.1, 0.055], [-0.28, 0.74, 0.115, 0.055], [0.12, 0.76, 0.11, 0.055], [0.52, 0.7, 0.085, 0.05], [0.9, 0.56, 0.055, 0.045], [1.25, 0.38, 0.035, 0.04]]) {
        tube(over(dir(a0, e0), dir(a0 * 0.3 + 0.75, 1.2), dir(Math.PI - 0.5 + a0 * 0.2, -0.25), lift * 1.3, 10, 0.5), r, 0.12);
      }
      // (the fall by the right cheek, from the parting down past the ear)
      for (const [dz, len] of [[0.04, 0.17], [-0.03, 0.2]]) {
        tube([from(-1.2, 0.45), new THREE.Vector3(-hr - 0.03, 0.9, dz + 0.02), new THREE.Vector3(-hr - 0.03, 0.9 - len * 0.6, dz), new THREE.Vector3(-hr + 0.01, 0.9 - len, dz - 0.02)], 0.036, 0.3);
      }
    } else {
      // Twists (Tzz's portrait, 13 Nov): twisted locks from the hairline drawn back over the head, tied behind
      // and hanging a little way down her back, one loose by the right ear.
      const tie = dir(Math.PI, -0.15);
      for (let i = 0; i < 9; i++) {
        const a = -1.5 + i * (3 / 8), e = 0.62 - 0.36 * Math.abs(a) / 1.5;
        twist(over(dir(a, e), dir(a * 0.5, 1.15), tie, 0.03 + 0.015 * Math.cos(a), 10), 0.034);
      }
      const knot = from(Math.PI, -0.15, 0.04);
      for (const dx of [-0.05, 0, 0.05]) twist([knot, knot.clone().add(new THREE.Vector3(dx * 0.6, -0.12, -0.03)), knot.clone().add(new THREE.Vector3(dx, -0.3, -0.02))], 0.032);
      twist([from(-1.5, 0.3, 0.03), new THREE.Vector3(-hr - 0.03, 0.8, -0.05), new THREE.Vector3(-hr + 0.01, 0.64, -0.08)], 0.03);
    }
    body.add(part(mergeGeometries(strands), hairPlain, 0, 0, 0));
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
  } else if (L.hat === 'veil') {
    // The Veil: a band over the crown in its second colour, gathered at the back, and a sheer veil in
    // its first falling from there down her back.
    const band = part(new THREE.TorusGeometry(hr - 0.02, 0.022, 6, 28, Math.PI), hc2, 0, 1.0, -0.02);
    band.rotation.set(-0.35, 0, 0);
    hat.add(band, part(new THREE.SphereGeometry(0.06, 10, 8), hc2, 0, 1.06, -hr + 0.02));
    const veil = part(new THREE.CylinderGeometry(hr + 0.01, hr + 0.13, 0.62, 22, 1, true, Math.PI / 2 - 0.35, Math.PI + 0.7),
      M(L.hatCol, { side: THREE.DoubleSide, transparent: true, opacity: 0.72 }), 0, 0.77, -0.04);
    veil.castShadow = false;
    hat.add(veil);
  } else if (L.hat === 'tiara') {
    // The Tiara: a crown of points round a band (the band in its second colour), jewels set in both.
    const gilt = M(L.hatCol, { metalness: 0.55, roughness: 0.35 }), r = 0.17;
    hat.add(part(new THREE.CylinderGeometry(r + 0.012, r + 0.02, 0.06, 22, 1, true), M(L.hatCol2, { side: THREE.DoubleSide }), 0, 1.08));
    hat.add(part(new THREE.CylinderGeometry(r + 0.004, r + 0.004, 0.035, 22, 1, true), M(L.hatCol, { metalness: 0.55, roughness: 0.35, side: THREE.DoubleSide }), 0, 1.125));
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2, front = Math.cos(a), h = 0.09 + 0.06 * Math.max(0, front);
      hat.add(part(new THREE.ConeGeometry(0.03, h, 4), gilt, Math.sin(a) * r, 1.14 + h / 2, Math.cos(a) * r));
    }
    for (const [x, c] of [[0, '#3a6ee8'], [-0.08, '#e8f0ff'], [0.08, '#e8f0ff']]) hat.add(part(new THREE.SphereGeometry(0.022, 8, 6), M(c, { roughness: 0.2, metalness: 0.2 }), x, 1.08, Math.sqrt(r * r - x * x) + 0.025));
  } else if (L.hat === 'butterfly' || L.hat === 'feline') {
    // A mask over the eyes (YPP's Halloween masks), with holes for them.
    const eyesAt = [0.085, ...(L.patch ? [] : [-0.085])];
    const holes = () => eyesAt.forEach((x) => {
      const hole = part(new THREE.SphereGeometry(0.036, 10, 8), skin, x, 0.95, hr + 0.006);
      hole.scale.z = 0.35;
      hat.add(hole, part(new THREE.SphereGeometry(0.026, 8, 6), black, x, 0.95, hr + 0.014));
    });
    if (L.patch) {
      const pt = part(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 14), black, -0.09, 0.95, hr + 0.012);
      pt.rotation.x = Math.PI / 2 - 0.3;
      hat.add(pt);
    }
    if (L.hat === 'feline') {
      // The Feminine feline: a cat's eye mask in its first colour, cat's ears in its second.
      // (Looked at closely beside Helium's portrait, 13 Nov: a band right across both eyes, its outer corners
      // flicked up as a cat's eye is; the ears big and rounded, their insides a lighter shade of them.)
      const mask = part(new THREE.SphereGeometry(hr + 0.008, 24, 6, Math.PI / 2 - 1.25, 2.5, 1.04, 0.56), hc, 0, 0.9);
      mask.material.side = THREE.DoubleSide;
      hat.add(mask);
      const innerCol = `#${new THREE.Color(hexOf(L.hatCol2)).lerp(new THREE.Color('#a4a4ac'), 0.3).getHexString()}`;
      for (const s of [-1, 1]) {
        const flick = part(new THREE.ConeGeometry(0.03, 0.09, 8), hc, s * 0.2, 0.985, 0.095);
        flick.rotation.set(0, 0, -s * 0.9);
        flick.scale.z = 0.4;
        hat.add(flick);
        // (Up out of any hair.)
        const ear = part(new THREE.ConeGeometry(0.1, 0.21, 12), hc2, s * 0.16, 1.2, 0.0);
        ear.rotation.set(0, 0, -s * 0.38);
        ear.scale.z = 0.42;
        hat.add(ear);
        const inner = part(new THREE.ConeGeometry(0.062, 0.13, 10), M(innerCol, { roughness: 0.95 }), s * 0.155, 1.18, 0.03);
        inner.rotation.set(0, 0, -s * 0.38);
        inner.scale.z = 0.3;
        hat.add(inner);
      }
    } else {
      // The Butterfly: a big butterfly over the eyes and brow, its wings spotted black and white.
      const wing = (x, y, rad, sx, sy, rz) => {
        const w = part(new THREE.SphereGeometry(rad, 14, 10), hc, x, y, hr + 0.035);
        w.scale.set(sx, sy, 0.22);
        w.rotation.z = rz;
        hat.add(w);
        return w;
      };
      for (const s of [-1, 1]) {
        wing(s * 0.12, 1.0, 0.11, 1.15, 0.85, s * 0.35);
        wing(s * 0.09, 0.88, 0.075, 1, 0.9, -s * 0.4);
        // (black edges and white spots)
        for (const [x, y, r, c] of [[0.2, 1.06, 0.022, black], [0.15, 0.99, 0.016, white], [0.22, 0.97, 0.014, white], [0.12, 0.86, 0.014, black]]) {
          const sp = part(new THREE.SphereGeometry(r, 8, 6), c, s * x, y, hr + 0.06);
          sp.scale.z = 0.4;
          hat.add(sp);
        }
      }
      const thorax = part(new THREE.CapsuleGeometry(0.02, 0.16, 4, 8), black, 0, 0.95, hr + 0.07);
      hat.add(thorax);
      for (const s of [-1, 1]) {
        const ant = part(new THREE.CylinderGeometry(0.005, 0.005, 0.13, 4), black, s * 0.03, 1.08, hr + 0.06);
        ant.rotation.z = -s * 0.4;
        hat.add(ant);
      }
    }
    holes();
  } else if (L.hat === 'roses') {
    // A crown of roses (Kikkit's), round the top of the head, leaves between them.
    const leaf = M('#3f7a2c'), n = 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, rr = hr * 0.86;
      const rose = part(new THREE.SphereGeometry(0.05, 9, 7), hc, Math.sin(a) * rr, 1.07 + Math.cos(a) * 0.06, Math.cos(a) * rr - 0.02);
      rose.scale.set(1, 0.75, 1);
      const lf = part(new THREE.SphereGeometry(0.035, 6, 4), leaf, Math.sin(a + 0.35) * rr * 1.04, 1.06 + Math.cos(a + 0.35) * 0.06, Math.cos(a + 0.35) * rr * 1.04 - 0.02);
      lf.scale.set(1.4, 0.4, 0.7);
      hat.add(rose, lf);
    }
  } else if (L.hat === 'pelt') {
    // The Berserker pelt, as Puzzle Pirates' sat: a bear's head worn up on top of hers, in its colour
    // (Gravee's, white: a polar bear), its jaw over her brow, its snout out above her face with a black
    // nose, its eyes shut, two fangs at her forehead, round ears, and its hide falling down her back. Her
    // face shows clear underneath, from the den's camera looking down too (the user, 11 Nov, of Gravee: "I
    // love her hat, but you really can't see her at all"): nothing of it comes down in front below her brow.
    const white0 = L.hatCol === 'white';
    const fur = M(L.hatCol, { roughness: 1 }), shade = white0 ? M('#c9d6e6') : M('#000000', { transparent: true, opacity: 0.25 });
    const dome = part(new THREE.SphereGeometry(hr + 0.06, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), fur, 0, 1.03, -0.03);
    dome.rotation.x = -0.12; dome.scale.set(1.08, 0.85, 1.1);
    // (its face up on her brow, looking out the way she does)
    const snout = part(new THREE.SphereGeometry(0.1, 14, 10), fur, 0, 1.195, hr * 0.85);
    snout.scale.set(1.0, 0.75, 1.2);
    const muzzle = part(new THREE.SphereGeometry(0.06, 10, 8), shade, 0, 1.185, hr * 0.85 + 0.09);
    muzzle.scale.set(1.15, 0.75, 0.85);
    hat.add(dome, snout, muzzle, part(new THREE.SphereGeometry(0.032, 10, 8), black, 0, 1.205, hr * 0.85 + 0.135));
    for (const s of [-1, 1]) {
      const ear = part(new THREE.SphereGeometry(0.066, 10, 8), fur, s * 0.19, 1.3, -0.04);
      ear.scale.set(1, 1, 0.55);
      const inner = part(new THREE.SphereGeometry(0.036, 8, 6), shade, s * 0.19, 1.3, -0.008);
      inner.scale.set(1, 1, 0.4);
      const shut = part(new THREE.CapsuleGeometry(0.009, 0.036, 2, 6), black, s * 0.085, 1.255, hr * 0.62);
      shut.rotation.z = Math.PI / 2 + s * 0.25;
      const fang = part(new THREE.ConeGeometry(0.016, 0.05, 6), white, s * 0.06, 1.1, hr + 0.005);
      fang.rotation.x = Math.PI;
      hat.add(ear, inner, shut, fang);
    }
    // Its hide, down her back (round behind her, not either side of her face).
    hat.add(part(new THREE.CylinderGeometry(hr + 0.05, hr + 0.14, 0.52, 18, 1, true, Math.PI / 2 + 0.3, Math.PI - 0.6), M(L.hatCol, { roughness: 1, side: THREE.DoubleSide }), 0, 0.8, -0.03));
  } else if (L.hat === 'witch') {
    // The Wicked witch: a tall pointed black hat with a wide brim, bent at the tip, a band round it in
    // its second colour (which is also her face's).
    const brim = part(new THREE.CylinderGeometry(0.46, 0.46, 0.02, 28), hc, 0, 1.08);
    const cone = part(new THREE.ConeGeometry(0.2, 0.42, 18), hc, 0, 1.3);
    const tip = part(new THREE.ConeGeometry(0.075, 0.2, 12), hc, 0.05, 1.56, -0.04);
    tip.rotation.set(-0.3, 0, -0.6);
    hat.add(brim, cone, tip, part(new THREE.CylinderGeometry(0.2, 0.205, 0.05, 18), hc2, 0, 1.115));
    hat.rotation.set(-0.08, 0, 0.08);
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
    // The Dress top's puffed short sleeves, worn off the shoulder, banded in its second colour; the
    // midriff blouse's drape over the upper arm, gold bands on the forearms.
    if (L.top === 'dresstop' || L.top === 'midriff') {
      const puff = part(new THREE.SphereGeometry(L.top === 'dresstop' ? 0.1 : 0.088, 12, 10), M(top), 0, -0.1);
      puff.scale.set(1, L.top === 'dresstop' ? 1 : 0.7, 1);
      sh.add(puff);
      if (L.top === 'dresstop') sh.add(part(new THREE.CylinderGeometry(0.078, 0.078, 0.03, 12), M(top2), 0, -0.18));
      else sh.add(part(new THREE.CylinderGeometry(0.07, 0.068, 0.07, 12), brass, 0, -0.38));
    }
    // The Rag shirt's short sleeves, torn ragged (a woman's only on the shoulder it's still on, the right).
    if (L.top === 'rag' && (!F || s === -1)) {
      const rm = M(top, { side: THREE.DoubleSide });
      sh.add(part(new THREE.CylinderGeometry(0.085 * ar, 0.095 * ar, 0.2, 10, 1, true), rm, 0, -0.09));
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2, pt = part(new THREE.ConeGeometry(0.03, 0.06 + (i % 2) * 0.03, 4), rm, Math.sin(a) * 0.09 * ar, -0.21 - (i % 2) * 0.01, Math.cos(a) * 0.09 * ar);
        pt.rotation.set(Math.PI, a, 0);
        pt.scale.z = 0.4;
        sh.add(pt);
      }
    }
    if (L.top === 'frilly') {
      const cuff = part(new THREE.SphereGeometry(0.085, 10, 8), white, 0, -0.44);
      cuff.scale.set(1, 0.5, 1);
      sh.add(cuff);
    }
    if (bucc) sh.add(part(new THREE.CylinderGeometry(0.1, 0.115, 0.15, 12), M(top2), 0, -0.4));   // (wide cuffs)
    else if (coat) sh.add(part(new THREE.CylinderGeometry(0.085, 0.085, 0.09, 10), L.top === 'captain' ? gold : M(top2), 0, -0.42));
    if (L.hook && s === 1) {
      // A hook for the left hand: a dark leather cup over the wrist and a steel hook curling forward.
      const steel = M('#c4c8cc', { metalness: 0.8, roughness: 0.25 });
      sh.add(part(new THREE.CylinderGeometry(0.07 * ar, 0.055, 0.08, 12), M('#3a3330'), 0, -0.5));
      sh.add(part(new THREE.CylinderGeometry(0.017, 0.017, 0.07, 6), steel, 0, -0.57));
      const hk = part(new THREE.TorusGeometry(0.06, 0.017, 6, 16, Math.PI * 1.3), steel, 0, -0.65, 0.05);
      hk.rotation.set(0, Math.PI / 2, Math.PI * 0.9);
      sh.add(hk);
    } else sh.add(part(new THREE.SphereGeometry(0.075 * ar, 10, 8), skin, 0, -0.5));
    body.add(sh);
    return sh;
  });
  if (L.wristband) arms[0].add(part(new THREE.CylinderGeometry(0.072 * ar, 0.072 * ar, 0.06, 12), M(top), 0, -0.42));
  if (opts.sword) {
    const blade = part(new THREE.BoxGeometry(0.04, 0.05, 0.62), M('#d8dde2', { metalness: 0.8, roughness: 0.25 }), 0, -0.52, 0.34);
    arms[1].add(blade, part(new THREE.BoxGeometry(0.16, 0.05, 0.04), gold, 0, -0.52, 0.04));
  } else if (opts.axe) {
    // A Viking's battle axe (YPPedia, Viking raid: in a swordfight "vikings may use a battle axe"): a
    // wooden haft held forward like the cutlass, a steel head at its end with a curved, flaring edge.
    const steel = M('#c4c8cc', { metalness: 0.8, roughness: 0.25 });
    const haft = part(new THREE.CylinderGeometry(0.022, 0.026, 0.74, 8), M('#6b4423', { roughness: 0.8 }), 0, -0.52, 0.32);
    haft.rotation.x = Math.PI / 2;
    // The edge: a wedge of a disc on the haft, fanning out to one side of it (rotated so it lies in
    // the haft's plane, its angles there run from +z, the haft's end, round to -y, its side).
    const edge = part(new THREE.CylinderGeometry(0.15, 0.15, 0.026, 16, 1, false, -Math.PI / 2 - 0.75, 1.5), steel, 0, -0.52, 0.6);
    edge.rotation.z = Math.PI / 2;
    arms[1].add(haft, edge, part(new THREE.BoxGeometry(0.036, 0.07, 0.08), steel, 0, -0.55, 0.6));
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
  } else if (L.hand === 'bouquet') {
    // A bouquet: a posy of flowers in its colour (and a few white), a ribbon round green stems.
    const bq = new THREE.Group(), fl = M(L.handCol), stems = M('#4f7a2a');
    const st = part(new THREE.CylinderGeometry(0.035, 0.02, 0.16, 8), stems, 0, -0.04);
    bq.add(st, part(new THREE.CylinderGeometry(0.038, 0.038, 0.03, 10), white, 0, -0.01));
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, r = i ? 0.055 + (i % 2) * 0.02 : 0;
      bq.add(part(new THREE.SphereGeometry(0.036, 8, 6), i % 4 === 3 ? white : fl, Math.sin(a) * r, 0.1 - r * 0.4, Math.cos(a) * r));
    }
    for (let i = 0; i < 5; i++) { const a = i * 1.26 + 0.6; bq.add(part(new THREE.SphereGeometry(0.025, 6, 5), stems, Math.sin(a) * 0.085, 0.05, Math.cos(a) * 0.085)); }
    bq.position.set(0, -0.56, 0.1);
    bq.rotation.x = 0.35;
    arms[0].add(bq);
    held = bq;
  } else if (L.hand === 'gift') {
    // A present, held out in front: a box wrapped in its colour, a ribbon round it both ways and a bow on
    // top (white ribbon, or gold on white paper). Showered in gifts, at the wedding (12 Nov).
    const pr = new THREE.Group(), paper = M(L.handCol), rib = L.handCol === 'white' ? M('#e8b23a', { metalness: 0.5, roughness: 0.35 }) : white;
    pr.add(part(new THREE.BoxGeometry(0.2, 0.17, 0.2), paper, 0, 0.06), part(new THREE.BoxGeometry(0.21, 0.175, 0.04), rib, 0, 0.06), part(new THREE.BoxGeometry(0.04, 0.175, 0.21), rib, 0, 0.06));
    for (const d of [-1, 1]) { const loop = part(new THREE.TorusGeometry(0.035, 0.012, 6, 10), rib, d * 0.035, 0.17); loop.rotation.y = Math.PI / 2; loop.rotation.x = d * 0.5; pr.add(loop); }
    pr.position.set(0, -0.58, 0.12);
    arms[0].add(pr);
    held = pr;
  } else if (L.hand === 'pistol') {
    // A flintlock pistol, held up: a wooden grip, a steel barrel pointing up and forward.
    const pg = new THREE.Group(), wood = M('#6b4226'), steel = M('#9aa0a6', { metalness: 0.8, roughness: 0.3 });
    const grip = part(new THREE.BoxGeometry(0.045, 0.12, 0.06), wood, 0, 0, 0);
    grip.rotation.x = -0.3;
    const barrel = part(new THREE.CylinderGeometry(0.018, 0.02, 0.24, 8), steel, 0, 0.1, 0.07);
    barrel.rotation.x = 0.9;
    pg.add(grip, barrel, part(new THREE.BoxGeometry(0.03, 0.04, 0.05), steel, 0, 0.05, 0.02));
    pg.position.set(0, -0.56, 0.06);
    arms[0].add(pg);
    held = pg;
  } else if (L.hand === 'goblet') {
    // A wine glass, red wine in it.
    const wg = new THREE.Group(), glass = M('#e8f2f6', { transparent: true, opacity: 0.45, roughness: 0.1 });
    wg.add(part(new THREE.CylinderGeometry(0.05, 0.03, 0.1, 12, 1, true), glass, 0, 0.1), part(new THREE.CylinderGeometry(0.043, 0.03, 0.06, 12), M('#5b1240'), 0, 0.075),
      part(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), glass, 0, 0.02), part(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 12), glass, 0, -0.02));
    wg.position.set(0, -0.56, 0.08);
    arms[0].add(wg);
    held = wg;
  } else if (L.hand === 'jug') {
    // A stone jug, its top dipped dark, a little handle, XXX on its side (Kikkit's).
    const jg = new THREE.Group(), stone = M('#ffffff', { map: jugTex() }), dark = M('#5a3a22');
    const belly = part(new THREE.SphereGeometry(0.1, 14, 12), stone, 0, 0.02);
    belly.scale.set(1, 1.15, 1);
    belly.rotation.y = Math.PI;   // (its XXX facing out)
    jg.add(belly, part(new THREE.CylinderGeometry(0.032, 0.05, 0.08, 10), dark, 0, 0.14), part(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 8), M('#a07b4a'), 0, 0.19));
    const handle = part(new THREE.TorusGeometry(0.04, 0.012, 6, 10, Math.PI), dark, -0.08, 0.1);
    handle.rotation.z = Math.PI / 2;
    jg.add(handle);
    jg.position.set(0, -0.58, 0.1);
    arms[0].add(jg);
    held = jg;
  } else if (L.hand === 'candle') {
    // A lit candle (Gravee's), in a little brass holder, its flame glowing.
    const cd = new THREE.Group(), brass = M('#c9a13c', { metalness: 0.7, roughness: 0.35 });
    cd.add(part(new THREE.CylinderGeometry(0.05, 0.045, 0.02, 12), brass, 0, 0), part(new THREE.CylinderGeometry(0.024, 0.026, 0.17, 10), M('#f4efe2', { roughness: 0.6 }), 0, 0.095));
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 8), new THREE.MeshBasicMaterial({ color: '#ffcf4a' }));
    flame.position.y = 0.21;
    cd.add(flame);
    cd.position.set(0, -0.56, 0.06);
    cd.rotation.x = 0.15;
    arms[0].add(cd);
    held = cd;
  } else if (L.hand === 'scepter') {
    // A golden sceptre, a jewel at its top.
    const sc = new THREE.Group(), gilt = M('#e8b23a', { metalness: 0.7, roughness: 0.3 });
    sc.add(part(new THREE.CylinderGeometry(0.018, 0.022, 0.5, 8), gilt, 0, 0.1), part(new THREE.SphereGeometry(0.05, 10, 8), gilt, 0, 0.37),
      part(new THREE.SphereGeometry(0.028, 8, 6), M('#2e9a48', { roughness: 0.2 }), 0, 0.42), part(new THREE.SphereGeometry(0.02, 6, 5), M('#c0182a'), 0, -0.16));
    sc.position.set(0, -0.56, 0.06);
    sc.rotation.x = 0.25;
    arms[0].add(sc);
    held = sc;
  } else if (L.hand === 'atlantis') {
    // The Atlantis trinket (Helium's portrait, 13 Nov): a jar of glowing blue crystal, gold scrollwork curling
    // over its front, gold bands round its top and foot, and a soft glow about it (a sprite: no light, cheap).
    const at = new THREE.Group(), gilt = M('#e8b23a', { metalness: 0.7, roughness: 0.3 });
    const jar = part(new THREE.CylinderGeometry(0.07, 0.062, 0.17, 12), M('#3c9cff', { emissive: '#1a68f0', emissiveIntensity: 1.3, roughness: 0.2, metalness: 0.1 }), 0, 0.09);
    jar.scale.z = 0.8;
    at.add(jar, part(new THREE.CylinderGeometry(0.074, 0.074, 0.02, 12), gilt, 0, 0.18), part(new THREE.CylinderGeometry(0.066, 0.07, 0.02, 12), gilt, 0, 0.0),
      part(new THREE.SphereGeometry(0.02, 8, 6), gilt, 0, 0.205));
    for (const [x, y, r] of [[-0.03, 0.12, 0.022], [0.02, 0.08, 0.026], [-0.015, 0.045, 0.018]]) {
      const curl = part(new THREE.TorusGeometry(r, 0.0055, 4, 12, Math.PI * 1.5), gilt, x, y, 0.058);
      curl.rotation.z = x * 30;
      at.add(curl);
    }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#6ec8ff', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55 }));
    glow.position.y = 0.09; glow.scale.setScalar(0.42);
    at.add(glow);
    at.position.set(0, -0.62, 0.1);
    at.scale.setScalar(1.3);   // (a good handful, as in the portrait)
    arms[0].add(at);
    held = at;
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
/** A familiar on its own (not on a shoulder): a look's `fam` and its colours. Kikkit's island has a
    crowd of them (js/den/kikkit.js); familiarTick animates it. */
export const familiar = (look) => makeFamiliar(cleanLook({ body: 'f', ...look }));
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
  } else if (L.fam === 'squirrel') {
    // A squirrel, sitting up: a pale tummy, tufted ears, a great bushy tail curling up behind, a nut
    // held in its paws.
    const fur = M(FUR[L.famCol] || L.famCol), pale = M('#ece4d6');
    const bodyM = part(new THREE.SphereGeometry(0.08, 12, 10), fur, 0, 0.1, 0);
    bodyM.scale.set(0.95, 1.25, 0.9);
    const tum = part(new THREE.SphereGeometry(0.06, 10, 8), pale, 0, 0.09, 0.035);
    tum.scale.set(0.85, 1.2, 0.7);
    const head = new THREE.Group();
    head.position.set(0, 0.23, 0.02);
    head.add(part(new THREE.SphereGeometry(0.068, 12, 10), fur));
    const snout = part(new THREE.SphereGeometry(0.035, 10, 8), pale, 0, -0.018, 0.055);
    snout.scale.set(1.1, 0.85, 0.9);
    head.add(snout, part(new THREE.SphereGeometry(0.012, 6, 5), black, 0, -0.005, 0.088));
    [-1, 1].forEach((s) => {
      const ear = part(new THREE.ConeGeometry(0.022, 0.06, 6), fur, 0.04 * s, 0.065, -0.005);
      ear.rotation.z = -0.3 * s;
      head.add(ear);
      head.add(part(new THREE.SphereGeometry(0.014, 6, 5), black, 0.03 * s, 0.015, 0.058));
      head.add(part(new THREE.SphereGeometry(0.005, 5, 4), white, 0.034 * s, 0.021, 0.07));
    });
    // The tail: balls growing then easing off along a curl up the back.
    const tail = new THREE.Group();
    tail.position.set(0, 0.04, -0.07);
    for (let i = 0; i < 9; i++) {
      const t = i / 8, a = t * Math.PI * 1.15;
      tail.add(part(new THREE.SphereGeometry(0.04 + Math.sin(t * Math.PI) * 0.035, 8, 6), fur, 0, Math.sin(a) * 0.18, -0.06 - (1 - Math.cos(a)) * 0.06 + t * 0.05));
    }
    const nut = part(new THREE.SphereGeometry(0.025, 8, 6), M('#8a5a2b'), 0, 0.15, 0.085);
    nut.scale.y = 1.25;
    const arms = [-1, 1].map((s) => {
      const a = part(new THREE.CapsuleGeometry(0.014, 0.05, 4, 6), fur, 0.03 * s, 0.15, 0.06);
      a.rotation.set(-1.1, 0, 0.5 * s);
      g.add(a);
      return a;
    });
    [-1, 1].forEach((s) => g.add(part(new THREE.SphereGeometry(0.03, 8, 6), fur, 0.05 * s, 0.03, 0.05)));
    g.add(bodyM, tum, head, tail, nut);
    Object.assign(fam, { head, tail, arms, nut });
  } else if (L.fam === 'bat') {
    // A bat, clinging on: a furry body, big ears pink inside, and leathery wings half spread.
    const c = M(L.famCol), pink = M('#e8a0b0');
    const bodyM = part(new THREE.SphereGeometry(0.07, 12, 10), c, 0, 0.12, 0);
    bodyM.scale.set(0.9, 1.25, 0.85);
    const head = new THREE.Group();
    head.position.set(0, 0.23, 0.02);
    head.add(part(new THREE.SphereGeometry(0.058, 12, 10), c));
    [-1, 1].forEach((s) => {
      const ear = part(new THREE.ConeGeometry(0.03, 0.09, 8), c, 0.035 * s, 0.07, -0.005);
      ear.rotation.z = -0.35 * s;
      const inner = part(new THREE.ConeGeometry(0.018, 0.06, 6), pink, 0.035 * s, 0.065, 0.012);
      inner.rotation.z = -0.35 * s;
      head.add(ear, inner, part(new THREE.SphereGeometry(0.012, 6, 5), black, 0.025 * s, 0.01, 0.05));
    });
    head.add(part(new THREE.SphereGeometry(0.014, 6, 5), pink, 0, -0.012, 0.055));
    const wingM = M(L.famCol, { side: THREE.DoubleSide, roughness: 0.7 });
    const wings = [-1, 1].map((s) => {
      const w = new THREE.Group();
      w.position.set(0.05 * s, 0.17, -0.02);
      const shp = new THREE.Shape();
      shp.moveTo(0, 0); shp.lineTo(0.2, 0.07); shp.quadraticCurveTo(0.17, 0.01, 0.19, -0.05); shp.quadraticCurveTo(0.13, -0.04, 0.12, -0.1);
      shp.quadraticCurveTo(0.07, -0.07, 0.05, -0.12); shp.lineTo(0, -0.08); shp.lineTo(0, 0);
      const m = part(new THREE.ShapeGeometry(shp), wingM);
      m.scale.x = s;
      w.add(m);
      w.rotation.y = 0.6 * s;   // (swept back)
      g.add(w);
      return w;
    });
    g.add(bodyM, head);
    Object.assign(fam, { head, wings });
  } else if (L.fam === 'krakling') {
    // A krakling, a little kraken: a pointed mantle finned at its tip, big eyes, short curling arms.
    const c = M(L.famCol);
    const mantle = part(new THREE.SphereGeometry(0.085, 14, 12), c, 0, 0.17, 0);
    mantle.scale.set(1, 1.2, 0.95);
    const tip = part(new THREE.ConeGeometry(0.07, 0.14, 12), c, 0, 0.31, -0.02);
    tip.rotation.x = -0.35;
    g.add(mantle, tip);
    [-1, 1].forEach((s) => {
      const fin = part(new THREE.SphereGeometry(0.04, 8, 6), c, 0.06 * s, 0.32, -0.03);
      fin.scale.set(1.3, 0.5, 0.3);
      fin.rotation.z = 0.5 * s;
      g.add(fin);
    });
    eyes(0.026, 0.035, 0.16, 0.07);
    const arms = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3, ca = Math.cos(a), sa = Math.sin(a);
      const curve = new THREE.CatmullRomCurve3([[ca * 0.04, 0.09, sa * 0.04], [ca * 0.08, 0.02, sa * 0.08], [ca * 0.1, -0.04, sa * 0.09], [ca * 0.06, -0.07, sa * 0.05]].map((p) => new THREE.Vector3(...p)));
      const arm = new THREE.Group();
      arm.add(part(new THREE.TubeGeometry(curve, 12, 0.017, 6), c));
      g.add(arm);
      arms.push(arm);
    }
    Object.assign(fam, { tentacles: arms });
  } else if (L.fam === 'dragon') {
    // A dragon (YPPedia: Dragon; Tzz's D'rizzle): a round little body in its second colour, a big head
    // on it with a snout, a grin of teeth and big eyes, horns sweeping back and spines down its back in
    // its first; leathery wings half spread, a tail curling down to a spade, little arms and feet.
    const horn = M(L.famCol, { metalness: 0.35, roughness: 0.4 }), hide = M(L.famCol2), dark = M('#5a0a1c');
    const bodyM = part(new THREE.SphereGeometry(0.085, 12, 10), hide, 0, 0.1, 0);
    bodyM.scale.set(0.95, 1.15, 0.9);
    const tum = part(new THREE.SphereGeometry(0.06, 10, 8), M('#f07a8a'), 0, 0.09, 0.035);
    tum.scale.set(0.85, 1.1, 0.6);
    const head = new THREE.Group();
    head.position.set(0, 0.25, 0.03);
    head.add(part(new THREE.SphereGeometry(0.075, 12, 10), hide));
    const snout = part(new THREE.SphereGeometry(0.05, 10, 8), hide, 0, -0.025, 0.06);
    snout.scale.set(1.1, 0.75, 1.2);
    const mouth = part(new THREE.SphereGeometry(0.04, 10, 6), dark, 0, -0.045, 0.075);
    mouth.scale.set(1.2, 0.35, 0.8);
    head.add(snout, mouth);
    for (let i = 0; i < 4; i++) { const tooth = part(new THREE.ConeGeometry(0.008, 0.018, 4), white, -0.027 + i * 0.018, -0.036, 0.105); tooth.rotation.x = Math.PI; head.add(tooth); }
    [-1, 1].forEach((s) => {
      head.add(part(new THREE.SphereGeometry(0.026, 8, 6), white, 0.038 * s, 0.022, 0.055));
      head.add(part(new THREE.SphereGeometry(0.014, 6, 5), black, 0.042 * s, 0.024, 0.075));
      head.add(part(new THREE.SphereGeometry(0.007, 5, 4), black, 0.018 * s, -0.012, 0.118));   // (a nostril)
      const h = part(new THREE.ConeGeometry(0.02, 0.11, 8), horn, 0.045 * s, 0.075, -0.025);
      h.rotation.set(-0.7, 0, -0.35 * s);
      head.add(h);
    });
    for (let i = 0; i < 3; i++) { const sp = part(new THREE.ConeGeometry(0.015, 0.04, 5), horn, 0, 0.17 - i * 0.05, -0.075 - i * 0.004); sp.rotation.x = -0.8; g.add(sp); }
    const wingM = M(L.famCol2, { side: THREE.DoubleSide, roughness: 0.7 });
    const wings = [-1, 1].map((s) => {
      const w = new THREE.Group();
      w.position.set(0.05 * s, 0.17, -0.04);
      const shp = new THREE.Shape();
      shp.moveTo(0, 0); shp.lineTo(0.22, 0.1); shp.quadraticCurveTo(0.2, 0.02, 0.22, -0.04); shp.quadraticCurveTo(0.15, -0.03, 0.14, -0.09);
      shp.quadraticCurveTo(0.08, -0.06, 0.06, -0.11); shp.lineTo(0, -0.07); shp.lineTo(0, 0);
      const m = part(new THREE.ShapeGeometry(shp), wingM);
      m.scale.x = s;
      w.add(m);
      w.rotation.y = 0.7 * s;
      g.add(w);
      return w;
    });
    const curve = new THREE.CatmullRomCurve3([[0, 0.04, -0.07], [0, -0.06, -0.14], [0.04, -0.17, -0.1], [0.02, -0.22, -0.02]].map((p) => new THREE.Vector3(...p)));
    const tail = new THREE.Group();
    tail.add(part(new THREE.TubeGeometry(curve, 16, 0.02, 6), hide));
    const spade = part(new THREE.ConeGeometry(0.03, 0.05, 4), horn, 0.02, -0.24, 0.0);
    spade.rotation.x = Math.PI;
    tail.add(spade);
    const arms = [-1, 1].map((s) => {
      const a = part(new THREE.CapsuleGeometry(0.016, 0.05, 4, 6), hide, 0.05 * s, 0.13, 0.06);
      a.rotation.set(-1, 0, 0.4 * s);
      g.add(a);
      return a;
    });
    [-1, 1].forEach((s) => g.add(part(new THREE.SphereGeometry(0.03, 8, 6), hide, 0.05 * s, 0.03, 0.04)));
    g.add(bodyM, tum, head, tail);
    Object.assign(fam, { head, wings, tail, arms });
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
  } else if (fam.kind === 'octopus' || fam.kind === 'krakling') fam.tentacles.forEach((a, i) => { a.rotation.x = Math.sin(t * 2.5 + i) * 0.15; a.rotation.z = Math.cos(t * 2 + i * 1.3) * 0.12; });
  else if (fam.kind === 'squirrel') {
    // (Quick glances about, now and then a nibble at its nut; its tail flicks.)
    fam.head.rotation.y = Math.sin(t * 1.3) * 0.5 + (Math.sin(t * 7) > 0.97 ? 0.3 : 0);
    fam.head.rotation.x = (t % 4) < 0.6 ? 0.35 : 0;
    fam.tail.rotation.x = Math.sin(t * 2.2) * 0.12;
  } else if (fam.kind === 'dragon') {
    // (Looking about, its tail swishing, a stretch of its wings now and then.)
    fam.head.rotation.y = Math.sin(t * 0.8) * 0.45;
    fam.head.rotation.x = Math.sin(t * 1.7) * 0.08;
    fam.tail.rotation.y = Math.sin(t * 1.4) * 0.3;
    const flap = (t % 5) < 1.1 ? Math.sin(t * 12) * 0.55 : Math.sin(t * 1.2) * 0.08;
    fam.wings.forEach((w, i) => { w.rotation.y = (i ? 1 : -1) * (0.7 + flap); });
  } else if (fam.kind === 'bat') {
    fam.head.rotation.y = Math.sin(t * 0.8) * 0.4;
    const flap = (t % 6) < 0.9 ? Math.sin(t * 16) * 0.6 : Math.sin(t * 1.5) * 0.08;
    fam.wings.forEach((w, i) => { w.rotation.y = (i ? 1 : -1) * (0.6 + flap); });
  }
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
