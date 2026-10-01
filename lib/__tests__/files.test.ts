import { describe, it, expect } from 'vitest';
import {
  fileTypeKey,
  fileTypeValueSchema,
  FILE_TYPES,
  FileSize,
  AcceptedFileTypes
} from '../files';

describe('fileTypeKey', () => {
  it.each(['JPEG', 'PNG', 'GIF', 'WEBP', 'SVG'])('accepts %s', (key) => {
    expect(fileTypeKey.parse(key)).toBe(key);
  });

  it.each(['jpeg', 'BMP', '', null])('rejects %s', (key) => {
    expect(fileTypeKey.safeParse(key).success).toBe(false);
  });

  it('exposes the enum keys and values', () => {
    expect(fileTypeKey.enum).toEqual({
      JPEG: 'JPEG',
      PNG: 'PNG',
      GIF: 'GIF',
      WEBP: 'WEBP',
      SVG: 'SVG'
    });
  });
});

describe('fileTypeValueSchema', () => {
  it('accepts an object with a mime and label', () => {
    expect(
      fileTypeValueSchema.parse({ mime: 'image/png', label: 'PNG', extra: 1 })
    ).toEqual({ mime: 'image/png', label: 'PNG' });
  });

  it('rejects an object missing the label', () => {
    expect(fileTypeValueSchema.safeParse({ mime: 'image/png' }).success).toBe(
      false
    );
  });

  it('rejects a non string mime', () => {
    expect(
      fileTypeValueSchema.safeParse({ mime: 1, label: 'PNG' }).success
    ).toBe(false);
  });
});

describe('FILE_TYPES', () => {
  it('maps every key to its mime type and label', () => {
    expect(FILE_TYPES).toEqual({
      JPEG: { mime: 'image/jpeg', label: 'JPEG' },
      PNG: { mime: 'image/png', label: 'PNG' },
      GIF: { mime: 'image/gif', label: 'GIF' },
      WEBP: { mime: 'image/webp', label: 'WEBP' },
      SVG: { mime: 'image/svg+xml', label: 'SVG' }
    });
  });

  it('has an entry for every fileTypeKey option', () => {
    expect(Object.keys(FILE_TYPES).sort()).toEqual(
      Object.values(fileTypeKey.enum).sort()
    );
  });

  it('only contains values that satisfy fileTypeValueSchema', () => {
    for (const value of Object.values(FILE_TYPES)) {
      expect(fileTypeValueSchema.safeParse(value).success).toBe(true);
    }
  });
});

describe('FileSize', () => {
  it('exposes binary unit multipliers', () => {
    expect([
      FileSize.B,
      FileSize.KB,
      FileSize.MB,
      FileSize.GB,
      FileSize.TB
    ]).toEqual([1, 1024, 1048576, 1073741824, 1099511627776]);
  });

  it('stores the value and unit given to the constructor', () => {
    const size = new FileSize(5, 'MB');

    expect({ value: size.value, unit: size.unit }).toEqual({
      value: 5,
      unit: 'MB'
    });
  });

  it.each([
    [3, 'B', 3],
    [2, 'KB', 2048],
    [5, 'MB', 5242880],
    [1, 'GB', 1073741824],
    [2, 'TB', 2199023255552]
  ] as const)('converts %s %s to %s bytes', (value, unit, bytes) => {
    expect(new FileSize(value, unit).toBytes()).toBe(bytes);
  });

  it('converts fractional values to bytes', () => {
    expect(new FileSize(1.5, 'KB').toBytes()).toBe(1536);
  });

  it('converts zero to zero bytes', () => {
    expect(new FileSize(0, 'GB').toBytes()).toBe(0);
  });

  it('formats as the value followed by the unit', () => {
    expect(new FileSize(10, 'MB').toString()).toBe('10 MB');
  });

  it('formats fractional values without rounding', () => {
    expect(`${new FileSize(2.5, 'GB')}`).toBe('2.5 GB');
  });
});

describe('AcceptedFileTypes', () => {
  const accepted = new AcceptedFileTypes(['PNG', 'JPEG', 'SVG']);

  it('keeps the keys in the given order', () => {
    expect(accepted.keys).toEqual(['PNG', 'JPEG', 'SVG']);
  });

  it('resolves the file type values for each key', () => {
    expect(accepted.values).toEqual([
      { mime: 'image/png', label: 'PNG' },
      { mime: 'image/jpeg', label: 'JPEG' },
      { mime: 'image/svg+xml', label: 'SVG' }
    ]);
  });

  it('collects the mime types for each key', () => {
    expect(accepted.mimes).toEqual([
      'image/png',
      'image/jpeg',
      'image/svg+xml'
    ]);
  });

  it('collects the labels for each key', () => {
    expect(accepted.labels).toEqual(['PNG', 'JPEG', 'SVG']);
  });

  it('joins the labels with commas in toString', () => {
    expect(accepted.toString()).toBe('PNG, JPEG, SVG');
  });

  it('returns the labels array from toLabels', () => {
    expect(accepted.toLabels()).toBe(accepted.labels);
  });

  it('includes a type that matches an accepted mime', () => {
    expect(accepted.includes('image/jpeg')).toBe(true);
  });

  it('includes a type that matches an accepted label', () => {
    expect(accepted.includes('SVG')).toBe(true);
  });

  it('does not include a mime type that was not accepted', () => {
    expect(accepted.includes('image/gif')).toBe(false);
  });

  it('matches labels case sensitively', () => {
    expect(accepted.includes('png')).toBe(false);
  });

  it('does not include an empty string', () => {
    expect(accepted.includes('')).toBe(false);
  });

  describe('with no keys', () => {
    const empty = new AcceptedFileTypes([]);

    it('has empty collections', () => {
      expect([empty.keys, empty.values, empty.mimes, empty.labels]).toEqual([
        [],
        [],
        [],
        []
      ]);
    });

    it('formats as an empty string', () => {
      expect(empty.toString()).toBe('');
    });

    it('includes nothing', () => {
      expect(empty.includes('image/png')).toBe(false);
    });
  });

  it('throws when constructed with an unknown key', () => {
    expect(
      () =>
        new AcceptedFileTypes(['BMP'] as unknown as ConstructorParameters<
          typeof AcceptedFileTypes
        >[0])
    ).toThrow(TypeError);
  });
});
