# The den's furniture

Every piece of furniture in the Pirate Den is in this folder, one small file each (or one file for a small
family, like the candelabra and the sconce in `candles.js`). The houses, Primates Rule's deck, the smugglers'
beach and anywhere else just pick pieces by name and place them.

To see them all, open **`catalogue-furniture.html`** (run `python -m http.server 8642` in the project's folder,
then go to `http://localhost:8642/catalogue-furniture.html`). It's drawn from this folder, so a piece you add
shows up there by itself.

## What a piece is

A piece is a function that builds it out of simple shapes and returns `{ g }`, a three.js `Group`:

- **standing on the floor at its origin**, so `y = 0` is the floor;
- **facing +z**, toward you (a chair's seat, a cannon's muzzle, a picture's front);
- **in metres**: a chair seat is about 0.46 high, a door 2.2, a pirate about 1.8.
- It takes **one object of options**, every one with a default, so `barrel()` and `barrel({ h: 1.2 })` both work.
- Anything that moves has a **`tick(dt)`** too (`dt` in seconds), like the candles' flames or the gibbet's cage.
- Something that hangs on a wall has its back at its origin and its middle at a height `y` (an option).

## Adding a piece

1. **Make a file** here named after it, in lower case with dashes: `writing-desk.js`. Start with a short comment
   saying what it is and where it's for, then the builder:

   ```js
   /* A writing desk, its lid open, an inkwell and a quill on it. */
   import { THREE, mat, woodTex, box, cyl, brass } from './parts.js';

   /** A writing desk. `col`: its wood. */
   export function writingDesk({ col = '#7a4a28' } = {}) {
     const g = new THREE.Group(), wood = mat(col, { map: woodTex });
     g.add(box(1.0, 0.06, 0.55, wood, 0, 0.75, 0));     // the top: 1 m wide, 0.75 up
     for (const x of [-0.45, 0.45]) for (const z of [-0.22, 0.22]) g.add(box(0.05, 0.72, 0.05, wood, x, 0.36, z));
     g.add(cyl(0.03, 0.035, 0.05, brass, 0.3, 0.8, 0.1)); // the inkwell
     return { g };
   }

   export const PIECES = [
     { id: 'writingDesk', name: 'Writing desk', group: 'house', make: writingDesk,
       about: 'A writing desk, an inkwell on it. Options: col (its wood).',
       where: 'Nowhere yet.' },
   ];
   ```

2. **Add it to the registry**, `index.js`: one line beside the others,

   ```js
   import * as writingDeskFile from './writing-desk.js'; export * from './writing-desk.js';
   ```

   and `writingDeskFile` in the `FILES` list under them, where you'd like it in the catalogue.

3. **Look at it** in `catalogue-furniture.html`, turn it round, and change it till it's right.

4. **Use it** anywhere by its id: a house's list of furniture (`src/den-gravee.ts`'s `FURNISH`, say) takes
   `{ kind: 'writingDesk', x, z }`.

5. Run `npm test` (the furniture's own checks are in `tests/furniture.test.ts`: every file in the registry, every
   piece with a name, a group, what it is and where it's used).

## The registry's fields

Each entry in a file's `PIECES`:

| field | what it is |
| --- | --- |
| `id` | the name the den's code uses for it (`'writingDesk'`): letters only, no spaces |
| `name` | its name in plain words, as the catalogue shows it |
| `group` | the catalogue's section: `house`, `light`, `pictures`, `skeleton`, `cargo` or `museum` (`GROUPS` in `index.js`) |
| `about` | what it is, in a sentence, and its options |
| `where` | where in the den it's used |
| `make` | the builder |
| `sample` | (optional) the options the catalogue shows it with, like the words on a sign |
| `onWall` | (optional) `true` if it hangs on a wall |
| `small` | (optional) `true` if it's little, so the catalogue's camera comes in close |

## What to build with

`parts.js` has everything a piece needs, so you rarely import anything else:

- **shapes**: `box(w, h, d, material, x, y, z)`, `cyl(rTop, rFoot, h, material, x, y, z, sides)`,
  `rod([x, y, z], [x, y, z], r, material)` (a stick from one point to another), `ball(r, material, x, y, z)`,
  and `at(mesh, x, y, z)` to move anything;
- **materials** shared by every piece: `dark` and `mid` wood, `ebony`, `brass`, `gilt`, `wax`, `bone`, `socket`
  (black), `ironBlack`, `steel`, `ivory`, `greyStone`, `glass`, `straw`, `cork`; `cloth(colour)` for upholstery;
  `mat(colour, options)` for a material of your own;
- **`canvasTex(w, h, draw)`**: a texture you paint with an ordinary 2D canvas (a rug's pattern, a sign's words).

Use the shared materials where you can: a ship or a room full of pieces then bakes down to a few meshes and
stays quick to draw. A material only your piece uses goes at the top of its own file, made once, not inside the
builder (unless it's in a colour passed in, like `cloth(col)`).

Keep it simple: the den's look is chunky and low-poly, a few boxes and cylinders, as Puzzle Pirates' furniture
was. A piece needs nothing of the rest of the den: never import `world.js` or the den's state here.
