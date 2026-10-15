import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Publish the built site at the REPOSITORY root, for Catalyst Slate.
 *
 * Slate deploys `main` as a static site with the repository root as the web
 * root, and this app lives one folder down — so without this the root has no
 * `index.html` and Slate answers 404. The entry page and everything beside it
 * in `client/` are copied up to where Slate serves from. Vite's asset URLs are
 * absolute (`/assets/...`), which is exactly what a root-level `assets/` meets.
 *
 * Run via `npm run build:slate`, which builds `client/` first.
 */

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const client = path.join(app, 'client');
const repo = path.resolve(app, '..');

if (!existsSync(path.join(client, 'index.html'))) {
  console.error('✗ client/index.html is missing — run `npm run build:catalyst` first.');
  process.exit(1);
}

//  Catalyst's manifest stays in client/; Slate does not read it.
const entries = readdirSync(client).filter((name) => name !== 'client-package.json');

//  Every entry is removed at the root and copied fresh — a wholesale replace,
//  for the reason build-catalyst.mjs gives: asset names are content-hashed, so
//  copying over the top would keep every old build's chunks. Because this
//  DELETES at the repo root, refuse anything that is not plainly build output.
const PROTECTED = new Set([path.basename(app), '.git', '.gitignore', '.storybook', 'README.md']);
const clash = entries.filter((name) => PROTECTED.has(name) || name.startsWith('.'));
if (clash.length) {
  console.error(`✗ refusing to overwrite ${clash.join(', ')} at the repository root.`);
  process.exit(1);
}

for (const name of entries) {
  rmSync(path.join(repo, name), { recursive: true, force: true });
  cpSync(path.join(client, name), path.join(repo, name), { recursive: true });
}

console.log(`✓ published at the repository root for Slate: ${entries.join(', ')}`);
