# Carpentry Primer

A static, game-like tutorial for the Puzzle Pirates carpentry puzzle. It isn't a remake of the puzzle. It teaches the decisions: where each piece goes, which ten-square finish to steer towards, and which piece to hold on to.

## Modes

- **The voyage**: a trail of five ports. It starts at the very end of a hole (ten squares, two pieces), and each port moves the start further out. Holes are grown outward from a good two-piece finish. On some ports a dashed outline shows that finish, so you learn to work from the outside in to reach it. From Tarpot Reef on you hold two pieces, and the one you don't play stays for later. Every hole ends with three draws for the last piece and a doubloon bet.
- **Hole of the Day**: one 20-square hole, the same for everyone that day (seeded from the date), with a shareable result grid.
- **Harbour table** (online only): everyone bets on the same round every 45 seconds, and the pot goes to whoever backed the finished holes.
- **Harbour games**: *Practice bets* (four holes share five pieces off one pile, drawn one at a time; bet between pieces as the prices move), plus *Which pair fits?* and *Which gap?* quick-fire quizzes.
- **Workshop**: the timber guide, the named two-piece holes (Top-Notch, Dogleg, Dome…), and a hole lab that solves any hole you draw.

## Running it

There's no build step. Open `index.html`, or serve the folder:

```bash
python -m http.server 8642
```

Any static host works: GitHub Pages, Netlify or Cloudflare Pages, with no build command and the repo root as the folder. On a plain static host the leaderboard just stays hidden.

### The leaderboard

The leaderboard needs the Cloudflare Worker in `worker/` and a D1 database (see `wrangler.toml`). The Worker serves the site and a small API: `GET /api/board`, `POST /api/pirates` (pick a name) and `POST /api/purse`. The harbour table adds `GET /api/harbour`, `POST /api/harbour/bet` and `POST /api/harbour/claim` (`worker/harbour.js`). Its tables come from a pre-built bank, `worker/tables.json`, made by `node tools/make-tables.js`, because building a balanced table is too slow for a free Worker request. `.assetsignore` keeps the Worker code and notes out of the public site. The table is created on first use.

To run it locally (wrangler 4 needs Node 20 or newer):

```bash
npx wrangler dev --local
```

## Code

- `js/engine.js`: the pentomino shapes, draw weights, an exact-cover solver, hole generation and placement scoring
- `js/render.js`: SVG boards and pieces
- `js/app.js`: routing, the voyage, Hole of the Day, the quizzes and the workshop
- `js/social.js`: pirate names and the leaderboard panel
- `src/*.ts`: TypeScript parts of the Pirate Den (the fair deal; Swordfight and its soldiers), compiled into `js/` with `npm run build`; tests in `tests/` with Vitest (`npm test`)
- `worker/index.js`: the leaderboard server (Cloudflare Worker + D1)

Puzzle facts and design rules agreed in playtests live in [RULES.md](RULES.md).

One purse of doubloons runs across the whole site: Masterpieces and right answers earn them, bets (always priced slightly against you) spend them. Progress is stored in each player's own browser (`localStorage`).

Rules, draw weights and the two-piece hole names come from YPPedia's [Carpentry](https://yppedia.puzzlepirates.com/Carpentry) page and Hawkings' [Carpentry tutorial](https://yppedia.puzzlepirates.com/Carpentry_tutorial).
