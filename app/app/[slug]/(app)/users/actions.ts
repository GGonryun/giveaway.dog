'use server';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  region: string;
  entries: number;
  lastEntryAt: string;
  firstEntryAt: string;
  qualityScore: number;
  status: 'active' | 'flagged' | 'blocked' | 'trusted';
  engagement: number;
  source: string;
  deviceFingerprint: string;
  emailVerified: boolean;
  disposableEmail: boolean;
  tags: string[];
}

interface GetUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  statusFilter?: string;
  regionFilter?: string;
}

// Default values for server actions
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_SORT_FIELD = 'lastEntryAt';
const DEFAULT_SORT_DIRECTION = 'desc';
const DEFAULT_STATUS_FILTER = 'all';
const DEFAULT_REGION_FILTER = 'all';
