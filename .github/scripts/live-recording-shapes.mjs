import fs from 'node:fs';
import path from 'node:path';

const [directory] = process.argv.slice(2);
if (!directory) {
  console.error('Usage: node live-recording-shapes.mjs <recordings folder>');
  process.exit(1);
}

const typeOf = (value) => {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
};

const collect = (value, at, shapes) => {
  const types = shapes.get(at) ?? new Set();
  types.add(typeOf(value));
  shapes.set(at, types);
  if (Array.isArray(value)) {
    for (const item of value) {
      collect(item, `${at}[]`, shapes);
    }
  } else if (value !== null && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      collect(entry, `${at}.${key}`, shapes);
    }
  }
  return shapes;
};

const describeShape = (value) =>
  [...collect(value, '$', new Map())].map(
    ([at, types]) => `${at}: ${[...types].sort().join(' | ')}`
  );

if (!fs.existsSync(directory)) {
  console.log('No recordings.');
  process.exit(0);
}

for (const file of fs.readdirSync(directory).sort()) {
  if (!file.endsWith('.json')) {
    continue;
  }
  const body = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'));
  console.log(`## ${file}`);
  for (const line of describeShape(body)) {
    console.log(line);
  }
  console.log('');
}
