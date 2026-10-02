'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CopyLinkInputProps {
  value: string;
  placeholder?: string;
  className?: string;
  onCopy?: () => void;
}

export const CopyLinkInput: React.FC<CopyLinkInputProps> = ({
  value,
  placeholder = 'URL',
  className,
  onCopy
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      onCopy?.();

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className={cn('relative flex', className)}>
      <Input
        value={value}
        placeholder={placeholder}
        readOnly
        className="flex-1 pr-12 text-sm font-mono bg-muted/30 cursor-default"
      />
      <Button
        onClick={handleCopy}
        variant="ghost"
        size="sm"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
        disabled={!value}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
