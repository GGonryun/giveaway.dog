'use client';

import Image from 'next/image';
import { useState } from 'react';
import { EmojiLogo } from './logo-button';

export const TakiEasterEgg = () => {
  const [dog, setDog] = useState(false);
  return dog ? (
    <div className="size-24">
      <Image src="/dog.png" alt="The Giveaway Dog" width="222" height="198" />
    </div>
  ) : (
    <EmojiLogo onClick={() => setDog(true)} className="cursor-pointer" />
  );
};
