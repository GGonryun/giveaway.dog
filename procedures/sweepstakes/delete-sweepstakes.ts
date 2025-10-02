'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';

const deleteSweepstakes = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      id: z.string()
    })
  )
  .output(
    z.object({
      slug: z.string()
    })
  )
  .invalidate(async ({ input, output }) => [
    `sweepstakes-list-${output.slug}`,
    `sweepstakes-${input.id}`
  ])
  .handler(async ({ input, db, user }) => {
    // TODO: when deleting a draft there may be extra resources such as images that need to get removed from vercel storage.
    const deleted = await db.sweepstakes.delete({
      where: {
        id: input.id,
        team: {
          members: {
            some: {
              userId: user.id
            }
          }
        }
      },
      select: {
        team: {
          select: {
            slug: true
          }
        }
      }
    });

    if (!deleted.team?.slug) {
      console.error('Failed to delete sweepstakes: Team slug is missing');
      throw new ApplicationError({
        message: 'Failed to delete sweepstakes',
        code: 'CONFLICT'
      });
    }

    return { slug: deleted.team.slug };
  });
export default deleteSweepstakes;
