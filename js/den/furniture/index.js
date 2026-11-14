/* Furniture: every piece in the houses (and anywhere else that wants one), each a small module of its own in
   this folder (the user, 11 Nov: the vampire's coffin is "just a bit of furniture that you can use anywhere",
   and the same goes for portrait frames, the easel, chairs, rugs, candles; 14 Nov: laid out so anyone can add
   a piece, README.md says how). Each is a function taking a few options and returning `{ g }`, a three.js
   Group standing on the floor at its origin, facing +z (toward you); one that moves has a `tick(dt)` too, and
   its own controls (the coffin's lid and whoever's in it). A house only places them (its rules say where:
   src/den-gravee.ts's FURNISH). As in Puzzle Pirates, where furniture was something you bought and put
   anywhere in your house (YPPedia, Furniture).

   This is the registry: every piece, in order, by its id (the name a house's rules use), with a name, a group
   (the catalogue's section), what it is (`about`, its options) and where it's used (`where`), and its builder
   (`make`). catalogue-furniture.html lists it, so a piece added here shows there by itself. */
// Each piece's file, in the catalogue's order; every builder in it exported from here by its own name, as
// `import { rug, frame } from './furniture.js'` has always had them (and a file's own PIECES under FILES).
// A new piece: a line here for its file, and its name in FILES below (README.md).
import * as rugFile from './rug.js'; export * from './rug.js';
import * as chairFile from './chair.js'; export * from './chair.js';
import * as armchairFile from './armchair.js'; export * from './armchair.js';
import * as tableFile from './table.js'; export * from './table.js';
import * as bedFile from './bed.js'; export * from './bed.js';
import * as coffinFile from './coffin.js'; export * from './coffin.js';
import * as doorFile from './door.js'; export * from './door.js';
import * as candlesFile from './candles.js'; export * from './candles.js';
import * as lanternFile from './lantern.js'; export * from './lantern.js';
import * as frameFile from './frame.js'; export * from './frame.js';
import * as signFile from './sign.js'; export * from './sign.js';
import * as cardFile from './card.js'; export * from './card.js';
import * as easelFile from './easel.js'; export * from './easel.js';
import * as skeletonFile from './skeleton.js'; export * from './skeleton.js';
import * as skeletonChairFile from './skeleton-chair.js'; export * from './skeleton-chair.js';
import * as skeletalCannonFile from './skeletal-cannon.js'; export * from './skeletal-cannon.js';
import * as gibbetFile from './gibbet.js'; export * from './gibbet.js';
import * as armourFile from './armour.js'; export * from './armour.js';
import * as grandPianoFile from './grand-piano.js'; export * from './grand-piano.js';
import * as anchorChairFile from './anchor-chair.js'; export * from './anchor-chair.js';
import * as jarFile from './jar.js'; export * from './jar.js';
import * as toolChestFile from './tool-chest.js'; export * from './tool-chest.js';
import * as crateFile from './crate.js'; export * from './crate.js';
import * as barrelFile from './barrel.js'; export * from './barrel.js';
import * as tarpPileFile from './tarp-pile.js'; export * from './tarp-pile.js';
import * as rowboatFile from './rowboat.js'; export * from './rowboat.js';
import * as stillFile from './still.js'; export * from './still.js';
import * as cookiePlateFile from './cookie-plate.js'; export * from './cookie-plate.js';
import * as shelfFile from './shelf.js'; export * from './shelf.js';
import * as simModelFile from './sim-model.js'; export * from './sim-model.js';
export { place } from './parts.js';

const FILES = [
  rugFile, chairFile, armchairFile, tableFile, bedFile, coffinFile, doorFile,
  candlesFile, lanternFile,
  frameFile, signFile, cardFile, easelFile,
  skeletonFile, skeletonChairFile, skeletalCannonFile, gibbetFile, armourFile, grandPianoFile, anchorChairFile, jarFile, toolChestFile,
  crateFile, barrelFile, tarpPileFile, rowboatFile, stillFile,
  cookiePlateFile, shelfFile, simModelFile,
];

/** The catalogue's sections, in order. */
export const GROUPS = [
  { id: 'house', name: 'About the house', blurb: 'Rugs, chairs, tables, a bed, a coffin, a door: what a house is furnished with.' },
  { id: 'light', name: 'Light', blurb: 'Candles and a lantern. Their flames flicker in the den.' },
  { id: 'pictures', name: 'Pictures and words', blurb: 'For a wall: a frame for a portrait, a sign, a museum\'s card; and an easel to paint on.' },
  { id: 'skeleton', name: 'The skeleton set and its company', blurb: 'Bone white on black, as Puzzle Pirates has them, and what else is on Primates Rule\'s deck.' },
  { id: 'cargo', name: 'Cargo, and outdoors', blurb: 'Crates, barrels and a rowboat for a beach, and a copper still.' },
  { id: 'museum', name: 'A museum\'s things', blurb: 'Dachimpy\'s: their trinkets, the old sim\'s board in miniature, and cookies.' },
];

/** Every piece, in order: { id, name, group, about, where, make, sample?, onWall?, small? }. `sample`: the
    options the catalogue shows it with (words on a sign, say); `onWall`: it hangs on a wall (its back at its
    origin); `small`: it's little (a plate), so the catalogue's camera comes in close. */
export const PIECES = FILES.flatMap((f) => f.PIECES);

/** Every piece's builder by its id (the name a house's rules use: src/den-gravee.ts's FURNISH; a ship's deck:
    src/den-frigate.ts; the smugglers' beach: src/den-smugglers.ts; Dachimpy's museum: src/den-dachimpy.ts). */
export const FURNITURE = Object.fromEntries(PIECES.map((p) => [p.id, p.make]));
