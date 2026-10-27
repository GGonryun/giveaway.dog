'use server';

import {
  TaskCompletionDetailSheet,
  TaskCompletionDetailSheetContent
} from '@giveaway/sweepstakes-details-entries/task-completion-detail-sheet';
import getSweepstakeEntry from '@giveaway/sweepstakes-insights-server/get-sweepstake-task-entries';
import getSweepstakesStatus from '@giveaway/sweepstakes-editor-server/get-sweepstakes-status';
import { EDITABLE_DERIVED_STATUS } from '@giveaway/sweepstakes-model/sweepstakes';
import { Suspense } from 'react';

const Page: React.FC<{
  params: Promise<{ slug: string; id: string; taskId: string }>;
}> = async ({ params }) => {
  const { id, taskId, slug } = await params;

  if (!id || !taskId) {
    return null;
  }

  return (
    <TaskCompletionDetailSheet sweepstakesId={id} slug={slug} root="winners">
      <Suspense fallback={<div>Loading...</div>}>
        <Wrapper sweepstakesId={id} taskId={taskId} slug={slug} />
      </Suspense>
    </TaskCompletionDetailSheet>
  );
};

const Wrapper: React.FC<{
  sweepstakesId: string;
  taskId: string;
  slug: string;
}> = async ({ sweepstakesId, taskId, slug }) => {
  const details = await getSweepstakeEntry({
    sweepstakesId,
    slug,
    taskId
  });
  const status = await getSweepstakesStatus({ id: sweepstakesId });

  if (!details.ok) {
    return <div>Failed to load sweepstakes entry: {details.data.message}</div>;
  }

  if (!status.ok) {
    return <div>Failed to load sweepstakes status: {status.data.message}</div>;
  }

  return (
    <TaskCompletionDetailSheetContent
      entries={details.data}
      sweepstakesId={sweepstakesId}
      readOnly={!EDITABLE_DERIVED_STATUS[status.data.status]}
    />
  );
};

export default Page;
