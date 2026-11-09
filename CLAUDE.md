# Carpentry primer

Static site, no build step: `index.html`, `js/engine.js` (pieces, solver, scoring), `js/render.js` (SVG), `js/app.js` (pages).
Preview with `python -m http.server 8642`.
Leaderboard: `js/social.js` (client) and `worker/index.js` (Cloudflare Worker + D1). To test it locally, run
`npx wrangler dev --local` (port 8787). Wrangler 4 needs Node 20+; this machine has Node 18, so use the local
copy: `node_modules/node/bin/node.exe node_modules/wrangler/bin/wrangler.js dev --local` (install with
`npm i --no-save --no-package-lock node@22 wrangler@4`; node_modules is ignored). Wrangler 3 on Windows serves no
files from subfolders, so don't use it.

Pirate Den: `den.html`, `js/den.js` (the game), `js/den-look.js` (looks). Parts pulled out of den.js are
TypeScript in `src/`: `den-deal.ts` (the fair deal), `swordfight.ts` (the Swordfight puzzle, knowing nothing of
the den), `den-sword.ts` (the armoury hoist, the soldiers and the wall repairs, as plain data), `den-sword-draw.ts`
(what's painted on Swordfight's crates), `bilge.ts` (the Bilge puzzle, knowing nothing of the den),
`den-bilge.ts` (the tide, the rocks and the powder barrels), `den-carp-view.ts` (the Carpentry view's keys and jumps); `den-raids.ts` (when the raids come: the opening siege, then calm); `den-map.ts` (the captain's map: when it's dropped, who can pick it up, what it shows); `den-wall.ts` (the wall's holes, in two courses); `engine.d.ts` types the engine. den.js keeps only the 3D and the wiring; new features follow the same
split: rules and decisions in a tested TypeScript part, den.js drawing them. Compiled into `js/` by
`npm run build`; the compiled `js/*.js` is committed, since the site deploys the files as they are. Never edit a
compiled file by hand. Relative imports in `src/` need the `.js` ending (`'./swordfight.js'`): the browser loads
them as they are (a test checks). Tests: Vitest, `tests/*.test.ts` (`npm test`, or `npm run test:watch`;
`npm run check` type-checks them). `tests/build.test.ts` fails if `js/` is out of date with `src/`. Tests, `src/`
and configs aren't published (`.assetsignore`). When the user describes something going wrong in a part that has
tests, add a test for it, named after what they saw, with the date.

Read [STORY.md](STORY.md) for the den's story, its progression and the principles behind them, and keep it
up to date as the story grows. Read [RULES.md](RULES.md) before changing gameplay or wording, and add to it whenever the user corrects a rule or gives design feedback.

Pirate Den notes: [TODO.md](TODO.md) holds the fixes and quality-of-life changes the user has asked for
(agreed; just do them), and [IDEAS.md](IDEAS.md) holds their unrefined ideas for new puzzles and features.
Keep the two apart: when the user mentions a fix or tweak, add it to TODO.md; when they brain-dump a new idea,
add it to IDEAS.md.
