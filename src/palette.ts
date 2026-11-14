/* Pirate Den: every colour a pirate can be drawn in, as plain data. TypeScript, compiled to js/palette.js;
   tested in tests/palette.test.ts. js/den-look.js draws pirates in them (its DYES, HAIR, FUR and SKIN are
   these), the wardrobe offers them, and catalogue-colours.html lists them all for anyone to look over.

   The user (14 Nov), looking at the code: "it's not very obvious at all where the source stuff is for all of
   the graphics ... I was expecting ... each of the colors ... a lot more modular and broken down so that if
   people wanted to contribute, they could just ... plug in something". And of Fable's periwinkle: "people are
   going to be sad if they can't completely recreate their pirate. So there needs to be a list somewhere."

   To add a colour or correct one: change its line here, saying where the colour came from. Clothing colours
   are named as YPPedia names them (Clothing palette, and Chroma for the limited editions since): one palette
   for everyone, and nobody has a colour of their own. Hair and furry familiars take any clothing colour too,
   beside their natural ones. Pirate names only. Knows nothing of three.js or the page. */

/** Where a clothing colour comes from in the game, as YPPedia's Clothing palette and Chroma pages group them. */
export type Group = 'standard' | 'seasonal' | 'chroma' | 'prize' | 'hunt';

export const GROUPS: readonly { id: Group; name: string; blurb: string }[] = [
  { id: 'standard', name: 'Standard', blurb: 'Any tailor makes these.' },
  { id: 'seasonal', name: 'Seasonal', blurb: 'Limited editions: gold boxes in their month, and mystery boxes.' },
  { id: 'chroma', name: 'Chromas', blurb: 'Limited editions only ever found as chromas: trading posts, greedy brigands, Fox boxes.' },
  { id: 'prize', name: 'Prizes and promotions', blurb: 'Limited editions from battle boxes, the Monthly Rewards Program and tournaments.' },
  { id: 'hunt', name: 'Sea monster hunts', blurb: 'Limited editions found in Atlantis, the Cursed Isles, the Haunted Seas, the Kraken\'s lair and werewolf expeditions.' },
];

/** A clothing colour: what it's called, how the den draws it, and where that came from. */
export interface Dye {
  /** As YPPedia names it. */
  readonly name: string;
  /** How the den draws it. */
  readonly hex: string;
  readonly group: Group;
  /** YPPedia's swatch, where it has one (Template:Color hex), when the den draws it otherwise. */
  readonly wiki?: string;
  /** Where the colour came from, in plain words. */
  readonly from: string;
}

const WIKI = "YPPedia's swatch";
const d = (name: string, hex: string, group: Group, from = WIKI, wiki?: string): Dye => ({ name, hex, group, from, ...(wiki ? { wiki } : {}) });

/** Every Puzzle Pirates clothing colour: the tailor's standard palette in YPPedia's order, then the limited
    editions. (The order is the wardrobe's palette's; a look stores a colour by its name, so reordering is safe.) */
