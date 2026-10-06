import { UserSource } from '@giveaway/db-model';
import {
  teamParticipantsSortBySchema,
  teamParticipantsSortDirectionSchema
} from '@giveaway/participant-model/schemas';

type SearchParamValue = string | string[] | undefined;

export type UsersSearchParams = {
  page?: SearchParamValue;
  pageSize?: SearchParamValue;
  search?: SearchParamValue;
  sources?: SearchParamValue;
  minQualityScore?: SearchParamValue;
  maxQualityScore?: SearchParamValue;
  sortBy?: SearchParamValue;
  sortDirection?: SearchParamValue;
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

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const MAX_QUALITY_SCORE = 100;

const USER_SOURCES = new Set<string>(Object.values(UserSource));

const firstValue = (value: SearchParamValue): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const parseIntegerInRange = (
  value: SearchParamValue,
  min: number,
  max: number
): number | undefined => {
  const raw = firstValue(value);
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return undefined;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max
    ? parsed
    : undefined;
};

const isUserSource = (value: string): value is UserSource =>
  USER_SOURCES.has(value);

const parseSources = (value: SearchParamValue): UserSource[] | undefined => {
  const raw = firstValue(value);
  if (typeof raw !== 'string') return undefined;
  const sources = [...new Set(raw.split(',').filter(isUserSource))];
  return sources.length > 0 ? sources : undefined;
};

const parseSearch = (value: SearchParamValue): string | undefined => {
  const raw = firstValue(value);
  return typeof raw === 'string' && raw !== '' ? raw : undefined;
};

export function parseUsersSearchParams(
  searchParams: UsersSearchParams
): ParsedUsersParams {
  const sortBy = teamParticipantsSortBySchema.safeParse(
    firstValue(searchParams.sortBy)
  );
  const sortDirection = teamParticipantsSortDirectionSchema.safeParse(
    firstValue(searchParams.sortDirection)
  );

  return {
    page:
      parseIntegerInRange(searchParams.page, 1, Number.MAX_SAFE_INTEGER) ??
      DEFAULT_PAGE,
    pageSize:
      parseIntegerInRange(searchParams.pageSize, 1, MAX_PAGE_SIZE) ??
      DEFAULT_PAGE_SIZE,
    search: parseSearch(searchParams.search),
    sources: parseSources(searchParams.sources),
    minQualityScore: parseIntegerInRange(
      searchParams.minQualityScore,
      0,
      MAX_QUALITY_SCORE
    ),
    maxQualityScore: parseIntegerInRange(
      searchParams.maxQualityScore,
      0,
      MAX_QUALITY_SCORE
    ),
    sortBy: sortBy.success ? sortBy.data : 'lastEntry',
    sortDirection: sortDirection.success ? sortDirection.data : 'desc'
  };
}
