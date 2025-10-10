'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AnnouncementConfig } from '@/lib/announcements';

interface AnnouncementBannerProps {
  announcement: AnnouncementConfig | null;
}

const variantStyles = {
  default: 'bg-primary text-primary-foreground',
  info: 'bg-blue-600 text-white',
  success: 'bg-green-600 text-white',
  warning: 'bg-yellow-600 text-white'
};

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  announcement
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (!announcement || dismissed) return null;

  const variant = announcement.variant || 'default';

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`announcement-dismissed-${announcement.id}`, 'true');
    }
  };

  if (
    typeof window !== 'undefined' &&
    announcement.dismissible &&
    localStorage.getItem(`announcement-dismissed-${announcement.id}`)
  ) {
    return null;
  }

  return (
    <div className={`${variantStyles[variant]} py-2 px-4 relative`}>
      <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
        <p className="flex-1 text-center">
          {announcement.message}
          {announcement.link && (
            <>
              {' '}
              <Link
                href={announcement.link.href}
                className="underline font-medium hover:opacity-80"
              >
                {announcement.link.text}
              </Link>
            </>
          )}
        </p>
        {announcement.dismissible && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-current hover:bg-white/20"
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
