import { upload } from '@vercel/blob/client';
import { useState } from 'react';

export interface FileUploadResult {
  url: string;
}

export interface FileProvider {
  upload: (
    file: File,
    onProgress?: (progress: number) => void
  ) => Promise<FileUploadResult>;
}

class VercelFileProvider implements FileProvider {
  async upload(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResult> {
    onProgress?.(0);
    const result = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      onUploadProgress(e) {
        onProgress?.(e.percentage);
      }
    });
    onProgress?.(100);
    return result;
  }
}

export function useFileProvider(): FileProvider {
  return new VercelFileProvider();
}
