import { describe, it, expect, beforeEach } from 'vitest';
import { disqualifyTwitterV2Winner } from '../disqualify-twitter-v2-winner';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { buildDraw } from './fixtures-pickers';

describe('disqualifyTwitterV2Winner', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without touching the database', async () => {
      const result = await disqualifyTwitterV2Winner({
        drawId: 'draw-1',
        reason: 'Bot account'
      });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.twitterPickerDraw.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('requires a non-empty reason', async () => {
      const result = await disqualifyTwitterV2Winner({
        drawId: 'draw-1',
        reason: ''
      });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Reason is required'
      );
      expect(prismaMock.twitterPickerDraw.findUnique).not.toHaveBeenCalled();
    });

    it('requires a draw id', async () => {
      const result = await disqualifyTwitterV2Winner({
        reason: 'Bot account'
      } as unknown as Parameters<typeof disqualifyTwitterV2Winner>[0]);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"drawId"/
      );
    });

    it('returns NOT_FOUND when the draw does not exist', async () => {
      prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(null);

      const result = await disqualifyTwitterV2Winner({
        drawId: 'missing',
        reason: 'Bot account'
      });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Draw not found');
      expect(prismaMock.twitterPickerDraw.update).not.toHaveBeenCalled();
    });

    it('looks the draw up by id', async () => {
      prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(buildDraw());

      await disqualifyTwitterV2Winner({
        drawId: 'draw-42',
        reason: 'Bot account'
      });

      expect(prismaMock.twitterPickerDraw.findUnique).toHaveBeenCalledWith({
        where: { id: 'draw-42' }
      });
    });

    it('stores the reason on the draw', async () => {
      prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(buildDraw());

      await disqualifyTwitterV2Winner({
        drawId: 'draw-42',
        reason: 'Bot account'
      });

      expect(prismaMock.twitterPickerDraw.update).toHaveBeenCalledWith({
        where: { id: 'draw-42' },
        data: { disqualified: 'Bot account' }
      });
    });

    it('returns success', async () => {
      prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(buildDraw());

      const result = await disqualifyTwitterV2Winner({
        drawId: 'draw-1',
        reason: 'Bot account'
      });

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('overwrites an existing disqualification reason', async () => {
      prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(
        buildDraw({ disqualified: 'Old reason' })
      );

      await disqualifyTwitterV2Winner({
        drawId: 'draw-1',
        reason: 'New reason'
      });

      expect(prismaMock.twitterPickerDraw.update).toHaveBeenCalledWith({
        where: { id: 'draw-1' },
        data: { disqualified: 'New reason' }
      });
    });

    it('does not check picker ownership', async () => {
      prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(buildDraw());

      await disqualifyTwitterV2Winner({
        drawId: 'draw-1',
        reason: 'Bot account'
      });

      expect(prismaMock.twitterPicker.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the draw disappears before the update', async () => {
      prismaMock.twitterPickerDraw.findUnique.mockResolvedValue(buildDraw());
      prismaMock.twitterPickerDraw.update.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await disqualifyTwitterV2Winner({
        drawId: 'draw-1',
        reason: 'Bot account'
      });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
    });
  });
});
