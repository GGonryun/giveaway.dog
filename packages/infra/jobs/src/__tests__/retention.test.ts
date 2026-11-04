import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RETENTION_BATCH_SIZE,
  RETENTION_CHUNK_SIZE,
  dataRetentionMode,
  deleteInChunks,
  deleteUploadedFiles,
  isUploadedFileUrl,
  toUploadedFiles
} from '../retention';

const blob = vi.hoisted(() => ({ del: vi.fn() }));
vi.mock('@vercel/blob', () => blob);

const file = (name: string) =>
  `https://abc.public.blob.vercel-storage.com/${name}.png`;

describe('retention', () => {
  beforeEach(() => {
    blob.del.mockReset();
    blob.del.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('keeps each uploaded file once, and only uploaded files', () => {
    expect(
      toUploadedFiles([
        file('a'),
        42,
        null,
        file('a'),
        'https://x.com',
        file('b')
      ])
    ).toEqual([file('a'), file('b')]);
  });

  describe('dataRetentionMode', () => {
    it.each([
      ['delete', 'delete'],
      ['report', 'report'],
      ['REPORT', 'delete'],
      ['', 'delete']
    ])('reads %j as %s', (value, mode) => {
      vi.stubEnv('DATA_RETENTION_MODE', value);
      expect(dataRetentionMode()).toBe(mode);
    });

    it('deletes when the variable is not set', () => {
      vi.stubEnv('DATA_RETENTION_MODE', undefined);
      expect(dataRetentionMode()).toBe('delete');
    });
  });

  describe('isUploadedFileUrl', () => {
    it.each([
      [file('a'), true],
      ['http://abc.public.blob.vercel-storage.com/a.png', false],
      ['https://example.com/a.png', false],
      ['https://public.blob.vercel-storage.com.example.com/a.png', false],
      ['not a url', false],
      [42, false],
      [undefined, false]
    ])('%j is an uploaded file: %s', (value, expected) => {
      expect(isUploadedFileUrl(value)).toBe(expected);
    });
  });

  describe('deleteUploadedFiles', () => {
    beforeEach(() => {
      vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'token');
    });

    it('deletes each uploaded file once and skips other URLs', async () => {
      const count = await deleteUploadedFiles([
        file('a'),
        file('a'),
        'https://example.com/b.png',
        file('c')
      ]);

      expect(count).toBe(2);
      expect(blob.del).toHaveBeenCalledTimes(1);
      expect(blob.del).toHaveBeenCalledWith([file('a'), file('c')]);
    });

    it('deletes nothing when no URL is an uploaded file', async () => {
      expect(await deleteUploadedFiles(['https://example.com/b.png'])).toBe(0);
      expect(blob.del).not.toHaveBeenCalled();
    });

    it('deletes the files in batches of 100', async () => {
      const files = Array.from({ length: 201 }, (_, index) => file(`${index}`));

      expect(await deleteUploadedFiles(files)).toBe(201);

      expect(blob.del.mock.calls.map(([urls]) => urls.length)).toEqual([
        100, 100, 1
      ]);
      expect(blob.del.mock.calls[2][0]).toEqual([file('200')]);
    });

    it('deletes exactly full batches without an empty one', async () => {
      const files = Array.from({ length: 200 }, (_, index) => file(`${index}`));

      await deleteUploadedFiles(files);

      expect(blob.del).toHaveBeenCalledTimes(2);
    });

    it('does not warn without a Blob token when there is nothing to delete', async () => {
      vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(await deleteUploadedFiles([])).toBe(0);

      expect(warn).not.toHaveBeenCalled();
    });

    it('keeps the files and warns without a Blob token', async () => {
      vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(await deleteUploadedFiles([file('a')])).toBe(0);

      expect(blob.del).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith(
        '[retention] BLOB_READ_WRITE_TOKEN is not set, so 1 uploaded files are kept'
      );
    });

    it('fails when Blob refuses a delete', async () => {
      blob.del.mockRejectedValue(new Error('blob down'));

      await expect(deleteUploadedFiles([file('a')])).rejects.toThrow(
        'blob down'
      );
    });
  });

  it('takes 5 items a run and deletes 500 rows at a time', () => {
    expect(RETENTION_BATCH_SIZE).toBe(5);
    expect(RETENTION_CHUNK_SIZE).toBe(500);
  });

  describe('deleteInChunks', () => {
    it('deletes chunks until one deletes nothing, and adds up the rows', async () => {
      const chunk = vi
        .fn<() => Promise<number>>()
        .mockResolvedValueOnce(500)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(0);

      expect(await deleteInChunks(chunk)).toBe(520);
      expect(chunk).toHaveBeenCalledTimes(3);
    });

    it('stops after one call when there is nothing to delete', async () => {
      const chunk = vi.fn<() => Promise<number>>().mockResolvedValue(0);

      expect(await deleteInChunks(chunk)).toBe(0);
      expect(chunk).toHaveBeenCalledTimes(1);
    });
  });
});
