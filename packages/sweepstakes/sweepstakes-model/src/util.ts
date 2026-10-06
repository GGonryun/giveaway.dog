import { Prisma } from '@giveaway/db-model';
import { environment } from '@giveaway/app-config/environment';

export const toSweepstakesSlug = (
  sweepstakes: Prisma.SweepstakesGetPayload<{
    select: { id: true; visibility: { select: { slug: true } } };
  }>
) => {
  return sweepstakes.visibility?.slug ?? sweepstakes.id;
};

export const toSweepstakesUrl = ({
  forcePath = false,
  sweepstakes
}: {
  sweepstakes: Prisma.SweepstakesGetPayload<{
    select: { id: true; visibility: { select: { slug: true } } };
  }>;
  forcePath?: boolean;
}) => {
  const slug = toSweepstakesSlug(sweepstakes);
  const base = forcePath ? 'https://giveaway.dog' : environment.appUrl();
  return `${base}/browse/${slug}`;
};
