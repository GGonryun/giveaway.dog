'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { z } from 'zod';
import { datetime } from '@giveaway/util-time/date';

const hostSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string()
});

const getBrowseHosts = procedure()
  .authorization({
    required: false
  })
  .output(hostSchema.array())
  .cache(() => ({
    keyParts: ['browse-hosts'],
    tags: ['browse-hosts'],
    revalidate: 300
  }))
  .handler(async ({ db }) => {
    const now = new Date();
    const daysFromNow = datetime.daysFromNow(1);
    const daysAgo = datetime.daysAgo(1);

    const sweepstakes = await db.sweepstakes.findMany({
      where: {
        status: 'ACTIVE',
        visibility: { visibility: 'PUBLIC' },
        OR: [
          {
            timing: {
              startDate: {
                lte: now
              },
              endDate: {
                gte: daysAgo
              }
            }
          },
          {
            timing: {
              startDate: {
                gt: now,
                lte: daysFromNow
              }
            }
          }
        ]
      },
      include: {
        team: true
      }
    });

    const uniqueHosts = new Map<
      string,
      { id: string; name: string; slug: string }
    >();

    for (const s of sweepstakes) {
      if (s.team && !uniqueHosts.has(s.team.id)) {
        uniqueHosts.set(s.team.id, {
          id: s.team.id,
          name: s.team.name ?? 'Unknown',
          slug: s.team.slug ?? s.team.id
        });
      }
    }

    return Array.from(uniqueHosts.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  });

export default getBrowseHosts;
