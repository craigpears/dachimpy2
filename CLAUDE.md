# Carpentry primer

Static site, no build step: `index.html`, `js/engine.js` (pieces, solver, scoring), `js/render.js` (SVG), `js/app.js` (pages).
Preview with `python -m http.server 8642`.
Leaderboard: `js/social.js` (client) and `worker/index.js` (Cloudflare Worker + D1). To test it locally, run
`npx wrangler dev --local` (port 8787). Wrangler 4 needs Node 20+; this machine has Node 18, so use the local
copy: `node_modules/node/bin/node.exe node_modules/wrangler/bin/wrangler.js dev --local` (install with
`npm i --no-save --no-package-lock node@22 wrangler@4`; node_modules is ignored). Wrangler 3 on Windows serves no
files from subfolders, so don't use it.

Pirate Den: `den.html`, `js/den.js` (start-up, input, the main loop and camera, `window.den`), `js/den-look.js`
(looks: the wardrobe, and the real pirates, `PIRATES`, as plain looks from it), and the 3D in plain hand-written modules in `js/den/`: `world.js` (what every part shares: scene, camera,
materials, game state, toast; a `let` another file reassigns goes through its owner's `...Lets` getter/setter object),
`land.js`, `wall.js`, `pieces.js` (crates, toolbox, Carpentry view), `gundeck.js` (the gun tower, and Gunnery's look on any board), `raids.js`, `sword.js`, `bilge.js`,
`map.js`, `cine.js` (little cutscenes: the one playing, its camera and skip, speech bubbles; Dalnoth's and Dignity's use it), `dignity.js` (Dignity on the checkpoint's gate, her cutscene and lines, Bella), `sea.js` (the sea and sloop's 3D), `sailing.js` (boarding, helm, guns, the sea tick), `wind.js`, `rowing.js` (rowing her: the boards, her rowers, the camera) and `row-boards.js` (the rowing boards' look and the compass), `treasure.js` (Treasure Haul's board), `foraging.js` (Foraging's look on any board, a container's skin passed in: a crate, or the capybara; played on its own in the unlinked `foraging-test.html`), `sea-guns.js` (Gunnery on her deck: loading her guns), `turret.js` (a destructible gun at sea), `checkpoint.js` (the imperial checkpoint), `lock.js` (a lock on the canal: chamber, gates, quay pump and its Bilge board; each lock an instance), `sea-puzzles.js`
(deck patch), `crew.js`, `menus.js`. New features get a file of their own there where they can, so
work in parallel rarely touches the same file. Parts pulled out of den.js are
TypeScript in `src/`: `den-deal.ts` (the fair deal), `swordfight.ts` (the Swordfight puzzle, knowing nothing of
the den), `den-sword.ts` (the armoury hoist, the soldiers and the wall repairs, as plain data), `den-sword-draw.ts`
(what's painted on Swordfight's crates), `bilge.ts` (the Bilge puzzle, knowing nothing of the den),
`den-bilge.ts` (the tide, the rocks and the powder barrels), `den-carp-view.ts` (the Carpentry view's keys and jumps); `den-raids.ts` (when the raids come: the opening siege, then calm); `den-map.ts` (the captain's map: when it's dropped, who can pick it up, what it shows); `den-wall.ts` (the wall's holes, in two courses); `den-sail.ts` (the sloop's sea, the helm, the pilot); `den-lock.ts` (a lock: its water, pumping, draining, its gates); `den-checkpoint.ts` (the imperial checkpoint and its guns); `den-dignity.ts` (its commander: her lines, when, and her cutscene's beats); `den-turret.ts` (a destructible gun at sea, to plug in anywhere); `gunnery.ts` (the Gunnery puzzle, knowing nothing of the den: the gun tower and her deck both play it) and `den-guns.ts` (her guns, loaded by it); `den-wind.ts` (the wind); `den-patch.ts` (patching her deck); `treasure-haul.ts` (the Treasure Haul puzzle) and `den-haul.ts` (hauling a chest up); `foraging.ts` (the Foraging puzzle, knowing nothing of the den: dealt straight, or with one container stuck on it); `mirror-row.ts` (mirror strokes, the rowing puzzle, knowing nothing of the den; its bots in `tools/row-bots.mjs`), `rowing.ts` (what a clear pulls, and the first split board) and `den-row.ts` (her oars at sea); `engine.d.ts` types the engine. den.js keeps only the 3D and the wiring; new features follow the same
split: rules and decisions in a tested TypeScript part, den.js drawing them. Compiled into `js/` by
`npm run build`; the compiled `js/*.js` is committed, since the site deploys the files as they are. Never edit a
compiled file by hand. Relative imports in `src/` need the `.js` ending (`'./swordfight.js'`): the browser loads
them as they are (a test checks). Tests: Vitest, `tests/*.test.ts` (`npm test`, or `npm run test:watch`;
`npm run check` type-checks them). `tests/build.test.ts` fails if `js/` is out of date with `src/`. Tests, `src/`
and configs aren't published (`.assetsignore`). When the user describes something going wrong in a part that has
tests, add a test for it, named after what they saw, with the date.

Modular, no technical debt (the user, 10 Nov: "we need to make sure I'm not creating spaghetti or just mess"):
- Each puzzle (Carpentry, Gunnery, Bilge, Swordfight, Treasure Haul, rowing...) is one module with one
  implementation of its rules, knowing nothing of where it's played, used everywhere it's played. Gunnery on the
  gun tower and on the sloop, Carpentry on the wall, her deck and the crane, are the same puzzle code with thin
  wrappers for what's drawn round them, never a copy per place. When a puzzle still in a js/den file is needed
  somewhere new, move its rules into a TypeScript module in `src/` (like `bilge.ts`) first, then share it.
- The same goes for the world's objects and scenes (a lock, a gun, a crane, a ship, a place on the sea): each a
  module of its own that can be reused, not code smeared across files. Introduce this gradually as the world grows:
  when a change would copy code or tangle two parts together, pull the shared part out first.

Read [STORY.md](STORY.md) for the den's story, its progression and the principles behind them, and keep it
up to date as the story grows. Read [RULES.md](RULES.md) before changing gameplay or wording, and add to it whenever the user corrects a rule or gives design feedback.

Pirate Den notes: [TODO.md](TODO.md) holds the fixes and quality-of-life changes the user has asked for
(agreed; just do them), and [IDEAS.md](IDEAS.md) holds their unrefined ideas for new puzzles and features.
Keep the two apart: when the user mentions a fix or tweak, add it to TODO.md; when they brain-dump a new idea,
add it to IDEAS.md.

Keeping context lean: the den is big, so hand off work that would flood the main session to subagents with a
self-contained brief (what to read, what done looks like, what to report back, in a few hundred words). In
particular, browser checks (screenshots are costly) go to a subagent that checks, fixes what is plainly off,
runs the build and tests, and leaves changes uncommitted; the main session reviews the diff, commits and pushes.
Small edits, notes files and anything a few tool calls settle stay in the main session, where the context is.
When a feature has independent parts, give each to its own subagent; when they touch the same files, do them in turn.
