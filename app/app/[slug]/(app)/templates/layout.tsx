'use server';

import { Outline } from '@/components/app/outline';
import { TeamPageProps } from '@/schemas/pages';

type Props = {
  children: React.ReactNode;
  params: Promise<TeamPageProps>;
};

export default async function Layout({ children, params }: Props) {
  const { slug } = await params;

  return (
    <Outline
      title={[
        { href: `/app/${slug}`, label: 'Sweepstakes' },
        { label: 'Templates' }
      ]}
    >
      {children}
    </Outline>
  );
}
