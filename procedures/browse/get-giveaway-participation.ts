import { procedure } from '@/lib/mrpc/procedures';
import { FULL_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { z } from 'zod';
import {
  GiveawayFormSchema,
  GiveawayHost,
  GiveawayParticipationData,
  GiveawayWinner,
  UserProfile,
  UserParticipation,
  GiveawayState
} from '@/schemas/giveaway/schemas';

const participationDataSchema = z.object({
  giveaway: z.any().describe('The giveaway data'), // Using any for now since GiveawayFormSchema is complex
  host: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    avatar: z.string()
  }),
  participation: z.object({
    id: z.string(),
    totalEntries: z.number()
  }),
  winners: z.array(z.any()),
  user: z
    .object({
      profile: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        avatar: z.string(),
        region: z.string(),
        age: z.number()
      }),
      participation: z.object({
        entries: z.number(),
        completedTasks: z.array(z.string())
      })
    })
    .optional(),
  state: z.enum([
    'not-logged-in',
    'profile-incomplete',
    'not-eligible',
    'winners-announced',
    'active'
  ])
});

const getGiveawayParticipation = procedure
  .authorization({
    required: false
  })
  .input(
    z.object({
      id: z.string()
    })
  )
  .output(participationDataSchema)
  .handler(async ({ input, db, user }) => {
    const sweepstakes = await db.sweepstakes.findUnique({
      where: {
        id: input.id,
        status: 'ACTIVE'
      },
      include: {
        ...FULL_SWEEPSTAKES_PAYLOAD,
        team: true
      }
    });

    if (!sweepstakes || !sweepstakes.team) {
      throw new Error('Sweepstakes not found or not active');
    }

    // Get user participation data if authenticated
    let userParticipation = null;
    if (user?.id) {
      // TODO: Implement actual entry tracking
      userParticipation = {
        entries: 0,
        completedTasks: []
      };
    }

    // Get user profile if authenticated
    let userProfile = null;
    if (user?.id) {
      userProfile = await db.user.findUnique({
        where: {
          id: user.id
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          region: true,
          age: true
        }
      });
    }

    // Determine participation state
    let state:
      | 'not-logged-in'
      | 'profile-incomplete'
      | 'not-eligible'
      | 'winners-announced'
      | 'active' = 'active';

    if (!user) {
      state = 'not-logged-in';
    } else if (userProfile && (!userProfile.region || !userProfile.age)) {
      state = 'profile-incomplete';
    } else if (
      sweepstakes.timing?.endDate &&
      sweepstakes.timing.endDate < new Date()
    ) {
      state = 'winners-announced';
    }
    // TODO: Add eligibility checks based on audience restrictions

    return {
      giveaway: {
        setup: {
          name: sweepstakes.details?.name || 'Untitled Sweepstakes',
          description: sweepstakes.details?.description || '',
          banner: sweepstakes.details?.banner
        },
        terms: sweepstakes.terms
          ? {
              type: sweepstakes.terms.type,
              text: sweepstakes.terms.text || ''
            }
          : {
              type: 'CUSTOM' as const,
              text: ''
            },
        timing: {
          startDate: sweepstakes.timing?.startDate || new Date(),
          endDate: sweepstakes.timing?.endDate || new Date(),
          timeZone: sweepstakes.timing?.timeZone || 'UTC'
        },
        audience: {
          requireEmail: sweepstakes.audience?.requireEmail ?? true,
          regionalRestriction: sweepstakes.audience?.regionalRestriction
            ? {
                regions: sweepstakes.audience.regionalRestriction.regions || [],
                filter: sweepstakes.audience.regionalRestriction.filter
              }
            : undefined,
          minimumAgeRestriction: sweepstakes.audience?.minimumAgeRestriction
            ? {
                format: sweepstakes.audience.minimumAgeRestriction.format,
                value: sweepstakes.audience.minimumAgeRestriction.value,
                label: sweepstakes.audience.minimumAgeRestriction.label || '',
                required: sweepstakes.audience.minimumAgeRestriction.required
              }
            : undefined
        },
        tasks: sweepstakes.tasks || [],
        prizes: sweepstakes.prizes || []
      },
      host: {
        id: sweepstakes.team.id,
        slug: sweepstakes.team.slug,
        name: sweepstakes.team.name,
        avatar: sweepstakes.team.logo || '🐶'
      },
      participation: {
        id: sweepstakes.id,
        totalEntries: 0 // TODO: Implement actual entry counting
      },
      winners: [], // TODO: Implement winners data
      user:
        user && userProfile && userParticipation
          ? {
              profile: {
                id: userProfile.id,
                name: userProfile.name || '',
                email: userProfile.email || '',
                avatar: userProfile.image || '',
                region: userProfile.region || '',
                age: userProfile.age || 0
              },
              participation: userParticipation
            }
          : undefined,
      state
    };
  });

export default getGiveawayParticipation;
