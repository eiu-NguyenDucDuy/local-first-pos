import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { buildOffline } from '../scripts/build-offline.mjs';

async function fixture(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'pos-cache-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'admin'));
  await writeFile(path.join(dir, 'index.html'), 'home');
  await writeFile(path.join(dir, 'admin/index.html'), 'admin');
  await writeFile(path.join(dir, 'app.js'), 'one');
  return dir;
}
test('the manifest covers both routes and changes with asset content', async t => {
  const dir = await fixture(t);
  const a = await buildOffline(dir);
  assert.deepEqual(a.assets, ['/admin/index.html', '/app.js', '/index.html']);
  assert.deepEqual(a, await buildOffline(dir));
  await writeFile(path.join(dir, 'app.js'), 'two');
  assert.notEqual((await buildOffline(dir)).version, a.version);
});
test('an incomplete production export cannot generate a new worker', async t => {
  const dir = await fixture(t);
  await rm(path.join(dir, 'admin/index.html'));
  await assert.rejects(buildOffline(dir), /Missing exported page/);
});
test('installed worker routes both pages offline and retains other apps’ caches', async t => {
  const dir = await fixture(t);
  const built = await buildOffline(dir);
  const handlers = new Map(), removed = [];
  const cached = new Set();
  let claimed = false;
  const self = { location: { origin: 'http://localhost' }, clients: { claim() { claimed = true; } },
    addEventListener(type, fn) { handlers.set(type, fn); } };
  const cache = { async addAll(urls) { urls.forEach(u => cached.add(u)); }, async match(u) { return cached.has(u) ? u : undefined; } };
  const caches = { async open() { return cache; }, async keys() { return ['other-app','family-grocery-pos-old','family-grocery-pos-' + built.version]; },
    async delete(key) { removed.push(key); } };
  vm.runInNewContext(await readFile(path.join(dir, 'sw.js'), 'utf8'), { self, caches, URL, fetch() { throw Error('offline'); } });
  for (const type of ['install', 'activate']) {
    let wait;
    handlers.get(type)({ waitUntil(p) { wait = p; } }); await wait;
  }
  assert.equal(claimed, true); assert.deepEqual(removed, ['family-grocery-pos-old']);
  for (const [pathname, expected] of [['/', '/index.html'], ['/admin', '/admin/index.html'], ['/admin/', '/admin/index.html'], ['/unknown', undefined]]) {
    let result;
    handlers.get('fetch')({ request: { method:'GET', url:'http://localhost' + pathname, mode:'navigate' }, respondWith(p) { result = p; } });
    assert.equal(await result, expected);
  }
});
