/* The harbour table: one shared betting round for everyone online, on the clock.
   Each round: 20 seconds to bet, then five pieces come off the pile for everyone at once.
   All stakes go into one pot. If more than one hole gets finished, the rarest one takes it, and
   it's paid out poker style (Carp.potPayout): from each pirate you can only win as much as you
   put on that hole. If nobody backed a finished hole, the pot rolls over.
   A few house pirates bet every round, so there's always a pot and someone to beat. */
import '../js/engine.js';
import TABLES from './tables.json';

const C = globalThis.Carp;
export const ROUND_MS = 45000, BET_MS = 20000, FLIP_AT = [21500, 25000, 28500, 32000, 35500], SETTLE_MS = 37000;
export const STAKE_STEP = 5, ROUND_CAP = 20;
// A pirate counts as at the table if their page has asked for the round this recently.
const SEAT_MS = 20000;
const BOTS = ["Cap'n Bones", 'One-Eyed Peg', 'Barnacle Bill'];

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS rounds (
     n INTEGER PRIMARY KEY, tbl INTEGER NOT NULL, draws TEXT NOT NULL, carry INTEGER NOT NULL DEFAULT 0,
     settled INTEGER NOT NULL DEFAULT 0, finished TEXT, pot INTEGER, rollover INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS bets (
     id INTEGER PRIMARY KEY AUTOINCREMENT, n INTEGER NOT NULL, pirate TEXT NOT NULL, name TEXT NOT NULL,
     bot INTEGER NOT NULL DEFAULT 0, hole INTEGER NOT NULL, amt INTEGER NOT NULL, at INTEGER NOT NULL,
     won INTEGER NOT NULL DEFAULT 0, claimed INTEGER NOT NULL DEFAULT 0)`,
  'CREATE INDEX IF NOT EXISTS bets_round ON bets (n)',
  'CREATE INDEX IF NOT EXISTS bets_pirate ON bets (pirate, claimed)',
  'CREATE TABLE IF NOT EXISTS seats (pirate TEXT PRIMARY KEY, name TEXT NOT NULL, seen INTEGER NOT NULL)',
];

const roundOf = (t) => Math.floor(t / ROUND_MS);
const startOf = (n) => n * ROUND_MS;
const rand = (n) => Math.floor(Math.random() * n);

/* The house pirates. Bones backs the likeliest hole, Peg goes on hunches,
   and Bill can't resist a long shot. Their bets show up over the betting window. */
function botBets(holes, n) {
  const byChance = holes.map((h, i) => i).sort((a, b) => holes[b].chance - holes[a].chance);
  const out = [];
  const bet = (name, hole, amt) => out.push({ name, hole, amt, at: startOf(n) + 2000 + rand(BET_MS - 5000) });
  bet("Cap'n Bones", byChance[0], 10);
  if (Math.random() < 0.5) bet("Cap'n Bones", byChance[1], 5);
  const peg = rand(holes.length);
  bet('One-Eyed Peg', peg, 5 + 5 * rand(2));
  if (Math.random() < 0.4) bet('One-Eyed Peg', (peg + 1 + rand(holes.length - 1)) % holes.length, 5);
  if (Math.random() < 0.7) bet('Barnacle Bill', byChance[holes.length - 1], 5);
  return out;
}

// Plays the five pieces into the table, the same way the page does.
function playOut(holes, draws, totals) {
  const order = holes.map((_, i) => i).sort((a, b) => totals[b] - totals[a] || a - b);
  const state = C.tableState(holes);
  draws.forEach((l) => C.tableDraw(holes, state, l, order));
  return { order, finished: state.map((s, i) => (s.done ? i : -1)).filter((i) => i >= 0) };
}

const holeTotals = (holes, bets) => {
  const t = holes.map(() => 0);
  bets.forEach((b) => { t[b.hole] += b.amt; });
  return t;
};

/* The hole that takes the pot: of the finished holes somebody backed, the one least likely
   to get finished. -1 if there isn't one. */
export function potHole(holes, finished, totals) {
  const backed = finished.filter((i) => totals[i] > 0).sort((a, b) => holes[a].chance - holes[b].chance || a - b);
  return backed.length ? backed[0] : -1;
}

async function settle(db, round) {
  if (round.settled || Date.now() < startOf(round.n) + SETTLE_MS) return round;
  const holes = TABLES[round.tbl], draws = JSON.parse(round.draws);
  const { results: bets } = await db.prepare('SELECT id, pirate, hole, amt FROM bets WHERE n = ? ORDER BY id').bind(round.n).all();
  const totals = holeTotals(holes, bets);
  const { finished } = playOut(holes, draws, totals);
  const pot = round.carry + bets.reduce((a, b) => a + b.amt, 0);
  const paid = potHole(holes, finished, totals);
  // What each pirate gets back is written on their first bet of the round.
  const back = C.potPayout(bets.map((b) => ({ who: b.pirate, hole: b.hole, amt: b.amt })), paid, round.carry);
  const first = new Map();
  bets.forEach((b) => { if (!first.has(b.pirate)) first.set(b.pirate, b.id); });
  const stmts = [...back].filter(([, n]) => n).map(([who, n]) => db.prepare('UPDATE bets SET won = ? WHERE id = ?').bind(n, first.get(who)));
  const rollover = paid < 0 ? pot : 0;
  stmts.push(db.prepare('UPDATE rounds SET settled = 1, finished = ?, pot = ?, rollover = ? WHERE n = ? AND settled = 0')
    .bind(JSON.stringify(finished), pot, rollover, round.n));
  await db.batch(stmts);
  return { ...round, settled: 1, finished: JSON.stringify(finished), pot, rollover };
}

// The round for this moment, made on first use. The pot carries over from the last round played.
async function currentRound(db) {
  const n = roundOf(Date.now());
  let round = await db.prepare('SELECT * FROM rounds WHERE n = ?').bind(n).first();
  if (round) return round;
  let prev = await db.prepare('SELECT * FROM rounds WHERE n < ? ORDER BY n DESC LIMIT 1').bind(n).first();
  if (prev) prev = await settle(db, prev);
  C.useSeed(null);
  const tbl = rand(TABLES.length), draws = Array.from({ length: FLIP_AT.length }, () => C.weightedLetter());
  const res = await db.prepare('INSERT INTO rounds (n, tbl, draws, carry) VALUES (?, ?, ?, ?) ON CONFLICT (n) DO NOTHING')
    .bind(n, tbl, JSON.stringify(draws), prev ? prev.rollover : 0).run();
  if (res.meta.changes) {
    const bots = botBets(TABLES[tbl], n);
    await db.batch(bots.map((b) => db.prepare('INSERT INTO bets (n, pirate, name, bot, hole, amt, at) VALUES (?, ?, ?, 1, ?, ?, ?)')
      .bind(n, 'bot:' + b.name, b.name, b.hole, b.amt, b.at)));
  }
  return db.prepare('SELECT * FROM rounds WHERE n = ?').bind(n).first();
}

/* Everything the page needs for the current round. The pieces are only sent once betting
   has closed, so nobody can see them coming. */
export async function roundView(db, me) {
  let round = await currentRound(db);
  const now = Date.now(), start = startOf(round.n), closed = now >= start + BET_MS;
  round = await settle(db, round);
  const holes = TABLES[round.tbl];
  const { results } = await db.prepare('SELECT pirate, name, bot, hole, amt, at, won FROM bets WHERE n = ? AND at <= ? ORDER BY at').bind(round.n, now).all();
  const totals = holeTotals(holes, results);
  // One line per pirate per hole, newest first.
  const lines = new Map();
  results.forEach((b) => {
    const k = b.pirate + '|' + b.hole;
    const cur = lines.get(k) || { name: b.name, bot: !!b.bot, hole: b.hole, amt: 0, at: 0 };
    cur.amt += b.amt; cur.at = Math.max(cur.at, b.at);
    lines.set(k, cur);
  });
  const id = me && /^[A-Za-z]{3,16}$/.test(me) ? me.toLowerCase() : null;
  const mine = holes.map((_, i) => results.filter((b) => b.pirate === id && b.hole === i).reduce((a, b) => a + b.amt, 0));
  // Who's at the table: the house pirates, anyone watching, and anyone with money on this round.
  // A seat is only rewritten every few seconds, to keep database writes down.
  if (id) await db.prepare(`INSERT INTO seats (pirate, name, seen) SELECT id, name, ? FROM pirates WHERE id = ?
      ON CONFLICT (pirate) DO UPDATE SET seen = excluded.seen WHERE excluded.seen > seats.seen + 5000`).bind(now, id).run();
  const { results: seated } = await db.prepare('SELECT pirate, name FROM seats WHERE seen > ? ORDER BY name').bind(now - SEAT_MS).all();
  const crew = new Map();
  seated.forEach((s) => crew.set(s.pirate, { name: s.name, bot: false, staked: 0 }));
  BOTS.forEach((name) => crew.set('bot:' + name, { name, bot: true, staked: 0 }));
  results.forEach((b) => {
    if (!crew.has(b.pirate)) crew.set(b.pirate, { name: b.name, bot: !!b.bot, staked: 0 });
    const c = crew.get(b.pirate); c.staked += b.amt; c.won = (c.won || 0) + b.won;
  });
  const view = {
    n: round.n, now, start, roundMs: ROUND_MS, betMs: BET_MS, flipAt: FLIP_AT, settleMs: SETTLE_MS,
    stakeStep: STAKE_STEP, cap: ROUND_CAP,
    holes: holes.map((h) => ({ cells: h.cells, gap: h.gap, first: h.first, name: h.name, useful: h.useful, chance: h.chance })),
    carry: round.carry, pot: round.carry + totals.reduce((a, b) => a + b, 0), totals, mine,
    bets: [...lines.values()].sort((a, b) => b.at - a.at).map(({ at, ...b }) => b),
    crew: [...crew.values()].map((c) => (round.settled ? { ...c, won: c.won || 0 } : { name: c.name, bot: c.bot, staked: c.staked })),
  };
  if (closed) {
    view.draws = JSON.parse(round.draws);
    view.order = playOut(holes, view.draws, totals).order;
  }
  if (round.settled) {
    const finished = JSON.parse(round.finished);
    view.result = { finished, pot: round.pot, rollover: round.rollover, hole: potHole(holes, finished, totals) };
  }
  return view;
}

export async function placeBet(db, pirate, body) {
  const now = Date.now(), n = roundOf(now);
  if (Number(body.n) !== n || now >= startOf(n) + BET_MS) return { status: 409, body: { error: 'closed', message: 'Betting has closed for this round.' } };
  const round = await currentRound(db);
  const hole = Number(body.hole), amt = Number(body.amt);
  if (!(hole >= 0 && hole < TABLES[round.tbl].length) || amt !== STAKE_STEP) return { status: 400, body: { error: 'bet' } };
  const { staked } = await db.prepare('SELECT COALESCE(SUM(amt), 0) AS staked FROM bets WHERE n = ? AND pirate = ?').bind(n, pirate.id).first();
  if (staked + amt > ROUND_CAP) return { status: 409, body: { error: 'cap', message: `The most you can stake in a round is ${ROUND_CAP}.` } };
  await db.prepare('INSERT INTO bets (n, pirate, name, hole, amt, at) VALUES (?, ?, ?, ?, ?, ?)').bind(n, pirate.id, pirate.name, hole, amt, now).run();
  return { status: 200, body: { staked: staked + amt } };
}

/* Pays out every finished round the pirate had money in and hasn't collected yet.
   Marking bets collected and reading their winnings is one statement, so nothing pays twice. */
export async function claim(db, pirate) {
  const { results: open } = await db.prepare('SELECT DISTINCT n FROM bets WHERE pirate = ? AND claimed = 0').bind(pirate.id).all();
  for (const { n } of open) {
    const round = await db.prepare('SELECT * FROM rounds WHERE n = ?').bind(n).first();
    if (round) await settle(db, round);
  }
  const { results } = await db.prepare(`UPDATE bets SET claimed = 1 WHERE pirate = ? AND claimed = 0
      AND n IN (SELECT n FROM rounds WHERE settled = 1) RETURNING n, amt, won`).bind(pirate.id).all();
  const won = results.reduce((a, b) => a + b.won, 0);
  if (won) await db.prepare('UPDATE pirates SET dubs = dubs + ?, best = MAX(best, dubs + ?) WHERE id = ?').bind(won, won, pirate.id).run();
  const rounds = {};
  results.forEach((b) => { const r = rounds[b.n] ||= { n: b.n, staked: 0, won: 0 }; r.staked += b.amt; r.won += b.won; });
  return { won, rounds: Object.values(rounds) };
}
