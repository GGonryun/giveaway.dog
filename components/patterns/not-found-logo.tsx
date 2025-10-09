'use client';
import Image from 'next/image';
import { Button } from '../ui/button';
import { useState } from 'react';
import { DEFAULT_TEAM_LOGO } from '@/lib/settings';

export const NotFoundLogo = () => {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  return (
    <div>
      {showEasterEgg ? (
        <Image
          src={'/dog.png'}
          alt="Team Logo"
          className="mx-auto"
          width={200}
          height={200}
        />
      ) : (
        <div
          className="text-8xl cursor-help"
          onClick={() => setShowEasterEgg(!showEasterEgg)}
        >
          {DEFAULT_TEAM_LOGO}
        </div>
      )}
    </div>
  );
};
