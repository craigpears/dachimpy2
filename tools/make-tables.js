/* Builds worker/tables.json: a bank of balanced betting tables for the shared harbour table.
   Generating a table runs thousands of simulated draws, too slow for a free Worker request,
   so the server picks from this bank instead. Run with: node tools/make-tables.js [count] */
require('../js/engine.js');
const C = globalThis.Carp;
const fs = require('fs');
const COUNT = Number(process.argv[2]) || 240, DRAWS = 5;

C.useSeed(20261106);
const tables = [];
const t0 = Date.now();
while (tables.length < COUNT) {
  const holes = C.genBetTable(DRAWS);
  const chances = C.tableChances(holes, DRAWS, 6000);
  tables.push(holes.map((h, i) => ({
    cells: h.cells, gap: h.gap || undefined, first: h.first, name: h.name || undefined,
    useful: h.useful, chance: Math.round(chances[i] * 1000) / 1000,
  })));
}
fs.writeFileSync(require('path').join(__dirname, '../worker/tables.json'), JSON.stringify(tables));
console.log(`${tables.length} tables in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
