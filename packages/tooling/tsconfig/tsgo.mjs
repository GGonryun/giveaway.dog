#!/usr/bin/env node
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.dirname(require.resolve('typescript/package.json'));
await import(pathToFileURL(path.join(root, 'lib/tsc.js')).href);
