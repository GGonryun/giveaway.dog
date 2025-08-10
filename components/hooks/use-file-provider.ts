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
    if (onProgress) onProgress(0);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: file
    });
    if (!res.ok) throw new Error('Upload failed');
    if (onProgress) onProgress(100);
    const { url } = await res.json();
    return { url };
  }
}

class MockFileProvider implements FileProvider {
  private counter = 0;
  async upload(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResult> {
    if (onProgress) onProgress(0);
    await new Promise((r) => setTimeout(r, 500));
    if (onProgress) onProgress(100);
    this.counter++;
    return { url: URL.createObjectURL(file) };
  }
}

export type FileProviderType = 'vercel' | 'mock';

export function useFileProvider(
  type: FileProviderType = 'vercel'
): FileProvider {
  // Could be extended to use context or env
  const [mockInstance] = useState(() => new MockFileProvider());
  switch (type) {
    case 'mock':
      return mockInstance;
    case 'vercel':
    default:
      return new VercelFileProvider();
  }
}