export const PALETTE: readonly Dye[] = [
  // ---- the tailor's standard palette (YPPedia: Clothing palette) ----
  d('aqua', '#65c9c9', 'standard'),
  d('black', '#2a2a2e', 'standard', "YPPedia's swatch, a shade off pure black so its folds show", '#000000'),
  // (Blue and light blue sampled from Tzz's portrait, 13 Nov: her knickers' stripes and her Rag shirt; the
  // wiki's swatches were a deep royal blue and an icy cyan the game doesn't draw.)
  d('blue', '#4d78cf', 'standard', "Tzz's portrait: her knickers' stripes", '#2a6fd7'),
  d('brown', '#7d5c35', 'standard'),
  d('gold', '#ffbe00', 'standard'),
  d('green', '#3b6c2c', 'standard'),
  d('grey', '#cbcdd1', 'standard'),
  d('lavender', '#d9b0ff', 'standard'),
  d('light blue', '#8cc8f6', 'standard', "Tzz's portrait: her Rag shirt", '#a8f2ff'),
  d('light green', '#669619', 'standard'),
  d('lime', '#3fd837', 'standard'),
  d('lemon', '#fffbbf', 'standard'),
  d('magenta', '#c9227b', 'standard'),
  d('maroon', '#9e171b', 'standard'),
  d('mint', '#90ffb9', 'standard'),
  d('navy', '#434ca2', 'standard'),
  d('orange', '#f57c09', 'standard'),
  d('peach', '#ffd5a8', 'standard'),
  d('persimmon', '#ff5300', 'standard'),
  d('pink', '#fe79a4', 'standard'),
  d('purple', '#6104ad', 'standard'),
  d('red', '#d72c22', 'standard'),
  d('rose', '#ffc4d6', 'standard'),
  d('tan', '#ad8047', 'standard'),
  d('violet', '#bf3bc4', 'standard'),
  d('white', '#f6f2ea', 'standard', "YPPedia's swatch, a shade off pure white so its folds show", '#ffffff'),
  d('yellow', '#f8ff35', 'standard'),

  // ---- limited editions: seasonal (YPPedia: Clothing palette, Seasonal; Chroma) ----
  d('banana', '#ffe600', 'seasonal', "YPPedia's swatch (June's)"),
  d('chocolate', '#863814', 'seasonal', "YPPedia's swatch (October's)"),
  d('cranberry', '#b2042a', 'seasonal', "YPPedia's swatch (December's, beside wine)"),
  // (Cream: chocolate boxes' and a gold box's chroma; YPPedia has no swatch for it, so this is a plain cream
  // until someone's portrait shows it.)
  d('cream', '#f1e4c4', 'seasonal', 'a guess: YPPedia has no swatch for it'),
  d('hot pink', '#ff57ae', 'seasonal', "YPPedia's swatch (February's, 2021 to 2024)"),
  d('ice blue', '#d5f6fe', 'seasonal', "YPPedia's swatch (February's)"),
  // (Periwinkle, since April 2019 (Fable asked, 14 Nov). YPPedia's swatch is a pale lavender-blue; the game draws
  // periwinkle hair and familiars a deeper blue-violet, about #7070f0, so its clothing may be deeper too.)
  d('periwinkle', '#ccccff', 'seasonal', "YPPedia's swatch (April's, since 2019); the game draws periwinkle hair and familiars deeper, nearer #7070f0"),
  d('plum', '#4c0e78', 'seasonal', "YPPedia's swatch (a deep purple)"),
  d('pumpkin', '#ed7601', 'seasonal', "YPPedia's swatch (October 2021's)"),
  d('spring green', '#8bfe00', 'seasonal', "YPPedia's swatch (April's)"),
  // (Vibrant red: Tzz's D'rizzle, a dragon in silver and vibrant red from the February 2025 gold box, sampled
  // from her portrait, 11 Nov: his body. A chroma since too.)
  d('vibrant red', '#d7094a', 'seasonal', "Tzz's portrait: her dragon D'rizzle's body"),
  d('wine', '#992c60', 'seasonal', "YPPedia's swatch (December's)"),

  // ---- limited editions: chromas ----
  d('emerald', '#00c152', 'chroma'),
  d('sea green', '#00b69a', 'chroma'),
  // (Silver: Tzz's D'rizzle's horns, sampled from her portrait, 11 Nov.)
  d('silver', '#a6a9bf', 'chroma', "Tzz's portrait: her dragon D'rizzle's horns", '#b8dbff'),

  // ---- limited editions: prizes and promotions ----
  d('blue grey', '#89a5cd', 'prize'),
  // (Crimson: the deep, blue-ish red of Mischievious's "What is Love?" gown, from her portrait, 11 Nov.)
  d('crimson', '#a8031f', 'prize', 'Mischievious\'s portrait: her "What is Love?" gown', '#bb0028'),
  d('royal blue', '#001ff2', 'prize'),
  // (Shadow: Dignity's coat, from her portrait, 10 Nov.)
  d('shadow', '#674c7b', 'prize', "Dignity's portrait: her coat", '#4f3165'),

  // ---- limited editions: sea monster hunts ----
  // (Atlantean: Dignity's coat's facings, from her portrait, 10 Nov.)
  d('atlantean', '#afb8fe', 'hunt', "Dignity's portrait: her coat's facings", '#89b7ff'),
  d('hunter', '#0c4c36', 'hunt', "YPPedia's swatch (werewolf expeditions' wolf boxes, since 2023)"),
  d('indigo', '#4d27d2', 'hunt', "YPPedia's swatch (the Cursed Isles)"),
  d('inky', '#3b3582', 'hunt', "YPPedia's swatch (the Kraken's lair)"),
  d('night blue', '#00009c', 'hunt', "YPPedia's swatch (the Haunted Seas)"),
];

