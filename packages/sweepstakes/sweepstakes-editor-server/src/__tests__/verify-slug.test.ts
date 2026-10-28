import { describe, it, expect } from 'vitest';
import verifySlugDefault, { verifySlug } from '../verify-slug';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

type Input = Parameters<typeof verifySlug>[0];

describe('verifySlug', () => {
  it('exports the same procedure as the default export', () => {
    expect(verifySlugDefault).toBe(verifySlug);
  });

  it('returns UNAUTHORIZED when signed out', async () => {
    const result = await verifySlug({ slug: 'summer' });

    expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
      'Invalid session'
    );
    expect(prismaMock.sweepstakesVisibility.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an empty slug', async () => {
    signIn();

    const result = await verifySlug({ slug: '' });

    expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
      /^Input validation failed: [\s\S]*"slug"/
    );
    expect(prismaMock.sweepstakesVisibility.findFirst).not.toHaveBeenCalled();
  });

  it('rejects a non string current sweepstakes id', async () => {
    signIn();

    const result = await verifySlug({
      slug: 'summer',
      currentSweepstakesId: 5
    } as unknown as Input);

    expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
      /^Input validation failed: [\s\S]*"currentSweepstakesId"/
    );
  });

  it('looks up the slug selecting only the owning sweepstakes id', async () => {
    signIn();
    prismaMock.sweepstakesVisibility.findFirst.mockResolvedValue(null);

    await verifySlug({ slug: 'summer' });

    expect(prismaMock.sweepstakesVisibility.findFirst).toHaveBeenCalledWith({
      where: { slug: 'summer' },
      select: { sweepstakesId: true }
    });
  });

  it('looks up a sweepstakes whose id is the slug selecting only its id', async () => {
    signIn();
    prismaMock.sweepstakesVisibility.findFirst.mockResolvedValue(null);

    await verifySlug({ slug: 'abc123' });

    expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
      where: { id: 'abc123' },
      select: { id: true }
    });
  });

  it('reports the slug taken when it is the id of another sweepstakes', async () => {
    signIn();
    prismaMock.sweepstakesVisibility.findFirst.mockResolvedValue(null);
    prismaMock.sweepstakes.findUnique.mockResolvedValue({ id: 'abc123' });

    const result = await verifySlug({
      slug: 'abc123',
      currentSweepstakesId: 'sweep-1'
    });

    expect(expectOk(result)).toEqual({ available: false });
  });

  it('reports the slug taken when it is the id of a sweepstakes and no current sweepstakes is given', async () => {
    signIn();
    prismaMock.sweepstakesVisibility.findFirst.mockResolvedValue(null);
    prismaMock.sweepstakes.findUnique.mockResolvedValue({ id: 'abc123' });

    const result = await verifySlug({ slug: 'abc123' });

    expect(expectOk(result)).toEqual({ available: false });
  });

  it('reports the slug available when it is the id of the current sweepstakes', async () => {
    signIn();
    prismaMock.sweepstakesVisibility.findFirst.mockResolvedValue(null);
    prismaMock.sweepstakes.findUnique.mockResolvedValue({ id: 'sweep-1' });

    const result = await verifySlug({
      slug: 'sweep-1',
      currentSweepstakesId: 'sweep-1'
    });

    expect(expectOk(result)).toEqual({ available: true });
  });

  it('reports the slug taken when the current sweepstakes uses it but it is the id of another sweepstakes', async () => {
    signIn();
    prismaMock.sweepstakesVisibility.findFirst.mockResolvedValue({
      sweepstakesId: 'sweep-1'
    });
    prismaMock.sweepstakes.findUnique.mockResolvedValue({ id: 'abc123' });

    const result = await verifySlug({
      slug: 'abc123',
      currentSweepstakesId: 'sweep-1'
    });

    expect(expectOk(result)).toEqual({ available: false });
  });

  it('reports the slug available when nobody uses it', async () => {
    signIn();
    prismaMock.sweepstakesVisibility.findFirst.mockResolvedValue(null);

    const result = await verifySlug({ slug: 'summer' });

    expect(expectOk(result)).toEqual({ available: true });
  });

  it('reports the slug available when it belongs to the current sweepstakes', async () => {
    signIn();
    prismaMock.sweepstakesVisibility.findFirst.mockResolvedValue({
      sweepstakesId: 'sweep-1'
    });

    const result = await verifySlug({
      slug: 'summer',
      currentSweepstakesId: 'sweep-1'
    });

    expect(expectOk(result)).toEqual({ available: true });
  });

  it('reports the slug taken when it belongs to another sweepstakes', async () => {
    signIn();
    prismaMock.sweepstakesVisibility.findFirst.mockResolvedValue({
      sweepstakesId: 'sweep-2'
    });

    const result = await verifySlug({
      slug: 'summer',
      currentSweepstakesId: 'sweep-1'
    });

    expect(expectOk(result)).toEqual({ available: false });
  });

  it('reports the slug taken when no current sweepstakes is given', async () => {
    signIn();
    prismaMock.sweepstakesVisibility.findFirst.mockResolvedValue({
      sweepstakesId: 'sweep-2'
    });

    const result = await verifySlug({ slug: 'summer' });

    expect(expectOk(result)).toEqual({ available: false });
  });

  it('reports the slug taken when the current sweepstakes id is empty', async () => {
    signIn();
    prismaMock.sweepstakesVisibility.findFirst.mockResolvedValue({
      sweepstakesId: ''
    });

    const result = await verifySlug({
      slug: 'summer',
      currentSweepstakesId: ''
    });

    expect(expectOk(result)).toEqual({ available: false });
  });

  it('matches slugs exactly as provided without normalising case', async () => {
    signIn();
    prismaMock.sweepstakesVisibility.findFirst.mockResolvedValue(null);

    await verifySlug({ slug: 'Summer-Sale' });

    expect(
      prismaMock.sweepstakesVisibility.findFirst.mock.calls[0][0].where
    ).toEqual({ slug: 'Summer-Sale' });
  });
});
