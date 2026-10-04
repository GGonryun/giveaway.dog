'use server';

import { Outline } from '@/components/app/outline';
import { CreateTemplateButton } from '@/lib/templates/components/create-template-button';
import { TeamPageProps } from '@giveaway/sweepstakes-model/pages';

type Props = {
  children: React.ReactNode;
  params: Promise<TeamPageProps>;
};

export default async function Layout({ children, params }: Props) {
  const { slug } = await params;

  return (
    <Outline
      action={<CreateTemplateButton />}
      title={[
        { href: `/app/${slug}`, label: 'Sweepstakes' },
        { label: 'Templates' }
      ]}
    >
      {children}
    </Outline>
  );
}
