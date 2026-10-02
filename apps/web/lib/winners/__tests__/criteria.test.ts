import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { getSweepstakesCriteria, sweepstakesCriteriaSchema } from '../criteria';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { buildCriteriaRow } from './fixtures-winners-model';

const validCriteria = {
  minQualityScore: 50,
  minTasksCompleted: 1,
  externalPlatforms: null
};

describe('sweepstakesCriteriaSchema', () => {
  it('defaults allowMultipleWins and allowUserSelection to false', () => {
    expect(sweepstakesCriteriaSchema.parse(validCriteria)).toEqual({
      ...validCriteria,
      allowMultipleWins: false,
      allowUserSelection: false
    });
  });

  it('keeps explicit boolean flags', () => {
    expect(
      sweepstakesCriteriaSchema.parse({
        ...validCriteria,
        allowMultipleWins: true,
        allowUserSelection: true
      })
    ).toMatchObject({ allowMultipleWins: true, allowUserSelection: true });
  });

  it('accepts zero for the minimum score and task count', () => {
    expect(
      sweepstakesCriteriaSchema.safeParse({
        ...validCriteria,
        minQualityScore: 0,
        minTasksCompleted: 0
      }).success
    ).toBe(true);
  });

  it('rejects a negative minimum quality score', () => {
    const result = sweepstakesCriteriaSchema.safeParse({
      ...validCriteria,
      minQualityScore: -1
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['minQualityScore']);
  });

  it('rejects a negative minimum task count', () => {
    const result = sweepstakesCriteriaSchema.safeParse({
      ...validCriteria,
      minTasksCompleted: -1
    });

    expect(result.error?.issues[0].path).toEqual(['minTasksCompleted']);
  });

  it('rejects null numeric thresholds', () => {
    const result = sweepstakesCriteriaSchema.safeParse({
      ...validCriteria,
      minQualityScore: null,
      minTasksCompleted: null
    });

    expect(result.error?.issues.map((i) => i.path[0])).toEqual([
      'minQualityScore',
      'minTasksCompleted'
    ]);
  });

  it('accepts a list of known user sources for external platforms', () => {
    expect(
      sweepstakesCriteriaSchema.parse({
        ...validCriteria,
        externalPlatforms: ['TWITTER_IMPORT', 'BLUESKY_IMPORT']
      }).externalPlatforms
    ).toEqual(['TWITTER_IMPORT', 'BLUESKY_IMPORT']);
  });

  it('accepts an empty external platform list', () => {
    expect(
      sweepstakesCriteriaSchema.parse({
        ...validCriteria,
        externalPlatforms: []
      }).externalPlatforms
    ).toEqual([]);
  });

  it('rejects an unknown user source', () => {
    const result = sweepstakesCriteriaSchema.safeParse({
      ...validCriteria,
      externalPlatforms: ['MYSPACE_IMPORT']
    });

    expect(result.error?.issues[0].path).toEqual(['externalPlatforms', 0]);
  });

  it('requires externalPlatforms to be present', () => {
    const result = sweepstakesCriteriaSchema.safeParse({
      minQualityScore: 0,
      minTasksCompleted: 0
    });

    expect(result.error?.issues[0].path).toEqual(['externalPlatforms']);
  });
});

describe('getSweepstakesCriteria', () => {
  const db = asPrismaClient();

  it('queries the sweepstakes including its criteria', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue({
      id: 'sw-1',
      criteria: buildCriteriaRow()
    });

    await getSweepstakesCriteria({ db, sweepstakesId: 'sw-1' });

    expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
      where: { id: 'sw-1' },
      include: { criteria: true }
    });
  });

  it('returns the parsed criteria without the row ids', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue({
      id: 'sw-1',
      criteria: buildCriteriaRow({
        minQualityScore: 40,
        minTasksCompleted: 2,
        allowMultipleWins: true,
        externalPlatforms: ['DISCORD_IMPORT']
      })
    });

    await expect(
      getSweepstakesCriteria({ db, sweepstakesId: 'sw-1' })
    ).resolves.toEqual({
      minQualityScore: 40,
      minTasksCompleted: 2,
      allowMultipleWins: true,
      allowUserSelection: false,
      externalPlatforms: ['DISCORD_IMPORT']
    });
  });

  it('throws NOT_FOUND when the sweepstakes does not exist', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

    const error = await getSweepstakesCriteria({
      db,
      sweepstakesId: 'missing'
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'NOT_FOUND',
      message: 'Sweepstakes criteria not found'
    });
  });

  it('throws NOT_FOUND when the sweepstakes has no criteria', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue({
      id: 'sw-1',
      criteria: null
    });

    await expect(
      getSweepstakesCriteria({ db, sweepstakesId: 'sw-1' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Sweepstakes criteria not found'
    });
  });

  it('throws a zod error when nullable database thresholds are null', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue({
      id: 'sw-1',
      criteria: buildCriteriaRow({ minQualityScore: null })
    });

    await expect(
      getSweepstakesCriteria({ db, sweepstakesId: 'sw-1' })
    ).rejects.toBeInstanceOf(ZodError);
  });
});
