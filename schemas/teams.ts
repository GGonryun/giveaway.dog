import { TeamRole } from '@/lib/prisma';
import z from 'zod';

export const detailedUserTeamSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  logo: z.string(), // emoji
  memberCount: z.number().min(0),
  role: z.nativeEnum(TeamRole)
});

export type DetailedUserTeam = z.infer<typeof detailedUserTeamSchema>;

export const createTeamInputSchema = z.object({
  name: z
    .string()
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name must be less than 100 characters')
    .trim(),
  slug: z
    .string()
    .min(2, 'Team slug must be at least 2 characters')
    .max(100, 'Team slug must be less than 100 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Team slug can only contain lowercase letters, numbers, and hyphens'
    )
    .trim(),
  logo: z.string().optional()
});

export type CreateTeamInput = z.infer<typeof createTeamInputSchema>;
