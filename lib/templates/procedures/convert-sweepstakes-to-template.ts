'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { ApplicationError } from '@/lib/errors';
import { findUserSweepstakesQuery } from '@/procedures/sweepstakes/shared';
import { FORM_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { toSweepstakesInput } from '@/schemas/giveaway/input';
import { DEFAULT_TEMPLATE_IMAGE, DEFAULT_TEMPLATE_NAME } from '../defaults';

export const convertSweepstakesToTemplate = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      id: z.string(),
      slug: z.string()
    })
  )
  .output(z.object({ id: z.string() }))
  .handler(async ({ db, input, user }) => {
    const team = await db.team.findUnique({
      where: {
        slug: input.slug,
        members: {
          some: { userId: user.id }
        }
      }
    });

    if (!team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Team not found or you do not have access.'
      });
    }

    const sweepstakes = await db.sweepstakes.findUnique({
      where: findUserSweepstakesQuery({
        id: input.id,
        userId: user.id
      }),
      include: FORM_SWEEPSTAKES_PAYLOAD
    });

    if (!sweepstakes) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Sweepstakes with ID ${input.id} not found`
      });
    }

    const parsed = toSweepstakesInput(sweepstakes);

    // Create template in storage format (nested content)
    const template = await db.template.create({
      data: {
        name: parsed.setup?.name
          ? `${parsed.setup?.name ?? DEFAULT_TEMPLATE_NAME} Template`
          : DEFAULT_TEMPLATE_NAME,
        description: parsed.setup?.description ?? '',
        image: parsed.setup?.banner || DEFAULT_TEMPLATE_IMAGE,
        type: 'SWEEPSTAKES',
        content: {
          setup: parsed.setup,
          audience: parsed.audience,
          tasks: parsed.tasks,
          design: parsed.design,
          criteria: parsed.criteria,
          terms: parsed.terms,
          prizes: parsed.prizes
        },
        teamId: team.id,
        createdById: user.id
      }
    });

    return { id: template.id };
  });
