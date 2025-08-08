import { Suspense } from 'react';
import { GiveawayForm } from './components/create-giveaway';

export default async function Page() {
  return (
    <Suspense>
      <GiveawayForm />
    </Suspense>
  );
}
