/* Pirate Den: every colour a pirate can be drawn in, as plain data. TypeScript, compiled to js/palette.js;
   tested in tests/palette.test.ts. js/den-look.js draws pirates in them (its DYES, HAIR, FUR and SKIN are
   these), the wardrobe offers them, and catalogue-colours.html lists them all for anyone to look over.

   The user (14 Nov), looking at the code: "it's not very obvious at all where the source stuff is for all of
   the graphics ... I was expecting ... each of the colors ... a lot more modular and broken down so that if
   people wanted to contribute, they could just ... plug in something". And of Fable's periwinkle: "people are
   going to be sad if they can't completely recreate their pirate. So there needs to be a list somewhere."

   To add a colour or correct one: change its line here, saying where the colour came from. Clothing colours
   are named as YPPedia names them (Clothing palette, and Chroma for the limited editions since). A colour
   sampled from a real pirate's portrait is `checked`: that's how the game draws it. One from YPPedia's
   swatch alone isn't, and the catalogue says so; the wiki's swatches aren't always how the game draws the
   colour (its blue and light blue weren't). Pirate names only. Knows nothing of three.js or the page. */
export const GROUPS = [
    { id: 'standard', name: 'Standard', blurb: 'Any tailor makes these.' },
    { id: 'seasonal', name: 'Seasonal', blurb: 'Limited editions: gold boxes in their month, and mystery boxes.' },
    { id: 'chroma', name: 'Chromas', blurb: 'Limited editions only ever found as chromas: trading posts, greedy brigands, Fox boxes.' },
    { id: 'prize', name: 'Prizes and promotions', blurb: 'Limited editions from battle boxes, the Monthly Rewards Program and tournaments.' },
    { id: 'hunt', name: 'Sea monster hunts', blurb: 'Limited editions found in Atlantis, the Cursed Isles, the Haunted Seas, the Kraken\'s lair and werewolf expeditions.' },
];
const WIKI = "YPPedia's swatch";
const d = (name, hex, group, from = WIKI, checked = false, wiki) => ({ name, hex, group, from, checked, ...(wiki ? { wiki } : {}) });
/** Every Puzzle Pirates clothing colour: the tailor's standard palette in YPPedia's order, then the limited
    editions. (The order is the wardrobe's palette's; a look stores a colour by its name, so reordering is safe.) */
