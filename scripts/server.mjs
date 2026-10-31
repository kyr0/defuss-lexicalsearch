import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
  '.gz': 'application/gzip', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
};

/**
 * Serves the website (docs/) at /, the examples at /examples/ and a build directory at /dist/; e2e maps /dist/ to the
 * installed package. Like GitHub Pages, it sends .gz files as stored, without Content-Encoding.
 * VERIFIED: repository files such as /package.json and /.git/config return 404 (asserted in scripts/browser.mjs).
 */
export async function serve({ port = 0, dist = resolve(root, 'dist') } = {}) {
  const bases = { '/dist/': dist, '/examples/': resolve(root, 'examples'), '/': resolve(root, 'docs') };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const prefix = Object.keys(bases).find(p => pathname.startsWith(p));
      const base = bases[prefix];
      const path = resolve(base, pathname.slice(prefix.length) + (pathname.endsWith('/') ? 'index.html' : ''));
      if (!path.startsWith(base + sep)) { response.writeHead(403).end(); return; }
      const content = await readFile(path);
      response.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
      response.end(content);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { url } = await serve({ port: Number(process.env.PORT || 8080) }); console.log(url);
}
