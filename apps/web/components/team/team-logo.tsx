'use client';

import { useState } from 'react';
import { FALLBACK_TEAM_ICON } from '@/lib/team/data';
import Image from 'next/image';

interface TeamLogoProps {
  logoUrl?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}

export const TeamLogo = ({
  logoUrl,
  alt = 'Team logo',
  size = 40,
  className = ''
}: TeamLogoProps) => {
  const [imageError, setImageError] = useState(false);

  const isValidImageUrl = (url?: string | null): url is string => {
    if (!url || typeof url !== 'string') return false;
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const FallbackIcon = FALLBACK_TEAM_ICON;

  if (!isValidImageUrl(logoUrl) || imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded-md ${className}`}
        style={{ width: size, height: size }}
      >
        <FallbackIcon className="text-muted-foreground" size={size * 0.6} />
      </div>
    );
  }

  return (
    <Image
      src={logoUrl}
      alt={alt}
      width={size}
      height={size}
      className={`object-cover rounded-md ${className}`}
      onError={() => setImageError(true)}
    />
  );
};
