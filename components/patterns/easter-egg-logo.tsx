'use client';
import Image from 'next/image';
import { useState } from 'react';
import { DEFAULT_TEAM_LOGO } from '@/lib/settings';

interface EasterEggLogoProps {
  size?: number;
}

export const EasterEggLogo: React.FC<EasterEggLogoProps> = ({ size = 200 }) => {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const emojiSize = Math.floor(size * 0.75);

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
        <div
          className="cursor-help"
          style={{ fontSize: `${emojiSize}px` }}
          onClick={() => setShowEasterEgg(!showEasterEgg)}
        >
          {DEFAULT_TEAM_LOGO}
        </div>
      )}
    </div>
  );
};

export { EasterEggLogo as NotFoundLogo };
