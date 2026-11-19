import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

export function serve(directory) {
  const root = path.resolve(directory);
  return createServer(async (request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method ?? '')) { response.writeHead(405).end(); return; }
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const target = path.resolve(root, '.' + pathname);
      const relative = path.relative(root, target);
      if (relative.startsWith('..') || path.isAbsolute(relative)) { response.writeHead(403).end(); return; }
      const file = (await stat(target)).isDirectory() ? path.join(target, 'index.html') : target;
      const body = await readFile(file);
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
      const status = error instanceof URIError ? 400 : ['ENOENT', 'ENOTDIR'].includes(error.code) ? 404 : 500;
      response.writeHead(status).end();
    }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  serve('out').listen(port, '127.0.0.1', () => console.log('http://127.0.0.1:' + port));
}
