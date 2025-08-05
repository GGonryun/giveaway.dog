import Image from 'next/image';
import { Typography } from '../ui/typography';

export const ComingSoon = () => {
  return (
    <div className="flex flex-col gap-4 justify-center items-center h-full w-full">
      <Image src="/dog.png" alt="The Giveaway Dog" width="222" height="198" />
      <Typography>Coming Soon</Typography>
    </div>
  );
};
