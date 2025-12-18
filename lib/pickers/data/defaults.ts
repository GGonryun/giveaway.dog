import { TWITTER_POST_URL } from '@/lib/settings';
import { AuditLogMetadataSchema } from '../schemas/audit-log';
import { PickerUnvalidatedFormSchema } from '../schemas/form';
import { PickerStatus } from '../schemas/status';
import { PickerDrawsSchema } from '../schemas/draws';
import {
  PickerAuditLogType,
  PickerJobStatus,
  PickerJobType,
  Prisma
} from '@prisma/client';

export const DEFAULT_PICKER_NAME = 'New Picker';
export const DEFAULT_PICKER_STATUS: PickerStatus = 'DRAFT';
export const DEFAULT_PICKER_FORM: Omit<PickerUnvalidatedFormSchema, 'id'> = {
  setup: {
    postUrl: TWITTER_POST_URL,
    name: DEFAULT_PICKER_NAME,
    integrationId: ''
  },
  timing: null,
  winners: {
    quota: 1
  },
  actions: {
    like: true,
    repost: true,
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

export const DEFAULT_PICKER_JOB: Prisma.PickerJobCreateWithoutPickerInput = {
  type: PickerJobType.FETCH_TWITTER_DATA,
  status: PickerJobStatus.QUEUED,
  runAt: null,
  data: {}
};

export const DEFAULT_PICKER_DRAWS: PickerDrawsSchema = {
  outcome: {
    totalDraws: 0,
    finalDraws: []
  },
  draws: []
};

export const DEFAULT_PICKER_LOG = (
  data: AuditLogMetadataSchema
): Prisma.PickerAuditLogCreateWithoutPickerInput => {
  return {
    type: PickerAuditLogType.CREATED,
    data: data ?? {}
  };
};

export const createPickerAuditLog = (
  type: PickerAuditLogType,
  data: AuditLogMetadataSchema = null
): Prisma.PickerAuditLogCreateWithoutPickerInput => {
  return {
    type,
    data: data ?? {}
  };
};

export const MOCK_PICKER_AUDIT_LOGS = (user: {
  id: string;
  name: string;
  email: string;
}): Prisma.PickerAuditLogCreateWithoutPickerInput[] => {
  return [
    {
      type: PickerAuditLogType.CREATED,
      data: { user },
      createdAt: new Date('2025-11-02T10:00:00Z')
    },
    {
      type: PickerAuditLogType.UPDATED,
      data: { user, changes: ['filters', 'requirements'] },
      createdAt: new Date('2025-11-02T10:20:00Z')
    },
    {
      type: PickerAuditLogType.UPDATED,
      data: { user, changes: ['winners.quota'] },
      createdAt: new Date('2025-11-02T10:30:00Z')
    },
    {
      type: PickerAuditLogType.PUBLISHED,
      data: { user },
      createdAt: new Date('2025-11-02T10:35:00Z')
    },
    {
      type: PickerAuditLogType.JOB_STARTED,
      data: { jobType: 'FETCH_TWITTER_DATA' },
      createdAt: new Date('2025-11-02T10:40:00Z')
    },
    {
      type: PickerAuditLogType.JOB_COMPLETED,
      data: { jobType: 'FETCH_TWITTER_DATA', entriesProcessed: 2147 },
      createdAt: new Date('2025-11-02T10:45:00Z')
    },
    {
      type: PickerAuditLogType.WINNER_DRAWN,
      data: { drawNumber: 1, totalWinners: 3 },
      createdAt: new Date('2025-11-02T11:30:00Z')
    },
    {
      type: PickerAuditLogType.WINNER_SELECTED,
      data: { user, winnerId: 'usr_123', position: 1 },
      createdAt: new Date('2025-11-02T11:35:00Z')
    },
    {
      type: PickerAuditLogType.WINNER_DRAWN,
      data: { drawNumber: 2, totalWinners: 3 },
      createdAt: new Date('2025-11-02T11:40:00Z')
    },
    {
      type: PickerAuditLogType.WINNER_SELECTED,
      data: { user, winnerId: 'usr_456', position: 2 },
      createdAt: new Date('2025-11-02T11:42:00Z')
    },
    {
      type: PickerAuditLogType.WINNER_DRAWN,
      data: { drawNumber: 3, totalWinners: 3 },
      createdAt: new Date('2025-11-02T11:45:00Z')
    },
    {
      type: PickerAuditLogType.WINNER_SELECTED,
      data: { user, winnerId: 'usr_789', position: 3 },
      createdAt: new Date('2025-11-02T11:48:00Z')
    },
    {
      type: PickerAuditLogType.COMPLETED,
      data: { user, totalWinners: 3 },
      createdAt: new Date('2025-11-02T11:50:00Z')
    }
  ];
};
