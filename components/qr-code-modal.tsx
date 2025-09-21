'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  size = 256,
}: QRCodeModalProps) {
  const qrRef = useRef<SVGSVGElement>(null);

  const downloadQRCode = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = canvas.toDataURL();
        link.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const shareQRCode = async () => {
    if (!qrRef.current) return;

    try {
      const svg = qrRef.current;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = size;
      canvas.height = size;

      img.onload = async () => {
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(async (blob) => {
            if (blob && navigator.clipboard && window.ClipboardItem) {
              try {
                await navigator.clipboard.write([
                  new ClipboardItem({ 'image/png': blob }),
                ]);
                alert('QR code copied to clipboard!');
              } catch (err) {
                console.error('Failed to copy to clipboard:', err);
                alert('Failed to copy to clipboard');
              }
            }
          });
        }
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } catch (err) {
      console.error('Failed to share QR code:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const openInNewTab = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const dataUrl = 'data:image/svg+xml;base64,' + btoa(svgData);

    window.open(dataUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center p-6">
          <QRCodeSVG
            ref={qrRef}
            value={value}
            size={size}
            level="M"
            marginSize={4}
          />
        </div>

        <DialogFooter className="justify-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={downloadQRCode}
              title="Download QR Code"
            >
              <Download />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={shareQRCode}
              title="Copy to Clipboard"
            >
              <Share />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={openInNewTab}
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