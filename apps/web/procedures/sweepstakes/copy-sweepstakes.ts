'use server';

import { nanoid } from 'nanoid';
import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { findUserSweepstakesQuery } from './shared';
import { findUserTeam } from '@giveaway/team-server/find-user-team';
import { FORM_SWEEPSTAKES_PAYLOAD } from '@giveaway/sweepstakes-model/db';
import { Prisma, TeamTier } from '@prisma/client';
import { TeamPermission } from '@giveaway/team-permissions';

const copySweepstakes = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      id: z.string()
    })
  )
  .output(
    z.object({
      id: z.string(),
      slug: z.string()
    })
  )
  .handler(async ({ db, input, user }) => {
    const original = await db.sweepstakes.findUnique({
      where: findUserSweepstakesQuery({
        id: input.id,
        userId: user.id
      }),
      include: FORM_SWEEPSTAKES_PAYLOAD
    });

    if (!original) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Sweepstakes not found or you do not have access to it.'
      });
    }

    if (!original.teamId) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Sweepstakes team data is missing.'
      });
    }

    const { team } = await findUserTeam({
      db,
      user,
      id: original.teamId,
      permission: TeamPermission.UPDATE_SWEEPSTAKES,
      tier: TeamTier.FREE
    });

    const newId = nanoid(6);

    const copied = await db.sweepstakes.create({
      data: {
        id: newId,
        teamId: original.teamId,
        status: 'DRAFT',
        details: original.details
          ? {
              create: {
                name: original.details.name
                  ? `${original.details.name} (Copy)`
                  : null,
                description: original.details.description,
                banner: original.details.banner
              }
            }
          : undefined,
        timing: original.timing
          ? {
              create: {
                startDate: original.timing.startDate,
                endDate: original.timing.endDate,
                timeZone: original.timing.timeZone
              }
            }
          : undefined,
        audience: original.audience
          ? {
              create: {
                requireEmail: original.audience.requireEmail,
                regionalRestriction: original.audience.regionalRestriction
                  ? {
                      create: {
                        filter: original.audience.regionalRestriction.filter,
                        regions: original.audience.regionalRestriction.regions
                      }
                    }
                  : undefined,
                minimumAgeRestriction: original.audience.minimumAgeRestriction
                  ? {
                      create: {
                        value: original.audience.minimumAgeRestriction.value,
                        label: original.audience.minimumAgeRestriction.label,
                        required:
                          original.audience.minimumAgeRestriction.required,
                        format: original.audience.minimumAgeRestriction.format
                      }
                    }
                  : undefined
              }
            }
          : undefined,
        terms: original.terms
          ? {
              create: {
                type: original.terms.type,
                sponsorName: original.terms.sponsorName,
                sponsorAddress: original.terms.sponsorAddress,
                winnerSelectionMethod: original.terms.winnerSelectionMethod,
                notificationTimeframeDays:
                  original.terms.notificationTimeframeDays,
                maxEntriesPerUser: original.terms.maxEntriesPerUser,
                claimDeadlineDays: original.terms.claimDeadlineDays,
                governingLawCountry: original.terms.governingLawCountry,
                privacyPolicyUrl: original.terms.privacyPolicyUrl,
                additionalTerms: original.terms.additionalTerms,
                text: original.terms.text
              }
            }
          : undefined,
        prizes: {
          createMany: {
            data: original.prizes.map((prize) => ({
              id: nanoid(6),
              name: prize.name,
              index: prize.index,
              quota: prize.quota
            }))
          }
        },
        tasks: {
          createMany: {
            data: original.tasks.map((task) => ({
              id: nanoid(6),
              index: task.index,
              config: task.config ?? Prisma.JsonNull
            }))
          }
        },
        design: original.design
          ? {
              create: {
                data: original.design.data ?? Prisma.JsonNull
              }
            }
          : undefined,
        visibility: {
          create: {
            visibility: 'PRIVATE',
            slug: null
          }
        },
        criteria: original.criteria
          ? {
              create: {
                minTasksCompleted: original.criteria.minTasksCompleted,
                minQualityScore: original.criteria.minQualityScore,
                allowMultipleWins: original.criteria.allowMultipleWins
              }
            }
          : undefined
      }
    });

    return {
      id: copied.id,
      slug: team.slug
    };
  });

export default copySweepstakes;
