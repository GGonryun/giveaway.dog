import {
  Prisma,
  PickerAuditLogType,
  PickerStatus,
  PickerJobType,
  PickerJobStatus
} from '@prisma/client';
import { PublishPickerInputSchema } from '../schemas/form';
import { ApplicationError } from '@/lib/errors';
import { compact } from 'lodash';
import { extractTweetId } from '@/lib/integrations/schemas/twitter';
import { toTwitterFetchRequest } from '../schemas/jobs';
import { timezone } from '@/lib/time';

export const publishPickerAuditLogs = (
  input: PublishPickerInputSchema
): Prisma.PickerAuditLogCreateManyInput[] => {
  return [
    {
      pickerId: input.pickerId,
      type: PickerAuditLogType.UPDATED,
      data: input.form
    },
    {
      pickerId: input.pickerId,
      type: PickerAuditLogType.PUBLISHED,
      data: { status: PickerStatus.PROCESSING }
    },
    {
      pickerId: input.pickerId,
      type: PickerAuditLogType.JOB_STARTED,
      data: { job: PickerJobType.FETCH_TWITTER_DATA }
    }
  ];
};

export const publishPickerJobs = ({
  pickerId,
  form
}: PublishPickerInputSchema): Prisma.PickerJobCreateInput => {
  if (!form.setup?.postUrl) {
    throw new ApplicationError({
      code: 'CONFLICT',
      message: 'Post URL is required to schedule a fetch_twitter_data job'
    });
  }

  if (!form.actions) {
    throw new ApplicationError({
      code: 'CONFLICT',
      message:
        'At least one action is required to schedule a fetch_twitter_data job'
    });
  }

  console.log(
    'Scheduling fetch_twitter_data job with form actions:',
    form.actions
  );
  const runAt =
    form.timing?.scheduledAt && form.timing?.timeZone
      ? timezone.localTime(form.timing.scheduledAt, form.timing.timeZone)
      : new Date();

  console.log('Scheduling fetch_twitter_data job at', runAt);

  return {
    picker: {
      connect: { id: pickerId }
    },
    type: PickerJobType.FETCH_TWITTER_DATA,
    status: PickerJobStatus.QUEUED,
    runAt,
    children: {
      createMany: {
        data: compact([
          form.actions.like && {
            pickerId,
            type: PickerJobType.FETCH_TWITTER_GET_LIKING_USERS,
            status: PickerJobStatus.QUEUED,
            runAt,
            data: toTwitterFetchRequest({
              tweetId: extractTweetId(form.setup.postUrl)
            })
          },
          form.actions.repost && {
            pickerId,
            type: PickerJobType.FETCH_TWITTER_GET_REPOSTED_BY,
            status: PickerJobStatus.QUEUED,
            runAt,
            data: toTwitterFetchRequest({
              tweetId: extractTweetId(form.setup.postUrl)
            })
          },
          form.actions.quote && {
            pickerId,
            type: PickerJobType.FETCH_TWITTER_GET_QUOTED_POSTS,
            status: PickerJobStatus.QUEUED,
            runAt: new Date(),
            data: toTwitterFetchRequest({
              tweetId: extractTweetId(form.setup.postUrl)
            })
          }
        ])
      }
    }
  };
};
