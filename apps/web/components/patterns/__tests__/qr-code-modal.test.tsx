import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QRCodeModal } from '../qr-code-modal';

const mocks = vi.hoisted(() => ({
  downloadQRCode: vi.fn(),
  shareQRCode: vi.fn(),
  openQRCodeInNewTab: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn()
}));

vi.mock('@/lib/qr', () => ({
  downloadQRCode: mocks.downloadQRCode,
  shareQRCode: mocks.shareQRCode,
  openQRCodeInNewTab: mocks.openQRCodeInNewTab
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError }
}));

const renderModal = (
  props: Partial<React.ComponentProps<typeof QRCodeModal>> = {}
) => {
  const onClose = vi.fn();
  render(
    <QRCodeModal
      isOpen
      onClose={onClose}
      value="https://giveaway.dog/g/summer"
      {...props}
    />
  );
  return { onClose };
};

const qrCode = () =>
  screen.getByRole('dialog').querySelector('svg:not(.lucide)') as SVGElement;

describe('QRCodeModal', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it('renders nothing while closed', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the default title', () => {
    renderModal();
    expect(screen.getByRole('dialog', { name: 'QR Code' })).toBeInTheDocument();
  });

  it('shows a custom title', () => {
    renderModal({ title: 'Share your giveaway' });
    expect(
      screen.getByRole('dialog', { name: 'Share your giveaway' })
    ).toBeInTheDocument();
  });

  it('draws the QR code at the default size', () => {
    renderModal();
    expect(qrCode()).toHaveAttribute('width', '256');
    expect(qrCode()).toHaveAttribute('height', '256');
  });

  it('draws the QR code at a custom size', () => {
    renderModal({ size: 128 });
    expect(qrCode()).toHaveAttribute('width', '128');
  });

  it('redraws the QR code when the value changes', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <QRCodeModal isOpen onClose={onClose} value="https://giveaway.dog/a" />
    );
    const first = qrCode().innerHTML;
    rerender(
      <QRCodeModal isOpen onClose={onClose} value="https://giveaway.dog/b" />
    );
    expect(qrCode().innerHTML).not.toBe(first);
  });

  it('downloads the rendered QR code at its size', async () => {
    renderModal({ size: 200 });
    await userEvent.click(
      screen.getByRole('button', { name: 'Download QR Code' })
    );
    expect(mocks.downloadQRCode).toHaveBeenCalledExactlyOnceWith(qrCode(), 200);
  });

  it('confirms when the QR code is copied to the clipboard', async () => {
    mocks.shareQRCode.mockResolvedValue(undefined);
    renderModal();
    await userEvent.click(
      screen.getByRole('button', { name: 'Copy to Clipboard' })
    );
    expect(mocks.shareQRCode).toHaveBeenCalledWith(qrCode(), 256);
    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        'QR code value copied to clipboard!'
      )
    );
  });

  it('reports a failure to copy the QR code', async () => {
    mocks.shareQRCode.mockRejectedValue(new Error('denied'));
    renderModal();
    await userEvent.click(
      screen.getByRole('button', { name: 'Copy to Clipboard' })
    );
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        'Failed to copy QR code value.'
      )
    );
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it('opens the QR code in a new tab', async () => {
    renderModal();
    await userEvent.click(
      screen.getByRole('button', { name: 'Open in New Tab' })
    );
    expect(mocks.openQRCodeInNewTab).toHaveBeenCalledExactlyOnceWith(
      qrCode(),
      256
    );
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it('reports a failure to open the QR code in a new tab', async () => {
    mocks.openQRCodeInNewTab.mockImplementation(() => {
      throw new Error('popup blocked');
    });
    renderModal();
    await userEvent.click(
      screen.getByRole('button', { name: 'Open in New Tab' })
    );
    expect(mocks.toastError).toHaveBeenCalledWith(
      'Failed to open QR code in new tab.'
    );
  });

  it('asks to close when the close button is pressed', async () => {
    const { onClose } = renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('asks to close when escape is pressed', async () => {
    const { onClose } = renderModal();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
