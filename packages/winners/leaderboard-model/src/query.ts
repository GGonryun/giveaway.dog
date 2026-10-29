export type WinnersQuery = {
  page?: string;
  search?: string;
};

export type WinnersFilters = {
  page: number;
  search?: string;
};

const parsePage = (value?: string): number => {
  const page = /^\d+$/.test(String(value)) ? Number(value) : 1;
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
};

export const parseWinnersQuery = (query: WinnersQuery): WinnersFilters => ({
  page: parsePage(query.page),
  search: query.search
});
