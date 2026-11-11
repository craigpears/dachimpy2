/* Watching eyes: a portrait's eyes that follow you about the room (the user, 11 Nov, of the Count's
   portrait in Gravee's house: "The vampire portrait that's following you definitely needs to be a normal
   thing"). Any portrait in any scene can have them (src/den-gravee.ts's Portrait, `watch: true`);
   js/den/portraits.js's watching() draws them on a frame. TypeScript, compiled to js/eyes.js; tested in
   tests/eyes.test.ts. */
/** Where a pirate's eyes are on the wardrobe's figure (js/den-look.js): on its `body`, at (±x, y, its
    head's radius), the head 0.235 across for a woman ('f'), 0.25 for a man. An eyepatch covers the -x one. */
export const PIRATE_EYES = { x: 0.085, y: 0.95, head: { f: 0.235, m: 0.25 } };
/** A pirate's eyes, as points on its body: one with an eyepatch, else both. */
export function pirateEyes(look) {
    const z = look.body === 'f' ? PIRATE_EYES.head.f : PIRATE_EYES.head.m;
    return (look.patch ? [PIRATE_EYES.x] : [PIRATE_EYES.x, -PIRATE_EYES.x]).map((x) => ({ x, y: PIRATE_EYES.y, z }));
}
/** How high your face is (metres): what the eyes look at. */
export const FACE_UP = 1.5;
/** Which way a portrait's eyes look to follow you: (dx, dy), each -1 to 1, from where its eyes are on its
    wall (eyeX along it, eyeY up it) to where you are (youX along the wall, youZ out from it; the wall at
    wallZ), at your face's height, a little lazy. */
export function eyesToward(eyeX, eyeY, youX, youZ, wallZ) {
    const dx = youX - eyeX, dz = Math.max(0.5, youZ - wallZ), dy = FACE_UP - eyeY;
    const ax = Math.atan2(dx, dz) / (Math.PI / 2), ay = Math.atan2(dy, Math.hypot(dx, dz)) / (Math.PI / 2);
    const c = (v) => Math.max(-1, Math.min(1, v * 1.6));
    return [c(ax), c(ay)];
}
