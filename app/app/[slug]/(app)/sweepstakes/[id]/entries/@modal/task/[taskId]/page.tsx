'use server';

import {
  TaskCompletionDetailSheet,
  TaskCompletionDetailSheetContent
} from '@/components/sweepstakes-details/task-completion-detail-sheet';
import getSweepstakeEntry from '@/procedures/sweepstakes/get-sweepstake-task-entries';
import { Suspense } from 'react';

const Page: React.FC<{
  params: Promise<{ slug: string; id: string; taskId: string }>;
}> = async ({ params }) => {
  const { id, taskId, slug } = await params;

  if (!id || !taskId) {
    return null;
  }

  return (
    <TaskCompletionDetailSheet sweepstakesId={id} slug={slug}>
      <Suspense fallback={<div>Loading...</div>}>
        <Wrapper sweepstakesId={id} taskId={taskId} />
      </Suspense>
    </TaskCompletionDetailSheet>
  );
};

const Wrapper: React.FC<{ sweepstakesId: string; taskId: string }> = async ({
  sweepstakesId,
  taskId
}) => {
  const details = await getSweepstakeEntry({
    sweepstakesId,
    taskId
  });

  if (!details.ok) {
    return <div>Failed to load sweepstakes entry: {details.data.message}</div>;
  }

  return <TaskCompletionDetailSheetContent entries={details.data} />;
};

export default Page;
