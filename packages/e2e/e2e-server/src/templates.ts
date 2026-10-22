import 'server-only';

import { PrismaClient } from '@giveaway/db-model';
import { E2eTemplatesRequest } from '@giveaway/e2e-model/extras';
import {
  DEFAULT_TEMPLATE_CONTENT,
  DEFAULT_TEMPLATE_DESCRIPTION
} from '@giveaway/templates-model/defaults';
import { toStorableTemplateSchema } from '@giveaway/templates-model/schemas/template';
import { nanoid } from 'nanoid';
import { findE2eTeam, findE2eTeamOwner } from './ownership';

export const E2E_TEMPLATE_IMAGE = '/logo.png';

export const seedE2eTemplates = async ({
  db,
  request
}: {
  db: PrismaClient;
  request: E2eTemplatesRequest;
}) => {
  const team = await findE2eTeam(db, request.team);
  const owner = findE2eTeamOwner(team);
  const defaults = DEFAULT_TEMPLATE_CONTENT({ sponsorName: team.name });

  const templates = await db.$transaction(
    request.templates.map((template) => {
      const storable = toStorableTemplateSchema({
        ...defaults,
        template: {
          name: template.name,
          description: template.description ?? DEFAULT_TEMPLATE_DESCRIPTION,
          image: E2E_TEMPLATE_IMAGE
        }
      });
      return db.template.create({
        data: {
          id: nanoid(6),
          name: storable.name,
          description: storable.description,
          image: storable.image,
          content: storable.content,
          teamId: team.id,
          createdById: owner.id
        },
        select: { id: true, name: true }
      });
    })
  );

  return { team: team.slug, templates };
};
