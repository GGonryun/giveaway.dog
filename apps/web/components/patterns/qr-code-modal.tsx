'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { downloadQRCode, openQRCodeInNewTab, shareQRCode } from '@/lib/qr';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  title?: string;
  size?: number;
}

export function QRCodeModal({
  isOpen,
  onClose,
  value,
  title = 'QR Code',
  size = 256
}: QRCodeModalProps) {
  const qrRef = useRef<SVGSVGElement>(null);

  const handleDownload = () => {
    if (qrRef.current) {
      downloadQRCode(qrRef.current, size);
    }
  };

  const handleShare = async () => {
    if (qrRef.current) {
      try {
        await shareQRCode(qrRef.current, size);
        toast.success('QR code value copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy QR code value.');
      }
    }
  };

  const handleOpenInNewTab = () => {
    if (qrRef.current) {
      try {
        openQRCodeInNewTab(qrRef.current, size);
      } catch (error) {
        toast.error('Failed to open QR code in new tab.');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center p-6">
          <QRCodeSVG ref={qrRef} value={value} size={size} marginSize={2} />
        </div>

        <DialogFooter className="justify-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDownload}
              title="Download QR Code"
            >
              <Download />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
              title="Copy to Clipboard"
            >
              <Share />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleOpenInNewTab}
              title="Open in New Tab"
            >
              <ExternalLink />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
