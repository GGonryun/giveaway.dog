import type { FieldErrors, Resolver } from 'react-hook-form';
import type { GiveawayFormSchema } from '@giveaway/sweepstakes-model/schemas';
import verifySlug from '@giveaway/sweepstakes-editor-server/verify-slug';

export const slugTakenMessage = (slug: string) =>
  `The slug "${slug}" is already taken. Please choose another one.`;

export type SlugAvailability = {
  verify: (slug: string | null | undefined) => Promise<void>;
  resolver: (
    resolver: Resolver<GiveawayFormSchema>
  ) => Resolver<GiveawayFormSchema>;
};

export const slugAvailability = (sweepstakesId: string): SlugAvailability => {
  const taken = new Set<string>();

  const verify = async (slug: string | null | undefined) => {
    if (!slug) return;

    let result: Awaited<ReturnType<typeof verifySlug>>;
    try {
      result = await verifySlug({ slug, currentSweepstakesId: sweepstakesId });
    } catch {
      return;
    }
    if (!result.ok) return;

    if (result.data.available) {
      taken.delete(slug);
    } else {
      taken.add(slug);
    }
  };

  const resolver =
    (resolve: Resolver<GiveawayFormSchema>): Resolver<GiveawayFormSchema> =>
    async (values, context, options) => {
      const result = await resolve(values, context, options);
      const { slug } = values.visibility;
      const errors: FieldErrors<GiveawayFormSchema> = result.errors;

      if (!slug || !taken.has(slug) || errors.visibility?.slug) {
        return result;
      }

      return {
        values: {},
        errors: {
          ...errors,
          visibility: {
            ...errors.visibility,
            slug: { type: 'validate', message: slugTakenMessage(slug) }
          }
        }
      };
    };

  return { verify, resolver };
};
