/* Pirate Den: the blockade's bots (src/blockade-ai/), the board as they read it: a buoy's worth, and the berths off a
   gate's towers and guns, worked out once for each kind of ship. TypeScript, compiled to js/blockade-ai/places.js. */
import type { Pose } from '../den-sail.js';
import type { Side } from '../ship-handling.js';
import { BLOCKADE, type Blockade, type Ship, type Buoy } from '../blockade.js';
import { squares } from '../ship-handling.js';
import { type Goal } from './config.js';

/** A buoy's worth to one side: whose it is just now, and whether a friend's already on it (each kind's AI weighs it
    further, `buoyWorth`). */
export function worth(b: Blockade, s: Ship, buoy: Buoy, i: number, mates: Goal[]): number {
  const hold = b.hold(buoy), friend = b.ships.some((o) => o !== s && o.team === s.team && b.reaches(o, buoy));
  let w = buoy.pennants * (hold === s.team ? (friend ? 0.15 : 1) : hold === 'contested' ? 1.4 : hold ? 1.5 : 1.2);
  if (mates.some((g) => g.kind === 'buoy' && g.i === i)) w *= 0.35;
  return w;
}


/** Any of her squares in one of the fort's gateways (its rows, about its way): lying there she's half in and half out,
    a sitting duck from astern. */
export function inGateway(s: Ship): boolean {
  return squares(s.h, s.helm.pose).some(([c, r]) => BLOCKADE.GATES.some((g) => r >= g.r0 && r <= g.r1 && Math.abs(c - g.way) <= 2));
}

export type Berth = { g: number; tower: number; pose: Pose; side: Side };
export type GunBerth = { g: number; i: number; pose: Pose; side: Side };
/** The towers standing, gate by gate: what the berths by them hang on. */
export const towersSig = (b: Blockade) => b.gates.map((x) => x.towers.map((t) => t.hp > 0 ? 1 : 0).join('')).join('/');
const berthsKept = new WeakMap<Blockade, Map<string, Berth[]>>();
/** Every berth a ship of her kind can lie in with one side's broadside landing on a standing tower of a gate, from
    either side of its wall (the rocks only: worked out once for her kind while the same towers stand), her nearest
    first. */
export function bombardBerths(b: Blockade, s: Ship): Berth[] {
  let kept = berthsKept.get(b);
  if (!kept) berthsKept.set(b, kept = new Map());
  const k = `${s.kind}|${towersSig(b)}`;
  let all = kept.get(k);
  if (!all) {
    all = [];
    const sea = s.sea.bare();
    for (const [g, gate] of b.gates.entries()) {
      if (gate.open()) continue;
      const rows = [...Array.from({ length: 5 }, (_, n) => gate.r0 - 1 - n), ...Array.from({ length: 5 }, (_, n) => gate.r1 + 1 + n)];
      for (let c = gate.way - 6; c <= gate.way + 6; c++) for (const r of rows) for (const d of [1, 3]) {
        const pose = { c, r, d };
        if (!sea.fits(pose)) continue;
        for (const side of ['L', 'R'] as Side[]) {
          const t = b.aim(s.id, side, pose, false).find((x) => x.what?.what === 'tower');
          if (t && t.what?.what === 'tower' && t.what.g === g) all.push({ g, tower: t.what.i, pose, side });
        }
      }
    }
    kept.set(k, all);
  }
  const p = s.helm.pose, far = (x: Berth) => Math.hypot(x.pose.c - p.c, x.pose.r - p.r);
  return [...all].sort((a, z) => far(a) - far(z));
}
const gunsKept = new WeakMap<Blockade, Map<string, GunBerth[]>>();
/** Every berth a ship of her kind can lie in with one side's broadside landing on one of a gate's bastion guns still
    standing (rocks only, worked out once while the same guns stand). */
export function gunBerths(b: Blockade, s: Ship): GunBerth[] {
  let kept = gunsKept.get(b);
  if (!kept) gunsKept.set(b, kept = new Map());
  const k = `${s.kind}|${towersSig(b)}|${b.battery.map((x) => x.wrecked ? 0 : 1).join('')}`;
  let all = kept.get(k);
  if (!all) {
    all = [];
    const sea = s.sea.bare();
    for (const [g, gate] of b.gates.entries()) {
      const rows = [...Array.from({ length: 5 }, (_, n) => gate.r0 - 1 - n), ...Array.from({ length: 5 }, (_, n) => gate.r1 + 1 + n)];
      for (let c = gate.way - 9; c <= gate.way + 9; c++) for (const r of rows) for (const d of [1, 3]) {
        const pose = { c, r, d };
        if (!sea.fits(pose)) continue;
        for (const side of ['L', 'R'] as Side[]) {
          const t = b.aim(s.id, side, pose, false).find((x) => x.what?.what === 'gun');
          if (t && t.what?.what === 'gun' && b.gunGate[t.what.i] === g && !b.battery[t.what.i].wrecked) all.push({ g, i: t.what.i, pose, side });
        }
      }
    }
    kept.set(k, all);
  }
  return all;
}
/** A gate's berths for her kind, as a place on her chart: its name and its poses. */
export function gatePlace(b: Blockade, s: Ship, g: number): { key: string; poses: () => number[]; berths: Berth[] } {
  const berths = bombardBerths(b, s).filter((x) => x.g === g), rows = s.sea.rows;
  return { key: `gate${g}|${towersSig(b)}`, poses: () => berths.map((x) => (x.pose.c * rows + x.pose.r) * 4 + x.pose.d), berths };
}
