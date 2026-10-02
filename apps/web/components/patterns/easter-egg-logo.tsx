'use client';
import Image from 'next/image';
import { useState } from 'react';
import { DEFAULT_TEAM_LOGO } from '@/lib/team/data';

interface EasterEggLogoProps {
  size?: number;
}

export const EasterEggLogo: React.FC<EasterEggLogoProps> = ({ size = 200 }) => {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const logoSize = Math.floor(size * 0.75);

  return (
    <div>
      {showEasterEgg ? (
        <Image
          src={'/taki.png'}
          alt="Easter Egg"
          className="mx-auto"
          width={size}
          height={size}
        />
      ) : (
        <Image
          src={DEFAULT_TEAM_LOGO}
          alt="Default Team Logo"
          className="mx-auto cursor-help rounded-md"
          width={logoSize}
          height={logoSize}
          onClick={() => setShowEasterEgg(!showEasterEgg)}
        />
      )}
    </div>
  );
};
