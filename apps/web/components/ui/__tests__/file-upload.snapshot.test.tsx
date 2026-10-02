import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FileUpload } from '../file-upload';

const { upload, useFileProvider } = vi.hoisted(() => {
  const upload = vi.fn();
  return { upload, useFileProvider: vi.fn(() => ({ upload })) };
});

vi.mock('@/components/hooks/use-file-provider', () => ({ useFileProvider }));

const createdImages: HTMLImageElement[] = [];
const NativeImage = window.Image;

describe('FileUpload', () => {
  beforeEach(() => {
    upload.mockReset();
    useFileProvider.mockClear();
    createdImages.length = 0;
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:preview')
    });
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.stubGlobal('Image', function TrackedImage() {
      const image = new NativeImage();
      createdImages.push(image);
      return image;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(URL, 'createObjectURL');
  });

  it('matches the snapshot of the empty drop zone', () => {
    const { container } = render(<FileUpload />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
