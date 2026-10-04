import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FileSize } from '@giveaway/util-media/files';
import { FileUpload } from '../file-upload';

const { upload, useFileProvider } = vi.hoisted(() => {
  const upload = vi.fn();
  return { upload, useFileProvider: vi.fn(() => ({ upload })) };
});

vi.mock('@giveaway/ui-hooks/use-file-provider', () => ({ useFileProvider }));

const createdImages: HTMLImageElement[] = [];
const NativeImage = window.Image;

function createFile(name = 'prize.png', type = 'image/png', size = 1024) {
  return new File([new Uint8Array(size)], name, { type });
}

function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

function getDropZone() {
  return screen.getByText('Drag and drop files here')
    .parentElement as HTMLElement;
}

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

  it('describes the accepted file types and the size limit', () => {
    render(<FileUpload />);
    expect(
      screen.getByText(/Up to 5 MB\. Accepts JPEG, PNG, GIF/)
    ).toBeInTheDocument();
  });

  it('describes custom limits', () => {
    const { container } = render(
      <FileUpload maxSize={new FileSize(500, 'KB')} />
    );
    expect(screen.getByText(/Up to 500 KB\./)).toBeInTheDocument();
    expect(getFileInput(container)).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,image/gif'
    );
  });

  it('uses the demo provider when isDemo is set', () => {
    render(<FileUpload isDemo />);
    expect(useFileProvider).toHaveBeenCalledWith(true);
  });

  it('opens the file picker when the drop zone is clicked', async () => {
    const click = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(() => {});
    render(<FileUpload />);
    await userEvent.click(getDropZone());
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('uploads a selected image, previews it and reports its url', async () => {
    upload.mockResolvedValue({ url: 'https://cdn.example.com/prize.png' });
    const onUpload = vi.fn();
    const { container } = render(<FileUpload onUpload={onUpload} />);
    const file = createFile();

    await userEvent.upload(getFileInput(container), file);

    expect(upload).toHaveBeenCalledWith(file, expect.any(Function));
    expect(onUpload).toHaveBeenCalledWith('https://cdn.example.com/prize.png');
    expect(screen.getByRole('img', { name: 'Preview' })).toHaveAttribute(
      'src',
      'blob:preview'
    );
  });

  it('shows the progress while uploading and disables the input', async () => {
    let finish: (value: { url: string }) => void = () => {};
    let reportProgress: (progress: number) => void = () => {};
    upload.mockImplementation(
      (_file: File, onProgress: (progress: number) => void) => {
        reportProgress = onProgress;
        return new Promise((resolve) => {
          finish = resolve;
        });
      }
    );
    const { container } = render(<FileUpload />);

    await userEvent.upload(getFileInput(container), createFile());
    act(() => {
      reportProgress(40);
    });

    const uploading = screen.getByText('Uploading...');
    expect(uploading.previousElementSibling?.firstElementChild).toHaveStyle({
      width: '40%'
    });
    expect(getFileInput(container)).toBeDisabled();

    await act(async () => {
      finish({ url: 'https://cdn.example.com/prize.png' });
    });

    expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
    expect(getFileInput(container)).toBeEnabled();
  });

  it('rejects files of an unsupported type', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(<FileUpload />);

    await user.upload(
      getFileInput(container),
      createFile('notes.txt', 'text/plain')
    );

    expect(window.alert).toHaveBeenCalledWith(
      'Only JPEG, PNG, GIF files are allowed.'
    );
    expect(upload).not.toHaveBeenCalled();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('rejects files above the size limit', async () => {
    const { container } = render(
      <FileUpload maxSize={new FileSize(1, 'KB')} />
    );

    await userEvent.upload(
      getFileInput(container),
      createFile('large.png', 'image/png', 2048)
    );

    expect(window.alert).toHaveBeenCalledWith(
      'File size must be less than 1 KB.'
    );
    expect(upload).not.toHaveBeenCalled();
  });

  it('alerts when the upload fails but keeps the preview', async () => {
    upload.mockRejectedValue(new Error('network'));
    const onUpload = vi.fn();
    const { container } = render(<FileUpload onUpload={onUpload} />);

    await userEvent.upload(getFileInput(container), createFile());

    expect(window.alert).toHaveBeenCalledWith('Upload failed');
    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.getByRole('img', { name: 'Preview' })).toBeInTheDocument();
  });

  it('uploads a dropped file', async () => {
    upload.mockResolvedValue({ url: 'https://cdn.example.com/prize.png' });
    render(<FileUpload />);
    const file = createFile();

    await act(async () => {
      fireEvent.drop(getDropZone(), { dataTransfer: { files: [file] } });
    });

    expect(upload).toHaveBeenCalledWith(file, expect.any(Function));
  });

  it('shows the initial image and removes it', async () => {
    const onUpload = vi.fn();
    render(
      <FileUpload
        initialUrl="https://cdn.example.com/existing.png"
        onUpload={onUpload}
      />
    );
    expect(screen.getByRole('img', { name: 'Preview' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/existing.png'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Remove file' }));

    expect(onUpload).toHaveBeenCalledWith('');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Drag and drop files here')).toBeInTheDocument();
  });

  it('opens a fullscreen preview and closes it', async () => {
    render(<FileUpload initialUrl="https://cdn.example.com/existing.png" />);

    await userEvent.click(
      screen.getByRole('button', { name: 'View fullscreen' })
    );
    const fullscreen = screen.getByRole('img', { name: 'Fullscreen preview' });
    expect(fullscreen.closest('.fixed')?.parentElement).toBe(document.body);

    await userEvent.click(fullscreen);
    expect(
      screen.getByRole('img', { name: 'Fullscreen preview' })
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Close fullscreen' })
    );
    expect(
      screen.queryByRole('img', { name: 'Fullscreen preview' })
    ).not.toBeInTheDocument();
  });

  it('closes the fullscreen preview when the backdrop is clicked', async () => {
    render(<FileUpload initialUrl="https://cdn.example.com/existing.png" />);
    await userEvent.click(
      screen.getByRole('button', { name: 'View fullscreen' })
    );
    const backdrop = screen
      .getByRole('img', { name: 'Fullscreen preview' })
      .closest('.fixed') as HTMLElement;

    await userEvent.click(backdrop);

    expect(
      screen.queryByRole('img', { name: 'Fullscreen preview' })
    ).not.toBeInTheDocument();
  });

  it.each([
    ['sm', ['w-20', 'h-20']],
    ['md', ['w-40', 'h-40']],
    ['lg', ['w-60', 'h-60']],
    ['wide', ['w-full', 'h-40']]
  ] as const)('sizes the drop zone for the %s size', (size, classNames) => {
    render(<FileUpload size={size} />);
    expect(getDropZone()).toHaveClass(...classNames);
  });

  it('applies the size to the preview unless fillPreview is set', () => {
    const { unmount } = render(
      <FileUpload size="sm" initialUrl="https://cdn.example.com/existing.png" />
    );
    expect(
      screen.getByRole('img', { name: 'Preview' }).parentElement
    ).toHaveClass('w-20', 'h-20');
    unmount();

    render(
      <FileUpload
        size="sm"
        fillPreview
        initialUrl="https://cdn.example.com/existing.png"
      />
    );
    expect(
      screen.getByRole('img', { name: 'Preview' }).parentElement
    ).not.toHaveClass('w-20');
  });

  it('stretches the preview to the image aspect ratio when fillPreview is set', () => {
    render(
      <FileUpload fillPreview initialUrl="https://cdn.example.com/wide.png" />
    );
    const [probe] = createdImages;
    expect(probe.src).toBe('https://cdn.example.com/wide.png');
    probe.width = 200;
    probe.height = 100;

    act(() => {
      probe.dispatchEvent(new Event('load'));
    });

    const frame = screen.getByRole('img', { name: 'Preview' })
      .parentElement as HTMLElement;
    expect(frame.style.width).toBe('100%');
    expect(frame.style.aspectRatio).toBe('2 / 1');
  });

  it('merges a custom class name on the wrapper', () => {
    const { container } = render(<FileUpload className="items-start" />);
    expect(container.firstChild).toHaveClass('flex', 'items-start');
  });
});
