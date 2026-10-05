import { UserSource } from '@giveaway/db-model';

export type UsersSearchParams = {
  page?: string;
  pageSize?: string;
  search?: string;
  sources?: string;
  minQualityScore?: string;
  maxQualityScore?: string;
  sortBy?: 'lastEntry' | 'qualityScore' | 'name';
  sortDirection?: 'asc' | 'desc';
};

export type ParsedUsersParams = {
  page: number;
  pageSize: number;
  search?: string;
  sources?: UserSource[];
  minQualityScore?: number;
  maxQualityScore?: number;
  sortBy: 'lastEntry' | 'qualityScore' | 'name';
  sortDirection: 'asc' | 'desc';
};

export function parseUsersSearchParams(
  searchParams: UsersSearchParams
): ParsedUsersParams {
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const pageSize = searchParams.pageSize ? parseInt(searchParams.pageSize) : 50;
  const search = searchParams.search;
  const sources = searchParams.sources
    ? (searchParams.sources.split(',') as UserSource[])
    : undefined;
  const minQualityScore = searchParams.minQualityScore
    ? parseInt(searchParams.minQualityScore)
    : undefined;
  const maxQualityScore = searchParams.maxQualityScore
    ? parseInt(searchParams.maxQualityScore)
    : undefined;
  const sortBy = searchParams.sortBy || 'lastEntry';
  const sortDirection = searchParams.sortDirection || 'desc';

  return {
    page,
    pageSize,
    search,
    sources,
    minQualityScore,
    maxQualityScore,
    sortBy,
    sortDirection
  };
}
