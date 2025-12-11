import { DeepNullable } from '@/lib/types';
import { ParticipantSweepstakesGetPayload } from './db';
import { GiveawayPrizeSchema } from './schemas';
import z from 'zod';
import { toUserSchema } from '../user';
import { toTaskInput } from './input';
import { CompletionStatus, Prisma, TaskType, UserSource } from '@prisma/client';
import { ApplicationError } from '@/lib/errors';
import { taskSchema } from '@/lib/task/schemas';
import { providerSchema } from '@/lib/integrations/schemas/providers';
import { DEFAULT_TEAM_LOGO } from '@/lib/team/data';
import { parseSocialLinks } from '../social-links';
import { DetailedUserTeam } from '../teams';

export const taskCompletionSchema = z.object({
  completionId: z.string(),
  completedAt: z.date().nullable(),
  taskId: z.string(),
  taskName: z.string(),
  taskType: z.nativeEnum(TaskType),
  sweepstakeId: z.string(),
  sweepstakeName: z.string(),
  status: z.nativeEnum(CompletionStatus)
});
export type TaskCompletionSchema = z.infer<typeof taskCompletionSchema>;

export const winnerSchema = z.object({
  prizeId: z.string(),
  prizeName: z.string().nullable()
});

export const userStatusSchema = z.enum(['active', 'blocked']);

export type UserStatusSchema = z.infer<typeof userStatusSchema>;

export const sweepstakesParticipantSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  country: z.string(),
  entries: taskCompletionSchema.array(),
  lastEntryAt: z.string(),
  qualityScore: z.number(),
  engagement: z.number(),
  source: z.nativeEnum(UserSource),
  status: userStatusSchema,
  userAgent: z.string(),
  emailVerified: z.boolean(),
  providers: providerSchema.array()
});

export type SweepstakesParticipantSchema = z.infer<
  typeof sweepstakesParticipantSchema
>;

export const toSweepstakesPrizes = (
  prizes: ParticipantSweepstakesGetPayload['prizes']
): DeepNullable<GiveawayPrizeSchema>[] => {
  return prizes.map((p) => ({
    prizeId: p.id,
    prizeName: p.name ?? null,
    quota: p.quota,
    draws: toPrizeDraws(p.draws)
  }));
};

const toPrizeDraws = (
  draws: ParticipantSweepstakesGetPayload['prizes'][number]['draws']
): GiveawayPrizeSchema['draws'] => {
  return draws.map((draw) => {
    const raw = toTaskInput(draw.taskCompletion.task);
    const task = taskSchema.safeParse(raw);

    if (!task.success) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: `Invalid task data for task ID ${draw.taskCompletion.task.id}`,
        cause: task.error
      });
    }

    return {
      id: draw.id,
      result: draw.result,
      disqualificationReason: draw.disqualificationReason,
      createdAt: draw.createdAt,
      updatedAt: draw.updatedAt,
      user: toUserSchema(draw.taskCompletion.participant.user),
      task: task.data
    };
  });
};

export const toSweepstakesHost = (
  team: Prisma.TeamGetPayload<{}> | DetailedUserTeam
) => {
  return {
    id: team.id,
    slug: team.slug,
    name: team.name,
    logo: team.logo || DEFAULT_TEAM_LOGO,
    links: parseSocialLinks(team.links)
  };
};
