import { TWITTER_POST_URL } from '@/lib/settings';
import { AuditLog, AuditLogMetadataSchema } from '../schemas/audit-log';
import { PickerDataSchema } from '../schemas/data';
import { PickerUnvalidatedFormSchema } from '../schemas/form';
import { PickerJobSchema } from '../schemas/jobs';
import { PickerStatus } from '../schemas/status';

export const DEFAULT_PICKER_NAME = 'New Picker';
export const DEFAULT_PICKER_STATUS: PickerStatus = 'DRAFT';
export const DEFAULT_PICKER_CONFIG: Omit<PickerUnvalidatedFormSchema, 'id'> = {
  setup: {
    postUrl: TWITTER_POST_URL,
    name: DEFAULT_PICKER_NAME
  },
  winners: {
    quota: 1
  },
  actions: {
    like: true,
    retweet: true,
    quote: false
  },
  filters: {
    minimumPostCount: null,
    minimumAccountAgeDays: null,
    minimumFollowers: null,
    minimumFollowing: null
  },
  requirements: {
    hasProfileImage: false,
    hasBanner: false,
    hasLocation: false,
    hasDescription: false
  }
};
export const DEFAULT_PICKER_DATA: PickerDataSchema = {
  type: 'TWITTER',
  tweetId: '',
  users: [],
  actions: [],
  winners: []
};

export const DEFAULT_PICKER_JOB: PickerJobSchema = {
  type: 'TWITTER_SYNC',
  lastRunAt: null,
  nextRunAt: null,
  tweetId: '',
  actions: [],
  error: null
};

export const DEFAULT_PICKER_LOGS = (
  metadata: AuditLogMetadataSchema
): AuditLog[] => [
  {
    action: 'picker_created',
    createdAt: new Date(),
    metadata
  }
];
