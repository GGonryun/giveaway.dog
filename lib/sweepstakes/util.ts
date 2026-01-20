import { Prisma } from '@prisma/client';

export const toSweepstakesSlug = (
  sweepstakes: Prisma.SweepstakesGetPayload<{
    select: { id: true; visibility: { select: { slug: true } } };
  }>
) => {
  return sweepstakes.visibility?.slug ?? sweepstakes.id;
};

export const toSweepstakesUrl = (
  sweepstakes: Prisma.SweepstakesGetPayload<{
    select: { id: true; visibility: { select: { slug: true } } };
  }>
) => {
  const slug = toSweepstakesSlug(sweepstakes);
  return `${process.env.NEXT_PUBLIC_APP_URL}/browse/${slug}`;
};
