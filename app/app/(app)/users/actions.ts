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

interface GetUsersResponse {
  users: User[];
  totalUsers: number;
  totalPages: number;
}

const generateMockUser = (index: number): User => ({
  id: `user_${index + 1}`,
  name: `User ${index + 1}`,
  email: `user${index + 1}@example.com`,
  avatar: null,
  region: ['US', 'CA', 'UK', 'AU', 'DE'][index % 5],
  entries: Math.floor(Math.random() * 50) + 1,
  lastEntryAt: new Date(
    Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
  ).toISOString(),
  firstEntryAt: new Date(
    Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
  ).toISOString(),
  qualityScore: Math.floor(Math.random() * 40) + 60,
  status: (['active', 'flagged', 'blocked', 'trusted'] as const)[index % 4],
  engagement: Math.floor(Math.random() * 100),
  source: ['Instagram', 'Twitter', 'Direct', 'Facebook', 'Email'][index % 5],
  deviceFingerprint: `fp_${Math.random().toString(36).substr(2, 9)}`,
  emailVerified: Math.random() > 0.1,
  disposableEmail: Math.random() > 0.95,
  tags:
    index % 3 === 0
      ? ['VIP', 'High Value']
      : index % 5 === 0
        ? ['Suspicious']
        : []
});

export async function getUsers({
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  search = '',
  sortField = DEFAULT_SORT_FIELD,
  sortDirection = DEFAULT_SORT_DIRECTION,
  statusFilter = DEFAULT_STATUS_FILTER,
  regionFilter = DEFAULT_REGION_FILTER
}: GetUsersParams = {}): Promise<GetUsersResponse> {
  const totalUsers = 127459;
  let filteredTotal = totalUsers;

  if (search) {
    filteredTotal = Math.floor(totalUsers * 0.1);
  }

  if (statusFilter !== 'all') {
    filteredTotal = Math.floor(filteredTotal * 0.25);
  }

  if (regionFilter !== 'all') {
    filteredTotal = Math.floor(filteredTotal * 0.2);
  }

  const totalPages = Math.ceil(filteredTotal / pageSize);
  const startIndex = (page - 1) * pageSize;

  const users: User[] = [];
  for (let i = 0; i < pageSize && startIndex + i < filteredTotal; i++) {
    const user = generateMockUser(startIndex + i);

    if (
      search &&
      !user.name.toLowerCase().includes(search.toLowerCase()) &&
      !user.email.toLowerCase().includes(search.toLowerCase()) &&
      !user.id.toLowerCase().includes(search.toLowerCase())
    ) {
      continue;
    }

    if (statusFilter !== 'all' && user.status !== statusFilter) {
      continue;
    }

    if (regionFilter !== 'all' && user.region !== regionFilter) {
      continue;
    }

    users.push(user);
  }

  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    users,
    totalUsers: filteredTotal,
    totalPages
  };
}

export async function searchUsers(query: string): Promise<GetUsersResponse> {
  if (!query.trim()) {
    return getUsers(); // Use all defaults
  }

  return getUsers({
    search: query.trim()
    // All other parameters will use defaults
  });
}
