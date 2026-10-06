export type LineRange = { start: number; end: number };

export type AddedLine = { file: string; line: number; text: string };

const FILE_HEADER = /^\+\+\+ (?:b\/)?(.+)/;

const HUNK_HEADER = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/;

export const parseChangedLines = (diff: string): Map<string, LineRange[]> => {
  const changed = new Map<string, LineRange[]>();
  let file = '';

  for (const line of diff.split('\n')) {
    const header = FILE_HEADER.exec(line);
    if (header) {
      file = header[1];
      continue;
    }

    const hunk = HUNK_HEADER.exec(line);
    if (!hunk || !file) {
      continue;
    }

    const start = Number(hunk[1]);
    const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
    if (count === 0) {
      continue;
    }

    const ranges = changed.get(file) ?? [];
    ranges.push({ start, end: start + count - 1 });
    changed.set(file, ranges);
  }

  return changed;
};

export const isInRanges = (
  line: number,
  ranges: LineRange[] | undefined
): boolean =>
  ranges?.some((range) => line >= range.start && line <= range.end) ?? false;

export const findAddedLines = (diff: string, pattern: RegExp): AddedLine[] => {
  const found: AddedLine[] = [];
  let file = '';
  let line = 0;

  for (const text of diff.split('\n')) {
    const header = FILE_HEADER.exec(text);
    if (header) {
      file = header[1];
      continue;
    }

    const hunk = HUNK_HEADER.exec(text);
    if (hunk) {
      line = Number(hunk[1]);
      continue;
    }

    if (!file) {
      continue;
    }
    if (text.startsWith('+')) {
      if (pattern.test(text)) {
        found.push({ file, line, text: text.slice(1).trim() });
      }
      line++;
    } else if (text.startsWith(' ')) {
      line++;
    }
  }

  return found;
};
