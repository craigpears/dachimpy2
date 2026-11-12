// The course editor's balance check (race-editor.html, 12 Nov), in a Web Worker so the page keeps going:
// the course in this worker's own link (?course=, read as the race's modules load: src/race-course.ts) raced
// by the simulation's bots (src/race-sim.ts), a batch of races at a time, and summed up as the chart does
// (src/race-editor.ts, balanceOf): each way round's wins, and what each shortcut saves.
import { run, CUTS, SIM } from './race-sim.js';
import { balanceOf, mergeReports } from './race-editor.js';

const saves = Object.fromEntries(Object.entries(CUTS).map(([id, c]) => [id, c.saves]));

onmessage = (e) => {
  const { races = 300, size = 4, batch = 25 } = e.data || {};
  let rep = null;
  for (let k = 0; k < races; k += batch) {
    const n = Math.min(batch, races - k), part = run(n, size, { seed: 1 + k });
    rep = rep ? mergeReports(rep, part) : part;
    postMessage({ done: k + n, races });
  }
  postMessage({ done: races, races, balance: balanceOf(rep, SIM.LONG, saves) });
};
