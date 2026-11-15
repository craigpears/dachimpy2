/* Pirate Den: a war brig's plan, and the blockade's two brigs as config, each a look as a war frigate's is
   (src/den-frigate.ts). TypeScript, compiled to js/den-brig.js; tested in tests/den-brig.test.ts. js/den/frigate.js
   builds her from this plan, as it does any war frigate from hers.

   The user (15 Nov): "a middle ship class, so it's not a big [brawling] fighter ... it's got medium cannonballs ...
   but it can spawn the little [craft] ... spawn some haunted sloops that ... hang around for a set number of turns ...
   act kind of more like troop ... transports"; "the Atlantean ... sends out little [tritons] and turtles to go and ram
   the enemy ships from the distance"; and "work on like the equivalent of war brigs ... things that can launch smaller
   ships like little sloops and Atlantis creatures." So the blockade's brigs (src/blockade.ts): Tidecaller, an
   Atlantean, launching turtles that ram; Grave Lantern, a haunted brig, launching ghost sloops for a while.

   Sized as the war frigate is (src/ships.ts, hullFor): twice the sloop's length, her beam and a half less a little,
   deep enough that she holds what her hold does (WAR_BRIG, not yet checked against YPPedia). Two masts, a raised
   quarterdeck and a low forecastle, one row of ports. */
import { WAR_BRIG, hullFor } from './ships.js';
/** A war brig's hull, from the sloop's: two squares long and one wide on the blockade's board. */
export const BRIG_HULL = hullFor(WAR_BRIG, 2, 1.4);
/** The war brig. */
export const WAR_BRIG_PLAN = {
    hull: BRIG_HULL,
    quarter: { to: -1.6, up: 0.9 },
    fore: { from: 2.4, up: 0.45 },
    bulwark: { h: 0.6, t: 0.1 },
    bottom: 0.24, line: 0.05,
    stripes: { at: [0.62, 1.12], h: 0.07 },
    ports: { each: 4, size: 0.26, from: -2.9, to: 2.0, rows: 1 },
    masts: [
        { x: 1.25, foot: 3.4, sails: [[2.0, 1.2], [1.5, 0.9]] },
        { x: -0.9, foot: 3.6, sails: [[2.4, 1.4], [1.8, 1.0], [1.2, 0.6]] },
    ],
    helm: { x: -3.0 },
    stairs: { quarter: { len: 1.4 }, fore: { len: 0.6, w: 0.8 } },
    hatches: [{ x: 0.2, z: 0, w: 0.6 }],
    stern: { cabin: [-3.6, -2.8], windows: [-0.7, 0, 0.7], lanterns: [-0.85, 0.85], plate: 1.8, sprit: 0.6 },
};
/** Where her main deck's guns stand (one each side at each): two on the quarterdeck, two in the waist, her 8. */
const GUNS = [-3.6, -2.4, 0.3, 1.45];
/** Tidecaller, Dachimpy's flag's brig: an Atlantean, sea green and sand gold as Coral Throne is, a mermaid at her bow;
    she launches turtles to ram the other side's ships. */
export const TIDECALLER = {
    name: 'Tidecaller',
    paint: { hull: '#2a7f7a', sideboard: '#ecd9a2', railing: '#f4ead0', bottom: '#7a5a3c', deck: '#c8b07e', sails: '#dcf3ee', gold: '#e3b53f' },
    figurehead: { kind: 'mermaid', col: '#3fa69a' },
    guns: GUNS,
    gunKind: 'bronzeCannon',
    gunOpts: { col: '#3f8f7f', band: '#d9a93a' },
    furniture: [
        { kind: 'coral', x: -1.9, z: 0, opts: { col: '#ef7a6a' } },
        { kind: 'trident', x: 3.0, z: -0.35 },
        { kind: 'coral', x: 3.0, z: 0.4, opts: { col: '#d46aa8' } },
    ],
};
/** Grave Lantern, Dalnoth's flag's brig: a haunted brig, see-through and glowing faintly as Eldritch Wail is, a skull
    at her bow; she launches ghost sloops that last a while. */
export const GRAVE_LANTERN = {
    name: 'Grave Lantern',
    paint: { hull: '#34403f', sideboard: '#9fd8c0', railing: '#c8e8da', bottom: '#4a4440', deck: '#6e746a', sails: '#d3ecdf', gold: '#9fd8c0' },
    figurehead: { kind: 'skull', col: '#e8e4d0' },
    guns: GUNS,
    gunKind: 'skeletalCannon',
    ghost: true,
    furniture: [
        { kind: 'candelabra', x: -1.9, z: 0 },
        { kind: 'ghost', x: 3.0, z: -0.35, yaw: -Math.PI / 2, opts: { col: '#d8fff2' } },
        { kind: 'lantern', x: 3.0, z: 0.45 },
    ],
};
/** Every war brig there's a config for, by name. */
export const BRIGS = Object.fromEntries([TIDECALLER, GRAVE_LANTERN].map((f) => [f.name, f]));
