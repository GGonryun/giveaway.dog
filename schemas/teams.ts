import { Prisma, TeamRole, TeamTier } from '@prisma/client';
import z from 'zod';

export const GET_TEAM_SELECT = {
  select: {
    id: true,
    name: true,
    slug: true,
    logo: true,
    links: true,
    tier: true,
    members: {
      select: { id: true, role: true, userId: true }
    }
  }
} satisfies { select: Prisma.TeamSelect };

export const toDetailedUserTeam = (
  user: { id: string },
  team: Prisma.TeamGetPayload<typeof GET_TEAM_SELECT>
): DetailedUserTeam => {
  const role = team.members.find((m) => m.userId === user.id)?.role;
  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    logo: team.logo,
    links: team.links,
    tier: team.tier,
    memberCount: team.members.length,
    role: role || TeamRole.BLOCKED // Default to BLOCKED if no role found
  };
};

export const detailedUserTeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string(), // image URL
  links: z.any().optional(),
  memberCount: z.number().min(0),
  tier: z.nativeEnum(TeamTier),
  role: z.nativeEnum(TeamRole)
});

export type DetailedUserTeam = z.infer<typeof detailedUserTeamSchema>;

export const createTeamInputSchema = z.object({
  name: z
    .string()
    .min(3, 'Team name must be at least 3 characters')
    .max(20, 'Team name must be less than 20 characters')
    .trim(),
  slug: z
    .string()
    .min(3, 'Team slug must be at least 3 characters')
    .max(20, 'Team slug must be less than 20 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Team slug can only contain lowercase letters, numbers, and hyphens'
    )
    .trim(),
  logo: z.string().optional()
});

export type CreateTeamInput = z.infer<typeof createTeamInputSchema>;
