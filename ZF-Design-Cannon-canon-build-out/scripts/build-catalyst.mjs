import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Package the Vite build for Catalyst Web Client Hosting.
 *
 * Catalyst serves a directory — conventionally `client/` — that must contain a
 * `client-package.json` beside the static files. Vite cannot emit that folder
 * directly: `emptyOutDir` wipes the target before writing, which would delete
 * the manifest on every build. So the build stays in `dist/` and this copies it
 * across afterwards, regenerating the manifest each time.
 *
 * Run via `npm run build:catalyst`, never on its own — it copies whatever is in
 * `dist/`, so without a fresh build it will happily ship a stale one.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const client = path.join(root, 'client');

if (!existsSync(path.join(dist, 'index.html'))) {
  console.error('✗ dist/index.html is missing — run `npm run build` first.');
  process.exit(1);
}

//  Wholesale replace. Vite's asset filenames are content-hashed, so copying
//  over the top would accumulate every past build's orphaned chunks — the
//  folder grows without bound and Catalyst uploads all of it.
rmSync(client, { recursive: true, force: true });
mkdirSync(client, { recursive: true });

/*  MARKDOWN DOES NOT SHIP.
    Vite copies `public/` verbatim, and `public/README.md` is a developer note —
    it names open items, internal file layout and unsettled design decisions.
    Served at the site root it is a public document. This repo is private
    specifically so that material is not published, and copying it into a hosted
    bundle would undo that by a different route.  */
cpSync(dist, client, {
  recursive: true,
  filter: (src) => !src.toLowerCase().endsWith('.md'),
});

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
writeFileSync(
  path.join(client, 'client-package.json'),
  //  `homepage` is the entry Catalyst serves at the domain root. The app is a
  //  single page — `Books.tsx` switches screens from state, not from a URL — so
  //  there are no deep links to rewrite and no router fallback to configure.
  //  That stops being true the moment a real router lands; see the note in the
  //  README section this script's PR adds.
  `${JSON.stringify({ name: pkg.name, version: pkg.version, homepage: 'index.html' }, null, 2)}\n`,
);

const files = [];
const walk = (dir, base = '') => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(base, e.name);
    if (e.isDirectory()) walk(path.join(dir, e.name), rel);
    else files.push(rel);
  }
};
walk(client);
console.log(`✓ client/ — ${files.length} files`);
for (const f of files.sort()) console.log(`    ${f}`);
