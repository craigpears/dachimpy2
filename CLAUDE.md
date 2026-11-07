# Carpentry primer

Static site, no build step: `index.html`, `js/engine.js` (pieces, solver, scoring), `js/render.js` (SVG), `js/app.js` (pages).
Preview with `python -m http.server 8642`.
Leaderboard: `js/social.js` (client) and `worker/index.js` (Cloudflare Worker + D1). To test it locally, run
`npx wrangler dev --local` (port 8787). Wrangler 4 needs Node 20+; this machine has Node 18, so use the local
copy: `node_modules/node/bin/node.exe node_modules/wrangler/bin/wrangler.js dev --local` (install with
`npm i --no-save --no-package-lock node@22 wrangler@4`; node_modules is ignored). Wrangler 3 on Windows serves no
files from subfolders, so don't use it.

Read [RULES.md](RULES.md) before changing gameplay or wording, and add to it whenever the user corrects a rule or gives design feedback.

Pirate Den notes: [TODO.md](TODO.md) holds the fixes and quality-of-life changes the user has asked for
(agreed; just do them), and [IDEAS.md](IDEAS.md) holds their unrefined ideas for new puzzles and features.
Keep the two apart: when the user mentions a fix or tweak, add it to TODO.md; when they brain-dump a new idea,
add it to IDEAS.md.
