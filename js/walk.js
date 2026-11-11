/* A pirate's walk: how their legs swing, for every pirate moved anywhere (you, a crewmate, a raider,
   someone in a cutscene or a house). js/den/world.js's animateWalk draws it; this is the rule.

   The user, 11 Nov: "in the whiz along, it's definitely not really a walking motion. It's just kind of
   jittery legs. But I noticed it the same when you're in the getting the map scene ... you should
   actually look like [you're] walking when [you're] walking out to get the map."
   Why it jittered: two parts moved the same pirate each frame, one saying "not moving" (which snapped
   the legs back to the start of a step) and a cutscene saying "moving"; and the whiz swung the legs
   at a made-up rate up to four strides a second. So now:
   - the legs go with the distance actually travelled, at a cadence that rises gently with speed (an
     ordinary walk at the den's pace, 5.4 m/s, as it always was: 11 radians a second);
   - a fast mover runs: a longer stride and a bigger swing, the cadence never past a sprint's;
   - a stop eases the legs back to rest, and only once they've been still a moment, so one part
     saying "not moving" for a frame never flickers them. */
/** The cadence of an ordinary walk at the den's pace (radians of the stride's cycle a second). */
export const WALK_CADENCE = 11;
/** The den's walking pace (m/s), where the cadence is WALK_CADENCE (js/den/world.js's SPEED). */
export const WALK_PACE = 5.4;
/** How the cadence rises with speed (speed^this): faster mostly by a longer stride, as people do. */
export const CADENCE_RISE = 0.3;
/** A sprint's cadence: never faster than this (about two and a half strides a second). */
export const MAX_CADENCE = 15;
/** From this speed (m/s) a walk turns into a run, fully a run at RUN_FULL. */
export const RUN_FROM = 6.5;
export const RUN_FULL = 10;
/** How long (s) a pirate stands still before their legs start easing back to rest. */
export const STOP_GRACE = 0.12;
/** Further than a stride in one go at faster than this (m/s), or further than TELEPORT, they were put there, not walked. */
export const TELEPORT_SPEED = 30;
export const TELEPORT = 2.5;
/** The most a stride moves on in one frame (radians), so a long frame never jumps a whole step. */
export const MAX_STEP = 0.7;
/** The cadence (radians a second) at a speed (m/s). */
export function cadence(v) {
    if (v <= 0)
        return 0;
    return Math.min(MAX_CADENCE, WALK_CADENCE * Math.pow(v / WALK_PACE, CADENCE_RISE));
}
/** Radians of stride per metre travelled at a speed: shorter steps slow, longer ones fast. */
export function perMetre(v) {
    const s = Math.max(v, 0.6);
    return cadence(s) / s;
}
/** How much of a run (0, a walk, to 1, a run) at a speed. */
export function runness(v) {
    const u = Math.max(0, Math.min(1, (v - RUN_FROM) / (RUN_FULL - RUN_FROM)));
    return u * u * (3 - 2 * u);
}
export const newGait = () => ({ phase: 0, amp: 0, v: 0, still: 0 });
/** One step of the gait: they're at (x, z) now; `moving`, whether whoever moves them calls it walking;
    `fallback`, a cadence for walking with no way measured (on the spot, or moved with what they're on). */
export function gaitStep(g, x, z, moving, dt, fallback = WALK_CADENCE) {
    const had = g.x !== undefined && g.z !== undefined;
    const d = had ? Math.hypot(x - g.x, z - g.z) : 0;
    g.x = x;
    g.z = z;
    const put = d > TELEPORT || (d > 0.3 && d > dt * TELEPORT_SPEED);
    if (!moving || dt <= 0) {
        // Stood still (or not walking: aboard, at the helm). After a moment the legs ease back to rest.
        g.still += Math.max(0, dt);
        if (g.still > STOP_GRACE) {
            g.amp *= Math.exp(-dt * 10);
            if (g.amp < 0.01) {
                g.amp = 0;
                g.v = 0;
            }
        }
        return g;
    }
    g.still = 0;
    let step;
    if (d > 1e-5 && !put) {
        const v = d / dt;
        // (from a standstill, straight at their speed; then smoothed, so an uneven frame doesn't twitch)
        g.v = g.amp < 0.05 || g.v <= 0 ? v : g.v + (v - g.v) * Math.min(1, dt * 8);
        step = d * perMetre(g.v);
    }
    else if (put)
        step = 0;
    else
        step = dt * Math.min(fallback, MAX_CADENCE); // (walking, but going nowhere we can see)
    g.phase = (g.phase + Math.min(step, MAX_STEP)) % (Math.PI * 2);
    g.amp += (1 - g.amp) * Math.min(1, dt * 12);
    return g;
}
/** The pose a gait gives: the legs' swing (radians, one leg forward, the other back), the arms', the
    body's bob (m), and `swing`, the stride's -1..1 at its amplitude. */
export function gaitPose(g) {
    const run = runness(g.v), s = Math.sin(g.phase) * g.amp;
    return {
        leg: s * (0.6 + 0.35 * run),
        arm: s * (0.5 + 0.35 * run),
        bob: Math.abs(Math.cos(g.phase)) * (0.05 + 0.07 * run) * g.amp,
        swing: s,
    };
}
