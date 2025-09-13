'use server';

import { EmojiLogo } from '@/components/patterns/emoji-logo';
import Link from 'next/link';

export default async function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-giveaway min-h-screen flex flex-col h-full">
      <div className="flex grow">
        <div className="flex flex-col items-center justify-center gap-0 pb-6 mx-1 sm:container sm:max-w-2xl">
          <Link href="/">
            <EmojiLogo className="text-[6rem] leading-[7rem]" />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
