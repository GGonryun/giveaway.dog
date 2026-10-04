'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@giveaway/ui-primitives/avatar';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@giveaway/ui-primitives/dialog';

interface Host {
  label: string;
  fallback: string;
  image: string;
}

interface AvatarGroupEasterEggProps {
  hosts: Host[];
}

export const AvatarGroupEasterEgg = ({ hosts }: AvatarGroupEasterEggProps) => {
  const [clickSequence, setClickSequence] = useState<number[]>([]);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  const handleAvatarClick = (index: number) => {
    const newSequence = [...clickSequence, index];

    if (newSequence.length === 1 && index === 0) {
      setClickSequence(newSequence);
    } else if (
      newSequence.length === 2 &&
      newSequence[0] === 0 &&
      index === 5
    ) {
      setShowEasterEgg(true);
      setClickSequence([]);
    } else {
      setClickSequence([]);
    }
  };

  return (
    <>
      <div className="flex flex-row -space-x-2">
        {hosts.map((host, index) => (
          <button
            key={host.label}
            onClick={() => handleAvatarClick(index)}
            className="cursor-pointer hover:z-10 transition-all"
            type="button"
          >
            <Avatar className="border-4 border-background w-12 h-12">
              <Image
                src={host.image}
                alt={host.fallback}
                width={48}
                height={48}
                className="aspect-square w-full h-full"
              />
              <AvatarFallback>{host.fallback}</AvatarFallback>
            </Avatar>
          </button>
        ))}
      </div>

      <Dialog open={showEasterEgg} onOpenChange={setShowEasterEgg}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>The True Giveaway Dog Logo</DialogTitle>
          </DialogHeader>
          <Image
            src="/images/easter-egg.png"
            alt="Easter egg"
            width={500}
            height={500}
            className="w-full aspect-square object-cover rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
