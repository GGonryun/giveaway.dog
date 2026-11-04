import 'server-only';

import { del } from '@vercel/blob';

export type DataRetentionMode = 'report' | 'delete';

export const dataRetentionMode = (): DataRetentionMode =>
  process.env.DATA_RETENTION_MODE === 'delete' ? 'delete' : 'report';

const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com';

export const isUploadedFileUrl = (value: unknown): value is string => {
  try {
    const url = new URL(value as string);
    return url.protocol === 'https:' && url.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
};

const DELETE_BATCH_SIZE = 100;

export const toUploadedFiles = (values: unknown[]): string[] => [
  ...new Set(values.filter(isUploadedFileUrl))
];

export const deleteUploadedFiles = async (
  values: unknown[]
): Promise<number> => {
  const files = toUploadedFiles(values);
  if (files.length > 0 && !process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn(
      `[retention] BLOB_READ_WRITE_TOKEN is not set, so ${files.length} uploaded files are kept`
    );
    return 0;
  }
  for (let start = 0; start < files.length; start += DELETE_BATCH_SIZE) {
    await del(files.slice(start, start + DELETE_BATCH_SIZE));
  }
  return files.length;
};