export const PALETTE = [
    // ---- the tailor's standard palette (YPPedia: Clothing palette) ----
    d('aqua', '#65c9c9', 'standard'),
    d('black', '#2a2a2e', 'standard', "YPPedia's swatch, a shade off pure black so its folds show", false, '#000000'),
    // (Blue and light blue sampled from Tzz's portrait, 13 Nov: her knickers' stripes and her Rag shirt; the
    // wiki's swatches were a deep royal blue and an icy cyan the game doesn't draw.)
    d('blue', '#4d78cf', 'standard', "Tzz's portrait: her knickers' stripes", true, '#2a6fd7'),
    d('brown', '#7d5c35', 'standard'),
    d('gold', '#ffbe00', 'standard'),
    d('green', '#3b6c2c', 'standard'),
    d('grey', '#cbcdd1', 'standard'),
    d('lavender', '#d9b0ff', 'standard'),
    d('light blue', '#8cc8f6', 'standard', "Tzz's portrait: her Rag shirt", true, '#a8f2ff'),
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
    d('white', '#f6f2ea', 'standard', "YPPedia's swatch, a shade off pure white so its folds show", false, '#ffffff'),
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
    // (Plum: Mischievious's dress and boots in "Son of a Nutcracker!", 11 Nov, sampled from her portrait. YPPedia's
    // plum is a deep purple, #4c0e78, and this is nearer its wine: she may be wearing wine. Not changed, so her
    // look draws as it did, until someone checks.)
    d('plum', '#86094f', 'seasonal', "Mischievious's portrait (her dress); YPPedia's plum is a deep purple, so this may be her wine", false, '#4c0e78'),
    d('pumpkin', '#ed7601', 'seasonal', "YPPedia's swatch (October 2021's)"),
    d('spring green', '#8bfe00', 'seasonal', "YPPedia's swatch (April's)"),
    // (Vibrant red: Tzz's D'rizzle, a dragon in silver and vibrant red from the February 2025 gold box, sampled
    // from her portrait, 11 Nov: his body. A chroma since too.)
    d('vibrant red', '#d7094a', 'seasonal', "Tzz's portrait: her dragon D'rizzle's body", true),
    d('wine', '#992c60', 'seasonal', "YPPedia's swatch (December's)"),
    // ---- limited editions: chromas ----
    d('emerald', '#00c152', 'chroma'),
    d('sea green', '#00b69a', 'chroma'),
    // (Silver: Tzz's D'rizzle's horns, sampled from her portrait, 11 Nov.)
    d('silver', '#a6a9bf', 'chroma', "Tzz's portrait: her dragon D'rizzle's horns", true, '#b8dbff'),
    // ---- limited editions: prizes and promotions ----
    d('blue grey', '#89a5cd', 'prize'),
    // (Crimson: the deep, blue-ish red of Mischievious's "What is Love?" gown, from her portrait, 11 Nov.)
    d('crimson', '#a8031f', 'prize', 'Mischievious\'s portrait: her "What is Love?" gown', true, '#bb0028'),
    d('royal blue', '#001ff2', 'prize'),
    // (Shadow: Dignity's coat, from her portrait, 10 Nov.)
    d('shadow', '#674c7b', 'prize', "Dignity's portrait: her coat", true, '#4f3165'),
    // ---- limited editions: sea monster hunts ----
    // (Atlantean: Dignity's coat's facings, from her portrait, 10 Nov.)
    d('atlantean', '#afb8fe', 'hunt', "Dignity's portrait: her coat's facings", true, '#89b7ff'),
    d('hunter', '#0c4c36', 'hunt', "YPPedia's swatch (werewolf expeditions' wolf boxes, since 2023)"),
    d('indigo', '#4d27d2', 'hunt', "YPPedia's swatch (the Cursed Isles)"),
    d('inky', '#3b3582', 'hunt', "YPPedia's swatch (the Kraken's lair)"),
    d('night blue', '#00009c', 'hunt', "YPPedia's swatch (the Haunted Seas)"),
];
/** The clothing colours by name, as js/den-look.js draws them: its DYES. */
export const DYES = Object.fromEntries(PALETTE.map((c) => [c.name, c.hex]));
/** Hair colours, as the wardrobe has them (the portrait's hair dyes are many more; these are the den's). */
export const HAIRS = [
    { name: 'black', hex: '#1f1a17', from: 'the den\'s own' },
    { name: 'dark brown', hex: '#3b2414', from: 'the den\'s own' },
    { name: 'brown', hex: '#6a4020', from: 'the den\'s own' },
    { name: 'light brown', hex: '#8e7543', from: "Tzz's portrait" },
    { name: 'auburn', hex: '#7f2e16', from: 'the den\'s own' },
    { name: 'red', hex: '#9a0a08', from: "Mischievious's portraits: her deep red curls" },
    { name: 'ginger', hex: '#c4642a', from: 'the den\'s own' },
    { name: 'blonde', hex: '#dcb565', from: 'the den\'s own' },
    { name: 'grey', hex: '#a09a92', from: 'the den\'s own' },
    { name: 'silver', hex: '#b2b9c6', from: "Helium's portrait: a grey-white, not Gravee's white" },
    { name: 'white', hex: '#ece8e0', from: 'the den\'s own' },
    { name: 'pink', hex: '#e8609a', from: 'Zizzy\'s "Pinky and the pink"' },
];
export const HAIR = Object.fromEntries(HAIRS.map((c) => [c.name, c.hex]));
/** Monkeys' and squirrels' fur: natural colours (YPPedia: Monkey), white (a champion's) and a few limited
    editions (lavender, from a Booch Box; pink, Mischievious's monkey in "What is Love?"; plum, Helium's King,
    their Emerald pirate page's "plum" monkey, a deeper, bluer purple in his portrait than the plum dye). */
export const FURS = [
    { name: 'brown', hex: '#6b4423', from: 'natural' },
    { name: 'tan', hex: '#ad8047', from: 'natural' },
    { name: 'ginger', hex: '#b5652a', from: 'natural' },
    { name: 'grey', hex: '#8a8a8a', from: 'natural' },
    { name: 'black', hex: '#2a2a2e', from: 'natural' },
    { name: 'cream', hex: '#e9dcc0', from: 'natural' },
    { name: 'white', hex: '#f7f5f0', from: "a champion's" },
    { name: 'lavender', hex: '#b9a9ea', from: 'a Booch Box' },
    { name: 'pink', hex: '#be667f', from: 'Mischievious\'s monkey in "What is Love?"' },
    { name: 'plum', hex: '#734b91', from: "Helium's portrait: their monkey King" },
];
export const FUR = Object.fromEntries(FURS.map((c) => [c.name, c.hex]));
/** A furry familiar's face and tummy, where its fur's colour has its own (a lavender monkey's are white; King's a pale lilac). */
export const FUR_FACE = { lavender: '#fbf8ff', plum: '#a98bc4' };
/** Skin tones, by number (a look keeps its skin's index, so new ones go on the end). The last, a cool deep
    brown: Helium's, sampled from their portrait, 13 Nov; the warmer browns before it drew them orange. */
export const SKIN = ['#f6d3b0', '#f0bf8e', '#d9a066', '#b57a4a', '#8a5530', '#5c3a22', '#9a887c'];
