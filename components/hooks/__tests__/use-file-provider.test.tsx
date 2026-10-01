import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { upload } from '@vercel/blob/client';
import { useFileProvider } from '../use-file-provider';

vi.mock('@vercel/blob/client', () => ({
  upload: vi.fn()
}));

const uploadMock = vi.mocked(upload);

const blobResult = {
  url: 'https://blob.example.com/logo.png',
  downloadUrl: 'https://blob.example.com/logo.png?download=1',
  pathname: 'logo.png',
  contentType: 'image/png',
  contentDisposition: 'inline; filename="logo.png"',
  etag: 'etag-1'
};

const createImage = () =>
  new File(['image-bytes'], 'logo.png', { type: 'image/png' });

describe('useFileProvider', () => {
  beforeEach(() => {
    uploadMock.mockReset();
  });

  describe('when not in demo mode', () => {
    it('uploads the file through the upload route as a public blob', async () => {
      uploadMock.mockResolvedValue(blobResult);
      const file = createImage();
      const { result } = renderHook(() => useFileProvider());

      await result.current.upload(file);

      expect(uploadMock).toHaveBeenCalledWith('logo.png', file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        onUploadProgress: expect.any(Function)
      });
    });

    it('resolves with the uploaded blob url', async () => {
      uploadMock.mockResolvedValue(blobResult);
      const { result } = renderHook(() => useFileProvider(false));

      const uploaded = await result.current.upload(createImage());

      expect(uploaded.url).toBe('https://blob.example.com/logo.png');
    });

    it('reports 0, each upload percentage and then 100', async () => {
      uploadMock.mockImplementation(async (_pathname, _body, options) => {
        options.onUploadProgress?.({ loaded: 25, total: 100, percentage: 25 });
        options.onUploadProgress?.({ loaded: 80, total: 100, percentage: 80 });
        return blobResult;
      });
      const onProgress = vi.fn();
      const { result } = renderHook(() => useFileProvider());

      await result.current.upload(createImage(), onProgress);

      expect(onProgress.mock.calls).toEqual([[0], [25], [80], [100]]);
    });

    it('rejects without reporting completion when the upload fails', async () => {
      uploadMock.mockRejectedValue(new Error('Upload refused'));
      const onProgress = vi.fn();
      const { result } = renderHook(() => useFileProvider());

      await expect(
        result.current.upload(createImage(), onProgress)
      ).rejects.toThrow('Upload refused');
      expect(onProgress.mock.calls).toEqual([[0]]);
    });

    it('uploads without a progress callback', async () => {
      uploadMock.mockImplementation(async (_pathname, _body, options) => {
        options.onUploadProgress?.({ loaded: 1, total: 2, percentage: 50 });
        return blobResult;
      });
      const { result } = renderHook(() => useFileProvider());

      await expect(result.current.upload(createImage())).resolves.toEqual(
        blobResult
      );
    });
  });

  describe('when in demo mode', () => {
    it('resolves with a data url of the file contents', async () => {
      const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
      const { result } = renderHook(() => useFileProvider(true));

      const uploaded = await result.current.upload(file);

      expect(uploaded).toEqual({ url: 'data:text/plain;base64,aGVsbG8=' });
    });

    it('reports progress starting at 0 and ending at 100', async () => {
      const onProgress = vi.fn();
      const { result } = renderHook(() => useFileProvider(true));

      await result.current.upload(createImage(), onProgress);

      expect(onProgress.mock.calls[0]).toEqual([0]);
      expect(onProgress.mock.calls.at(-1)).toEqual([100]);
    });

    it('does not call the blob upload service', async () => {
      const { result } = renderHook(() => useFileProvider(true));

      await result.current.upload(createImage());

      expect(uploadMock).not.toHaveBeenCalled();
    });
  });
});
