import Link from 'next/link';
import { EmojiLogo } from '../emoji-logo';

export const NavLogo: React.FC = () => {
  return (
    <Link href="/home" className="flex items-center gap-2">
      <EmojiLogo className="text-3xl mb-1" />
      <span className="text-lg font-semibold">Giveaway.dog</span>
    </Link>
  );
};
