import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readdir, rename, rm, stat, utimes } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';

const [directory, port] = process.argv.slice(2);
const maxAge = 7 * 24 * 60 * 60 * 1000;

await mkdir(directory, { recursive: true });

for (const name of await readdir(directory)) {
  const path = join(directory, name);
  const { mtimeMs } = await stat(path);
  if (name.endsWith('.tmp') || Date.now() - mtimeMs > maxAge) {
    await rm(path, { force: true });
  }
}

const server = createServer(async (request, response) => {
  const match = /^\/v1\/cache\/([A-Za-z0-9]+)$/.exec(request.url ?? '');
  if (!match) {
    response.writeHead(404).end();
    return;
  }
  const path = join(directory, match[1]);
  try {
    if (request.method === 'GET') {
      const { size } = await stat(path);
      const now = new Date();
      await utimes(path, now, now);
      response.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': size
      });
      await pipeline(createReadStream(path), response);
    } else if (request.method === 'PUT') {
      const exists = await stat(path).then(
        () => true,
        () => false
      );
      if (exists) {
        request.resume();
        response.writeHead(409).end();
        return;
      }
      const temporary = `${path}.${process.pid}.tmp`;
      await pipeline(request, createWriteStream(temporary));
      await rename(temporary, path);
      response.writeHead(200).end();
    } else {
      response.writeHead(405).end();
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      response.writeHead(404).end();
    } else {
      console.error(error);
      if (!response.headersSent) response.writeHead(500);
      response.end();
    }
  }
});

server.listen(Number(port), '127.0.0.1', () => {
  console.log(`Listening on port ${port}, cache in ${directory}`);
});
