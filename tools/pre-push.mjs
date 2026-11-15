// Git's pre-push hook (tools/hooks/pre-push; installed with `npm run hooks`): a push to main that changes the
// site itself (js/, css/, a page in the root) runs the smoke tests first (tools/smoke.mjs) and is stopped if any
// page fails. A push of only cards, notes or docs goes straight through (the user, 15 Nov: "maybe doesn't need
// to be every time but at least occasionally?"). `git push --no-verify` pushes anyway.
//
// Git hands the hook a line per ref pushed on stdin: <local ref> <local sha> <remote ref> <remote sha>.

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';

const ZERO = /^0+$/;
const SITE = [/^js\//, /^css\//, /^[^/]+\.html$/];

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

// What a push of `local` over `remote` changes: null when it can't tell (a new branch, or a remote commit not
// fetched here), which counts as the site changing.
function changed(local, remote) {
  try {
    const base = ZERO.test(remote) ? git('merge-base', local, 'origin/main') : remote;
    return git('diff', '--name-only', base, local).split('\n').filter(Boolean);
  } catch {
    return null;
  }
}

const lines = fs.readFileSync(0, 'utf8').split('\n').map((l) => l.trim().split(/\s+/)).filter((l) => l.length === 4);
const toMain = lines.filter(([, local, remote]) => remote === 'refs/heads/main' && !ZERO.test(local));
const site = toMain.some(([, local, , remoteSha]) => {
  const files = changed(local, remoteSha);
  return files === null || files.some((f) => SITE.some((re) => re.test(f)));
});
if (!site) process.exit(0);

console.log('pre-push: the site changed, so the smoke tests run first (npm run smoke, about a minute and a half)');
const run = spawnSync(process.execPath, ['tools/smoke.mjs'], { stdio: 'inherit' });
if (run.status !== 0) {
  console.error('\npre-push: push stopped, a page failed its smoke test (git push --no-verify to push anyway)');
  process.exit(1);
}
