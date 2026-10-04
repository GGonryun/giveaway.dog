import { QRCodeModal } from '@giveaway/ui-qr/qr-code-modal';
import { Button } from '@giveaway/ui-primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@giveaway/ui-primitives/card';
import { Input } from '@giveaway/ui-primitives/input';
import { Label } from '@giveaway/ui-primitives/label';
import { CheckCircleIcon, CopyIcon, QrCodeIcon } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

export const ShareLinksCard: React.FC<{ liveUrl: string }> = ({ liveUrl }) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedUrl(type);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Share Links</CardTitle>
          <CardDescription>
            Copy your giveaway link or generate a QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Landing Page URL</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input value={liveUrl} readOnly className="text-sm" />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(liveUrl, 'landing')}
              >
                {copiedUrl === 'landing' ? <CheckCircleIcon /> : <CopyIcon />}
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">QR Code</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsQRModalOpen(true)}
              >
                <QrCodeIcon className="h-4 w-4 mr-2" />
                View QR Code
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              High-resolution PNG format suitable for print
            </p>
          </div>
        </CardContent>
      </Card>

      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        value={liveUrl}
        title="Share Sweepstakes QR Code"
        size={256}
      />
    </>
  );
};
