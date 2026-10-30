import { ComingSoon } from '@giveaway/marketing-ui/coming-soon';
import { pageMetadata } from '@giveaway/marketing-model/page-metadata';

export const metadata = pageMetadata({
  title: 'Giveaway Examples | Giveaway.dog',
  description:
    'See examples of giveaways, contests and sweepstakes that hosts run with Giveaway.dog.'
});

export default async function Page() {
  return <ComingSoon />;
}
