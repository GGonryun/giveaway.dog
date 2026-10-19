import 'server-only';

import { ApplicationError } from '@giveaway/util-errors';
import { DEFAULT_ALLOWED_IDENTITIES } from '@giveaway/app-config/settings';
import { PrismaClient, VisibilityType } from '@giveaway/db-model';
import {
  toUserSchema,
  USER_SCHEMA_SELECT_QUERY
} from '@giveaway/user-model/user';
import { doesUserHaveAllowedIdentity } from '@giveaway/integration-model/providers';
import {
  isFormFilled,
  toParticipantForm,
  toParticipantFormFields
} from '@giveaway/participant-model/participant';
import { toParticipantFormValues } from '@giveaway/participant-model/db';
import { isInAllowedRegion } from '@giveaway/participant-model/sweepstakes';

const DEFAULT_AUDIENCE = {
  allowedIdentities: DEFAULT_ALLOWED_IDENTITIES,
  formFields: [],
  regionalRestriction: null
};

export type ValidateAudienceArgs = {
  sweepstakesId: string;
  userId: string;
};

export const validateAudience = async (
  db: PrismaClient,
  { sweepstakesId, userId }: ValidateAudienceArgs
) => {
  const [sweepstakes, user, participant] = await Promise.all([
    db.sweepstakes.findUnique({
      where: { id: sweepstakesId },
      select: {
        teamId: true,
        visibility: { select: { visibility: true } },
        audience: {
          include: { formFields: true, regionalRestriction: true }
        }
      }
    }),
    db.user.findUnique({
      where: { id: userId },
      select: USER_SCHEMA_SELECT_QUERY
    }),
    db.sweepstakesParticipant.findUnique({
      where: { userId_sweepstakesId: { userId, sweepstakesId } },
      select: { formValues: true }
    })
  ]);

  if (!sweepstakes || !user) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message:
        'Giveaway not found. Refresh the page and try again, or contact support if the error persists.'
    });
  }

  if (sweepstakes.visibility?.visibility === VisibilityType.PRIVATE) {
    await validateMembership(db, { teamId: sweepstakes.teamId, userId });
  }

  const audience = sweepstakes.audience ?? DEFAULT_AUDIENCE;
  const profile = toUserSchema(user);

  if (!doesUserHaveAllowedIdentity(profile, audience.allowedIdentities)) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message:
        'Connect one of the accounts that this giveaway accepts to enter it.'
    });
  }

  const formFields = toParticipantFormFields(audience.formFields);
  const isFilled = participant
    ? isFormFilled(
        formFields,
        profile,
        toParticipantFormValues(participant.formValues)
      )
    : toParticipantForm(formFields, profile).every(
        (field) => field.value !== null
      );

  if (!isFilled) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'Complete your profile to enter this giveaway.'
    });
  }

  const restriction = audience.regionalRestriction;
  if (
    restriction &&
    !isInAllowedRegion(
      { regions: restriction.regions, filter: restriction.filter ?? 'INCLUDE' },
      profile.countryCode
    )
  ) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'You are not eligible to participate in this giveaway.'
    });
  }
};

const validateMembership = async (
  db: PrismaClient,
  { teamId, userId }: { teamId: string | null; userId: string }
) => {
  const membership = teamId
    ? await db.membership.findUnique({
        where: { userId_teamId: { userId, teamId } },
        select: { id: true }
      })
    : null;

  if (!membership) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message:
        'Giveaway not found. Refresh the page and try again, or contact support if the error persists.'
    });
  }
};
