import { Suspense } from 'react';
import { UserParams } from '../params';
import { UserQualityBreakdown } from '../components/risk/user-quality-breakdown';
import { UserQualityBreakdownSkeleton } from '../components/risk/user-quality-breakdown-skeleton';
import { NoQualityScore } from '../components/risk/no-quality-score';
import getUserQualityScore from '@/procedures/user/get-user-quality-score';

interface PageProps {
  params: Promise<UserParams>;
}

export default async function Page({ params }: PageProps) {
  const awaited = await params;

  return (
    <Suspense fallback={<UserQualityBreakdownSkeleton />}>
      <Wrapper {...awaited} />
    </Suspense>
  );
}

const Wrapper: React.FC<UserParams> = async ({ userId }) => {
  const quality = await getUserQualityScore({ userId });

  if (!quality.ok) {
    if (quality.data.code === 'NOT_FOUND') {
      return <NoQualityScore />;
    }
    return <div>Error loading quality score: {quality.data.message}</div>;
  }

  return <UserQualityBreakdown quality={quality.data} />;
};
