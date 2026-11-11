/* Pirate Den: what there is to do and to find, as the captain's map shows it, and the map's little tour.
   TypeScript, compiled to js/den-finds.js; tested in tests/den-finds.test.ts. js/den/quests.js draws
   them over the map.

   The user (10 Nov): "Can you build like that kind of intro thing ... maybe we need more when you get
   to the start or map stage ... I just know there's a lot of stuff in here and I want to make it ...
   discoverable given it's a proof of concept demo." At the map stage only, and tease, don't tell: the
   secrets are named and counted ("Ways past the checkpoint: 1 of 4"), never how or where. That's the
   one agreed exception to "Hidden gems, never hinted" (RULES.md): the tally says something's there
   to find, never the way to it. And then: "we can kind of hint at umami, the capybara to rescue,
   yeah, the friend to rescue ... I like that, that there are little quests ... you've got like the
   build the shack quest." So the map's list is a short list of little quests: the den's own jobs
   named plainly (they're no secret), and the secrets teased by their counts. Done ones are ticked,
   not hidden. Only what the den can tell is done is on it. */
import { CHART, X_AT } from './den-map.js';
import { SAIL } from './den-sail.js';
import { ISLE } from './den-isle.js';
import { TOUR_SAYS } from './lines/narrator.js';
export const WAYS = ['run', 'row', 'fight', 'locks', 'whirlpools'];
export const ROUTES = ['gate', 'locks', 'whirlpools'];
export const routeOf = (w) => (w === 'locks' || w === 'whirlpools' ? w : 'gate');
export const PLACES = ['cove', 'lagoon', 'vegas', 'smugglers'];
/** Found just now: the list with it in (once). */
export function addFind(found, f) {
    const list = [...(found ?? [])];
    if (!list.includes(f))
        list.push(f);
    return list;
}
/** Which way she got past the checkpoint, by what it said ('gate' or 'locks': Checkpoint.watch) and
    how she was going: through the gate at the oars she rowed it, under sail she ran it. With both
    its guns wrecked the gate's safe, so going through it is no way past of its own (knocking the
    guns out was: wayWrecked). */
export function wayThrough(how, at) {
    if (how === 'locks' || how === 'whirlpools')
        return how;
    if (at.silenced)
        return null;
    return at.oars ? 'row' : 'run';
}
/** Knocking both its guns out is a way past, found as the second gun's wrecked. */
export const wayWrecked = (silenced) => (silenced ? 'fight' : null);
/** What the list's headed. */
export const QUESTS_TITLE = 'Quests';
const job = (label, done) => ({ label, got: done ? 1 : 0, of: 1, secret: false });
const tease = (label, got, of) => ({ label, got, of, secret: true });
/** The list: the den's own jobs, the X, and the secrets, counted. */
export function quests(p) {
    const has = (f) => p.found.includes(f);
    return [
        { title: 'About the den', quests: [
                job('Build the walk along the wall', p.walk),
                job('Build the stairs up to it', p.stairs),
                job('Build the gun tower', p.tower),
                job('Build yer shack', p.shack),
            ] },
        { title: 'Out at sea', quests: [
                job('Haul up the treasure at the X', p.x),
                // (the isle's on the map, so it's named; what's afoot there isn't said: 11 Nov)
                job(`See what's afoot on the ${ISLE.NAME}`, p.wedding),
            ] },
        { title: 'Still to find', quests: [
                tease('Ways past the checkpoint', ROUTES.filter((r) => WAYS.some((w) => has(w) && routeOf(w) === r)).length, ROUTES.length),
                tease('Hidden places', PLACES.filter(has).length, PLACES.length),
                tease('Secret treasure', p.lagoonChest ? 1 : 0, 1),
                tease('A friend to rescue', p.umami ? 1 : 0, 1),
            ] },
    ];
}
/** Whether it's done (ticked). */
export const done = (q) => q.got >= q.of;
/** How it reads: a job by its name, a secret by its count ("Ways past the checkpoint: 1 of 4"). */
export const questLine = (q) => (q.secret ? `${q.label}: ${q.got} of ${q.of}` : q.label);
const lanes = CHART.lanes.slice(0, 2);
const laneC = lanes.flatMap((l) => [l.from[0], l.to[0]]), laneR = lanes.flatMap((l) => [l.from[1], l.to[1]]);
const K = CHART.checkpoint;
export const TOUR = [
    {
        say: TOUR_SAYS.den,
        at: [(CHART.den[0] + SAIL.HOME.c) / 2, (CHART.den[1] + SAIL.HOME.r) / 2], size: [9, 6],
    },
    {
        say: TOUR_SAYS.winds,
        at: [(Math.min(...laneC) + Math.max(...laneC)) / 2, (Math.min(...laneR) + Math.max(...laneR)) / 2], size: [5, Math.max(...laneR) - Math.min(...laneR) + 2],
    },
    {
        say: TOUR_SAYS.checkpoint,
        at: [K.gate, K.row], size: [K.to - K.from + 4, 3],
    },
    {
        say: TOUR_SAYS.wreck,
        at: [...X_AT], size: [7, 3],
    },
    {
        say: TOUR_SAYS.more,
        quests: true,
    },
];
/** Where the tour is after a key: the next step (past the last, it's over: -1), the last one back,
    or skipped altogether (one key skips it all). */
export function tourKey(step, key) {
    if (['escape', 'm'].includes(key))
        return -1;
    if (['arrowleft', 'backspace'].includes(key))
        return Math.max(0, step - 1);
    if ([' ', 'enter', 'arrowright', 'click'].includes(key))
        return step + 1 >= TOUR.length ? -1 : step + 1;
    return step;
}
