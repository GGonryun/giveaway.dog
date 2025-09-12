import { UserType } from '@prisma/client';

export const parseUserTypes = (userTypeParam: string | null): UserType[] => {
  if (!userTypeParam) return ['PARTICIPATE'];

  return userTypeParam
    .split(',')
    .map((type) => UserType[type as keyof typeof UserType]);
};
