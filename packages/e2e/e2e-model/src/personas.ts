import { z } from 'zod';
import { Prisma, UserAccountType } from '@giveaway/db-model';

export const E2E_PERSONAS = [
  'host',
  'host2',
  'admin',
  'member',
  'guest',
  'blocked',
  'participant',
  'participant2',
  'newbie'
] as const;

export type E2ePersona = (typeof E2E_PERSONAS)[number];

export const e2ePersonaSchema = z.enum(E2E_PERSONAS);

export const E2E_NAMESPACE_PATTERN = /^[a-z0-9]{4,10}$/;

export const e2eNamespaceSchema = z.string().regex(E2E_NAMESPACE_PATTERN);

export const E2E_SHARED_HOST_EMAIL = 'e2e-host@example.com';

const E2E_EMAIL_PATTERN = /^e2e-[a-z0-9]+(-[a-z0-9]{4,10})?@example\.com$/;

const E2E_PERSONA_EMAIL_PATTERN =
  /^e2e-([a-z0-9]+)-([a-z0-9]{4,10})@example\.com$/;

export const toE2ePersonaEmail = (persona: E2ePersona, ns: string) =>
  `e2e-${persona}-${ns}@example.com`;

export const isE2eEmail = (email: string | null | undefined) =>
  !!email?.match(E2E_EMAIL_PATTERN);

export const toE2eNamespaceOfEmail = (email: string | null | undefined) =>
  email?.match(E2E_PERSONA_EMAIL_PATTERN)?.[2];

type E2ePersonaAttributes = {
  accountType: UserAccountType;
  onboarded: boolean;
};

export const E2E_PERSONA_ATTRIBUTES: Record<E2ePersona, E2ePersonaAttributes> =
  {
    host: { accountType: UserAccountType.HOST, onboarded: true },
    host2: { accountType: UserAccountType.HOST, onboarded: true },
    admin: { accountType: UserAccountType.HOST, onboarded: true },
    member: { accountType: UserAccountType.HOST, onboarded: true },
    guest: { accountType: UserAccountType.HOST, onboarded: true },
    blocked: { accountType: UserAccountType.HOST, onboarded: true },
    participant: { accountType: UserAccountType.PARTICIPANT, onboarded: true },
    participant2: {
      accountType: UserAccountType.PARTICIPANT,
      onboarded: true
    },
    newbie: { accountType: UserAccountType.PARTICIPANT, onboarded: false }
  };

export const toE2ePersonaUpsert = ({
  persona,
  ns,
  now
}: {
  persona: E2ePersona;
  ns: string;
  now: Date;
}): Prisma.UserUpsertArgs => {
  const email = toE2ePersonaEmail(persona, ns);
  const attributes = E2E_PERSONA_ATTRIBUTES[persona];
  const reset = attributes.onboarded ? {} : { username: null };

  return {
    where: { email },
    update: { ...attributes, ...reset },
    create: {
      email,
      emailVerified: now,
      name: `E2E ${persona}`,
      ...attributes
    }
  };
};
