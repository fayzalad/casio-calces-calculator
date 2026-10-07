// Publishes dist/ to the gh-pages branch (GitHub Pages "Deploy from a branch").
// Usage: npm run deploy   (builds first, then force-pushes a one-commit gh-pages branch)
import { execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });
const out = cmd => execSync(cmd, { encoding: 'utf8' }).trim();

const remote = out('git remote get-url origin');
const sha = out('git rev-parse --short HEAD');

run('npm run build');

const tmp = mkdtempSync(join(tmpdir(), 'gh-pages-'));
try {
  cpSync('dist', tmp, { recursive: true });
  writeFileSync(join(tmp, '.nojekyll'), '');
  run('git init -q -b gh-pages', tmp);
  run('git add -A', tmp);
  run(`git -c user.name="deploy" -c user.email="deploy@users.noreply.github.com" commit -q -m "Deploy ${sha}"`, tmp);
  run(`git push -f "${remote}" gh-pages`, tmp);
  console.log(`\nDeployed ${sha} to the gh-pages branch.`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
