import { Prisma, TeamRole } from '@prisma/client';
import z from 'zod';

export const selectUserDetails = {
  select: {
    id: true,
    name: true,
    slug: true,
    logo: true,
    members: {
      select: { id: true, role: true, userId: true }
    }
  }
} as const;

export const _validateSelectUserDetails: { select: Prisma.TeamSelect } =
  selectUserDetails;

export const toDetailedUserTeam = (
  user: { id: string },
  team: Prisma.TeamGetPayload<typeof selectUserDetails>
): DetailedUserTeam => {
  const role = team.members.find((m) => m.userId === user.id)?.role;
  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    logo: team.logo,
    memberCount: team.members.length,
    role: role || TeamRole.BLOCKED // Default to BLOCKED if no role found
  };
};

export const detailedUserTeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string(), // emoji
  memberCount: z.number().min(0),
  role: z.nativeEnum(TeamRole)
});

export type DetailedUserTeam = z.infer<typeof detailedUserTeamSchema>;

export const createTeamInputSchema = z.object({
  name: z
    .string()
    .min(5, 'Team name must be at least 5 characters')
    .max(20, 'Team name must be less than 20 characters')
    .trim(),
  slug: z
    .string()
    .min(5, 'Team slug must be at least 5 characters')
    .max(20, 'Team slug must be less than 20 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Team slug can only contain lowercase letters, numbers, and hyphens'
    )
    .trim(),
  logo: z.string().optional()
});

export type CreateTeamInput = z.infer<typeof createTeamInputSchema>;

export const participantEntrySchema = z.object({
  completedAt: z.date().nullable(),
  taskId: z.string(),
  name: z.string()
});
export type ParticipantEntrySchema = z.infer<typeof participantEntrySchema>;

export const participatingUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  country: z.string(),
  entries: participantEntrySchema.array(),
  lastEntryAt: z.string(),
  qualityScore: z.number(),
  engagement: z.number(),
  status: z.enum(['active', 'blocked']),
  userAgent: z.string(),
  emailVerified: z.boolean()
});

export type ParticipatingUserSchema = z.infer<typeof participatingUserSchema>;
