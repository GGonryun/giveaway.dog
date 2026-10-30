import { ComingSoon } from '@giveaway/marketing-ui/coming-soon';
import { pageMetadata } from '@giveaway/marketing-model/page-metadata';

export const metadata = pageMetadata({
  title: 'Apps | Giveaway.dog',
  description:
    'Apps that connect Giveaway.dog to the tools you already use to run giveaways.'
});

export default async function Page() {
  return <ComingSoon />;
}
