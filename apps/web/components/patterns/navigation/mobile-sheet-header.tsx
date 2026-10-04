import { SheetHeader, SheetTitle } from '@giveaway/ui-primitives/sheet';
import Link from 'next/link';
import { EmojiLogo } from '../emoji-logo';

export const MobileSheetHeader: React.FC<{ onLogoClick: () => void }> = ({
  onLogoClick
}) => {
  return (
    <SheetHeader>
      <SheetTitle hidden>
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={onLogoClick}
        >
          <EmojiLogo className="text-3xl mb-1" />
          <span className="text-lg font-semibold tracking-tighter">
            Giveaway.dog
          </span>
        </Link>
      </SheetTitle>
    </SheetHeader>
  );
};