/** The clothing colours by name, as js/den-look.js draws them: its DYES. */
export const DYES: Record<string, string> = Object.fromEntries(PALETTE.map((c) => [c.name, c.hex]));

/** A colour that isn't a clothing colour (hair, fur, skin): how it's drawn, and where it came from. */
export interface Shade { readonly name: string; readonly hex: string; readonly from: string }

/** Natural hair colours. Hair takes any clothing colour too (a pink, a silver): those are the palette's. */
export const HAIRS: readonly Shade[] = [
  { name: 'black', hex: '#1f1a17', from: 'the den\'s own' },
  { name: 'dark brown', hex: '#3b2414', from: 'the den\'s own' },
  { name: 'brown', hex: '#6a4020', from: 'the den\'s own' },
  { name: 'light brown', hex: '#8e7543', from: "Tzz's portrait" },
  { name: 'auburn', hex: '#7f2e16', from: 'the den\'s own' },
  { name: 'red', hex: '#9a0a08', from: "Mischievious's portraits: her deep red curls" },
  { name: 'ginger', hex: '#c4642a', from: 'the den\'s own' },
  { name: 'blonde', hex: '#dcb565', from: 'the den\'s own' },
  { name: 'grey', hex: '#a09a92', from: 'the den\'s own' },
  { name: 'white', hex: '#ece8e0', from: 'the den\'s own' },
];
/** Its own colours first, then every clothing colour it hasn't a name for already. */
const withDyes = (own: readonly Shade[]): Record<string, string> => ({ ...Object.fromEntries(own.map((c) => [c.name, c.hex])), ...Object.fromEntries(PALETTE.filter((c) => !own.some((o) => o.name === c.name)).map((c) => [c.name, c.hex])) });
/** Every colour hair can be, by name: the natural ones, then the palette. */
export const HAIR: Record<string, string> = withDyes(HAIRS);

/** Monkeys' and squirrels' fur: natural colours (YPPedia: Monkey), white (a champion's) and lavender (a Booch
    Box's). Furry familiars take any clothing colour too: those are the palette's. */
export const FURS: readonly Shade[] = [
  { name: 'brown', hex: '#6b4423', from: 'natural' },
  { name: 'tan', hex: '#ad8047', from: 'natural' },
  { name: 'ginger', hex: '#b5652a', from: 'natural' },
  { name: 'grey', hex: '#8a8a8a', from: 'natural' },
  { name: 'black', hex: '#2a2a2e', from: 'natural' },
  { name: 'cream', hex: '#e9dcc0', from: 'natural' },
  { name: 'white', hex: '#f7f5f0', from: "a champion's" },
  { name: 'lavender', hex: '#b9a9ea', from: 'a Booch Box' },
];
/** Every colour a monkey's or a squirrel's fur can be, by name: its own, then the palette. */
export const FUR: Record<string, string> = withDyes(FURS);
/** A furry familiar's face and tummy, where its fur's colour has its own (a lavender monkey's are white). */
export const FUR_FACE: Record<string, string> = { lavender: '#fbf8ff' };

/** Skin tones, by number (a look keeps its skin's index, so new ones go on the end). */
export const SKIN: readonly string[] = ['#f6d3b0', '#f0bf8e', '#d9a066', '#b57a4a', '#8a5530', '#5c3a22', '#9a887c'];
