import { procedure } from '@/lib/mrpc/procedures';
import { detailedUserTeamSchema, toDetailedUserTeam } from '@/schemas/teams';
import { TeamRole } from '@prisma/client';
import { redirect } from 'next/navigation';
import z from 'zod';

const getUserTeam = procedure
  .authorized()
  .input(
    z.object({
      slug: z.string()
    })
  )
  .output(detailedUserTeamSchema)
  .handler(async ({ db, user, input }) => {
    const team = await db.team.findFirst({
      where: {
        slug: input.slug,
        members: {
          some: {
            userId: user.id
          }
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        members: {
          select: { id: true, role: true, userId: true }
        }
      }
    });

    if (!team) {
      console.error(`User ${user.id} is not a member of team ${input.slug}`);
      redirect(`/app`);
    }

    const details = toDetailedUserTeam(user, team);
    if (details.role === TeamRole.BLOCKED) {
      console.error(`User ${user.id} is blocked from team ${team.slug}`);
      redirect(`/app`);
    }

    return details;
  });

export default getUserTeam;
