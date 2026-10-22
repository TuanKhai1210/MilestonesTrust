import { copyFile, mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'docs');
const output = path.join(root, 'out-pages');
const files = ['index.html', 'site.css', 'site.js', 'mark.svg', 'tide-simulation.png'];
const html = await readFile(path.join(source, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML IDs');
assert.match(html, /<html lang="en">/, 'Expected document language');
assert.match(html, /name="viewport"/, 'Missing viewport metadata');
for (const [, reference] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  if (/^(?:https?:|mailto:)/.test(reference)) continue;
  if (reference.startsWith('#')) {
    assert.ok(ids.includes(reference.slice(1)), `Missing anchor: ${reference}`);
    continue;
  }
  assert.ok(!reference.startsWith('/'), `Use relative asset URLs: ${reference}`);
  const local = reference.replace(/^\.\//, '').split(/[?#]/)[0];
  if (!local) continue;
  assert.ok(files.includes(local), `Asset not in public allowlist: ${local}`);
  assert.ok((await stat(path.join(source, local))).isFile(), `Missing asset: ${local}`);
}
new Script(await readFile(path.join(source, 'site.js'), 'utf8'), { filename: 'site.js' });
await mkdir(output, { recursive: true });
// Refuse unexpected output rather than silently publishing extra files.
for (const entry of await readdir(output)) {
  assert.ok([...files, '.nojekyll'].includes(entry), `Unexpected public output: ${entry}`);
}
for (const file of files) await copyFile(path.join(source, file), path.join(output, file));
await copyFile(path.join(source, '.nojekyll'), path.join(output, '.nojekyll'));
console.log(`Validated links, anchors and JavaScript. Packaged ${files.length + 1} public files into out-pages/.`);
