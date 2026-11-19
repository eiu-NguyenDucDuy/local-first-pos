import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function buildOffline(directory) {
  const template = await readFile(new URL('./worker-template.js', import.meta.url), 'utf8');
  const assets = [];
  async function visit(subdir) {
    for (const entry of await readdir(path.join(directory, subdir), { withFileTypes: true })) {
      const relative = path.posix.join(subdir, entry.name);
      if (entry.isDirectory()) await visit(relative);
      else if (entry.isFile() && relative !== 'sw.js' && !relative.endsWith('.map')) assets.push(relative);
    }
  }
  await visit('');
  for (const page of ['index.html', 'admin/index.html']) {
    if (!assets.includes(page)) throw new Error('Missing exported page: ' + page);
  }
  const hash = createHash('sha256').update(template);
  assets.sort();
  for (const asset of assets) {
    hash.update(asset).update('\0').update(await readFile(path.join(directory, asset)));
  }
  const version = hash.digest('hex').slice(0, 24);
  const urls = assets.map(asset => '/' + asset.split('/').map(encodeURIComponent).join('/'));
  const script = template.replace("/*__CACHE__*/ ''", JSON.stringify('family-grocery-pos-' + version))
    .replace('/*__ASSETS__*/ []', JSON.stringify(urls));
  await writeFile(path.join(directory, 'sw.js'), script);
  return { version, assets: urls };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildOffline(path.resolve('out'));
  console.log('Prepared', result.assets.length, 'offline assets for', result.version);
}
