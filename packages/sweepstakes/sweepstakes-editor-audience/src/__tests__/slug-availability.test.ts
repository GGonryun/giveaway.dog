import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Resolver } from 'react-hook-form';
import verifySlug from '@giveaway/sweepstakes-editor-server/verify-slug';
import type { GiveawayFormSchema } from '@giveaway/sweepstakes-model/schemas';
import { buildFormValues } from '@giveaway/sweepstakes-editor-setup/testing/form-harness';
import { slugAvailability, slugTakenMessage } from '../slug-availability';

vi.mock('@giveaway/sweepstakes-editor-server/verify-slug', () => ({
  default: vi.fn()
}));

type VerifySlugResult = Awaited<ReturnType<typeof verifySlug>>;

const mockedVerifySlug = vi.mocked(verifySlug);

const available = (value: boolean): VerifySlugResult => ({
  ok: true,
  data: { available: value }
});

const withSlug = (slug: string | null) =>
  buildFormValues({ visibility: { visibility: 'PUBLIC', slug } });

const options = {
  names: ['visibility.slug'],
  fields: {},
  shouldUseNativeValidation: false
} as Parameters<Resolver<GiveawayFormSchema>>[2];

const valid: Resolver<GiveawayFormSchema> = async (values) => ({
  values,
  errors: {}
});

const takenError = (slug: string) => ({
  type: 'validate',
  message: slugTakenMessage(slug)
});

describe('slugTakenMessage', () => {
  it('names the slug', () => {
    expect(slugTakenMessage('summer')).toBe(
      'The slug "summer" is already taken. Please choose another one.'
    );
  });
});

describe('slugAvailability', () => {
  beforeEach(() => {
    mockedVerifySlug.mockReset();
  });

  it('asks the server about the slug for the giveaway', async () => {
    mockedVerifySlug.mockResolvedValue(available(true));
    const slugs = slugAvailability('sweepstakes-1');

    await slugs.verify('summer');

    expect(mockedVerifySlug).toHaveBeenCalledWith({
      slug: 'summer',
      currentSweepstakesId: 'sweepstakes-1'
    });
  });

  it.each([null, undefined, ''])(
    'does not ask the server about the slug %j',
    async (slug) => {
      const slugs = slugAvailability('sweepstakes-1');

      await slugs.verify(slug);

      expect(mockedVerifySlug).not.toHaveBeenCalled();
    }
  );

  it('keeps the result of the base resolver for a free slug', async () => {
    mockedVerifySlug.mockResolvedValue(available(true));
    const slugs = slugAvailability('sweepstakes-1');
    const values = withSlug('summer');

    await slugs.verify('summer');

    await expect(
      slugs.resolver(valid)(values, undefined, options)
    ).resolves.toEqual({ values, errors: {} });
  });

  it('adds an error for a slug that another giveaway has', async () => {
    mockedVerifySlug.mockResolvedValue(available(false));
    const slugs = slugAvailability('sweepstakes-1');

    await slugs.verify('summer');

    await expect(
      slugs.resolver(valid)(withSlug('summer'), undefined, options)
    ).resolves.toEqual({
      values: {},
      errors: { visibility: { slug: takenError('summer') } }
    });
  });

  it('keeps the error on every later validation', async () => {
    mockedVerifySlug.mockResolvedValue(available(false));
    const slugs = slugAvailability('sweepstakes-1');
    const resolver = slugs.resolver(valid);

    await slugs.verify('summer');
    await resolver(withSlug('summer'), undefined, options);

    await expect(
      resolver(withSlug('summer'), undefined, options)
    ).resolves.toMatchObject({
      errors: { visibility: { slug: takenError('summer') } }
    });
    expect(mockedVerifySlug).toHaveBeenCalledTimes(1);
  });

  it('adds no error once the host picks another slug', async () => {
    mockedVerifySlug.mockResolvedValue(available(false));
    const slugs = slugAvailability('sweepstakes-1');
    const values = withSlug('winter');

    await slugs.verify('summer');

    await expect(
      slugs.resolver(valid)(values, undefined, options)
    ).resolves.toEqual({ values, errors: {} });
  });

  it('adds no error once the host turns the custom slug off', async () => {
    mockedVerifySlug.mockResolvedValue(available(false));
    const slugs = slugAvailability('sweepstakes-1');
    const values = withSlug(null);

    await slugs.verify('summer');

    await expect(
      slugs.resolver(valid)(values, undefined, options)
    ).resolves.toEqual({ values, errors: {} });
  });

  it('forgets a taken slug that becomes free', async () => {
    const slugs = slugAvailability('sweepstakes-1');
    const values = withSlug('summer');

    mockedVerifySlug.mockResolvedValueOnce(available(false));
    await slugs.verify('summer');
    mockedVerifySlug.mockResolvedValueOnce(available(true));
    await slugs.verify('summer');

    await expect(
      slugs.resolver(valid)(values, undefined, options)
    ).resolves.toEqual({ values, errors: {} });
  });

  it.each([
    [
      'refuses the request',
      () =>
        mockedVerifySlug.mockResolvedValueOnce({
          ok: false,
          data: { code: 'UNAUTHORIZED', message: 'Sign in' }
        } as VerifySlugResult)
    ],
    [
      'cannot be reached',
      () =>
        mockedVerifySlug.mockRejectedValueOnce(new TypeError('fetch failed'))
    ]
  ])('adds no error when the server %s', async (_, fail) => {
    const slugs = slugAvailability('sweepstakes-1');
    const values = withSlug('summer');

    fail();
    await expect(slugs.verify('summer')).resolves.toBeUndefined();

    await expect(
      slugs.resolver(valid)(values, undefined, options)
    ).resolves.toEqual({ values, errors: {} });
  });

  it('keeps the other errors of the base resolver', async () => {
    mockedVerifySlug.mockResolvedValue(available(false));
    const slugs = slugAvailability('sweepstakes-1');
    const invalid: Resolver<GiveawayFormSchema> = async () => ({
      values: {},
      errors: {
        setup: { name: { type: 'too_small', message: 'Too short' } },
        visibility: {
          visibility: { type: 'invalid_value', message: 'Pick one' }
        }
      }
    });

    await slugs.verify('summer');

    await expect(
      slugs.resolver(invalid)(withSlug('summer'), undefined, options)
    ).resolves.toEqual({
      values: {},
      errors: {
        setup: { name: { type: 'too_small', message: 'Too short' } },
        visibility: {
          visibility: { type: 'invalid_value', message: 'Pick one' },
          slug: takenError('summer')
        }
      }
    });
  });

  it('keeps the error of the base resolver on the slug', async () => {
    mockedVerifySlug.mockResolvedValue(available(false));
    const slugs = slugAvailability('sweepstakes-1');
    const slugError = {
      values: {},
      errors: {
        visibility: { slug: { type: 'invalid_format', message: 'Bad slug' } }
      }
    };

    await slugs.verify('summer');

    await expect(
      slugs.resolver(async () => slugError)(
        withSlug('summer'),
        undefined,
        options
      )
    ).resolves.toEqual(slugError);
  });

  it('passes the values, context and options to the base resolver', async () => {
    const base = vi.fn(valid);
    const slugs = slugAvailability('sweepstakes-1');
    const values = withSlug(null);

    await slugs.resolver(base)(values, { context: true }, options);

    expect(base).toHaveBeenCalledWith(values, { context: true }, options);
  });
});
