'use client';

import { upload } from '@vercel/blob/client';

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

class DemoFileProvider implements FileProvider {
  async upload(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResult> {
    onProgress?.(0);

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress?.(progress);
        }
      };

      reader.onload = () => {
        onProgress?.(100);
        resolve({
          url: reader.result as string
        });
      };

      reader.readAsDataURL(file);
    });
  }
}

export function useFileProvider(isDemo?: boolean): FileProvider {
  if (isDemo) {
    return new DemoFileProvider();
  }

  return new VercelFileProvider();
}
