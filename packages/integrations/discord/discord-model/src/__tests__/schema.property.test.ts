import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ApplicationError } from '@giveaway/util-errors';
import { assertProperty } from '@giveaway/testing-server/property';
import {
  discordInteractionSchema,
  toDiscordInteraction,
  type DiscordInteractionSchema
} from '../schema';
import {
  applicationCommandInteraction,
  buttonInteraction,
  pingInteraction
} from '../testing/fixtures-discord-model';

type Json = ReturnType<typeof JSON.parse>;

const isRecord = (value: unknown): value is Record<string, Json> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mutate = (value: Json, depth = 0): fc.Arbitrary<Json> => {
  if (!isRecord(value) || depth > 3) {
    return fc.oneof(
      { weight: 30, arbitrary: fc.constant(value) },
      { weight: 1, arbitrary: fc.jsonValue({ maxDepth: 2 }) }
    );
  }

  const keys = Object.keys(value);
  const entries = keys.map(
    (key) =>
      [
        key,
        fc.oneof(
          { weight: 40, arbitrary: mutate(value[key], depth + 1) },
          { weight: 1, arbitrary: fc.constant(undefined) }
        )
      ] as const
  );

  return fc
    .tuple(
      fc.record(Object.fromEntries(entries)),
      fc.dictionary(
        fc.oneof(fc.constantFrom(...keys), fc.string({ maxLength: 10 })),
        fc.jsonValue({ maxDepth: 2 }),
        { maxKeys: 1 }
      )
    )
    .map(([kept, extra]) => {
      const result: Record<string, Json> = { ...kept, ...extra };
      for (const key of Object.keys(result)) {
        if (result[key] === undefined) delete result[key];
      }
      return result;
    });
};

const mutatedInteraction = fc.oneof(
  mutate(pingInteraction()),
  mutate(applicationCommandInteraction()),
  mutate(buttonInteraction())
);

const interactionLike = fc.oneof(fc.jsonValue(), mutatedInteraction);

const outcome = (data: unknown) => {
  const result = parse(data);
  return 'interaction' in result ? result : { failed: true };
};

type ParseResult =
  | { interaction: DiscordInteractionSchema }
  | { error: unknown };

const parse = (data: unknown): ParseResult => {
  try {
    return { interaction: toDiscordInteraction(data) };
  } catch (error) {
    return { error };
  }
};

const isHandled = (interaction: DiscordInteractionSchema) => {
  switch (interaction.type) {
    case 1:
      return typeof interaction.user.id === 'string';
    case 2:
      return typeof interaction.data.name === 'string';
    case 3:
      return (
        typeof interaction.data.custom_id === 'string' &&
        typeof interaction.message.id === 'string'
      );
    default:
      return false;
  }
};

describe('toDiscordInteraction properties', () => {
  it('[DISCORD-201] arbitrary JSON either fails with VALIDATION_ERROR or parses to an interaction the handler routes', () => {
    assertProperty(
      fc.property(interactionLike, (data) => {
        const result = parse(data);

        if ('interaction' in result) {
          expect(isHandled(result.interaction)).toBe(true);
        } else {
          expect(result.error).toBeInstanceOf(ApplicationError);
          expect(result.error).toMatchObject({ code: 'VALIDATION_ERROR' });
        }
      })
    );
  });

  it('[DISCORD-202] a parsed interaction parses again to the same value', () => {
    assertProperty(
      fc.property(mutatedInteraction, (data) => {
        const result = parse(data);
        fc.pre('interaction' in result);
        if (!('interaction' in result)) return;

        expect(discordInteractionSchema.parse(result.interaction)).toEqual(
          result.interaction
        );
      })
    );
  });

  it('[DISCORD-203] parsing does not depend on extra keys', () => {
    assertProperty(
      fc.property(
        interactionLike,
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 12 }),
          fc.jsonValue({ maxDepth: 2 }),
          { maxKeys: 3 }
        ),
        (data, extra) => {
          fc.pre(isRecord(data));
          const unknownKeys = Object.fromEntries(
            Object.entries(extra).filter(
              ([key]) =>
                !(key in discordInteractionSchema.options[0].shape) &&
                !(key in discordInteractionSchema.options[1].shape) &&
                !(key in discordInteractionSchema.options[2].shape)
            )
          );

          expect(outcome({ ...unknownKeys, ...data })).toEqual(outcome(data));
        }
      )
    );
  });
});
