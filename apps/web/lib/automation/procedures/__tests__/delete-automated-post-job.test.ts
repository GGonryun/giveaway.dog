import { describe, it, expect, beforeEach } from 'vitest';
import type { AutomatedPostJobStatus } from '@prisma/client';
import { deleteAutomatedPostJob } from '../delete-automated-post-job';
import { knownRequestError, prismaMock } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

const jobWithTeam = ({
  status = 'PENDING',
  members = [{ id: 'm-1', userId: TEST_USER.id }],
  team = true
}: {
  status?: AutomatedPostJobStatus;
  members?: { id: string; userId: string }[];
  team?: boolean;
} = {}) => ({
  id: 'job-1',
  status,
  sweepstakes: {
    id: 'sweep-1',
    team: team ? { id: 'team-1', members } : null
  }
});

describe('deleteAutomatedPostJob', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without touching the database', async () => {
      const result = await deleteAutomatedPostJob({ jobId: 'job-1' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.automatedPostJob.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects input without a job id', async () => {
      const result = await deleteAutomatedPostJob(
        {} as unknown as Parameters<typeof deleteAutomatedPostJob>[0]
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Input validation failed'
      );
      expect(prismaMock.automatedPostJob.findUnique).not.toHaveBeenCalled();
    });

    it('loads the job with the team memberships of the caller', async () => {
      prismaMock.automatedPostJob.findUnique.mockResolvedValue(jobWithTeam());

      await deleteAutomatedPostJob({ jobId: 'job-1' });

      expect(prismaMock.automatedPostJob.findUnique).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        include: {
          sweepstakes: {
            include: {
              team: {
                include: {
                  members: { where: { userId: TEST_USER.id } }
                }
              }
            }
          }
        }
      });
    });

    it('deletes a pending job and reports success', async () => {
      prismaMock.automatedPostJob.findUnique.mockResolvedValue(jobWithTeam());

      const result = await deleteAutomatedPostJob({ jobId: 'job-1' });

      expect(expectOk(result)).toEqual({ success: true });
      expect(prismaMock.automatedPostJob.delete).toHaveBeenCalledWith({
        where: { id: 'job-1' }
      });
    });

    it('deletes a failed job', async () => {
      prismaMock.automatedPostJob.findUnique.mockResolvedValue(
        jobWithTeam({ status: 'FAILED' })
      );

      const result = await deleteAutomatedPostJob({ jobId: 'job-1' });

      expect(expectOk(result)).toEqual({ success: true });
      expect(prismaMock.automatedPostJob.delete).toHaveBeenCalledWith({
        where: { id: 'job-1' }
      });
    });

    it('returns NOT_FOUND when the job does not exist', async () => {
      prismaMock.automatedPostJob.findUnique.mockResolvedValue(null);

      const result = await deleteAutomatedPostJob({ jobId: 'job-1' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Job not found');
      expect(prismaMock.automatedPostJob.delete).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the sweepstakes has no team', async () => {
      prismaMock.automatedPostJob.findUnique.mockResolvedValue(
        jobWithTeam({ team: false })
      );

      const result = await deleteAutomatedPostJob({ jobId: 'job-1' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Job not found');
      expect(prismaMock.automatedPostJob.delete).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN when the caller is not a team member', async () => {
      prismaMock.automatedPostJob.findUnique.mockResolvedValue(
        jobWithTeam({ members: [] })
      );

      const result = await deleteAutomatedPostJob({ jobId: 'job-1' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You do not have permission to delete this job'
      );
      expect(prismaMock.automatedPostJob.delete).not.toHaveBeenCalled();
    });

    it('returns PRECONDITION_FAILED for a completed job', async () => {
      prismaMock.automatedPostJob.findUnique.mockResolvedValue(
        jobWithTeam({ status: 'COMPLETED' })
      );

      const result = await deleteAutomatedPostJob({ jobId: 'job-1' });

      expect(expectFailure(result, 'PRECONDITION_FAILED').message).toBe(
        'Can only delete pending or failed jobs'
      );
      expect(prismaMock.automatedPostJob.delete).not.toHaveBeenCalled();
    });

    it('maps a P2025 error from the delete to NOT_FOUND', async () => {
      prismaMock.automatedPostJob.findUnique.mockResolvedValue(jobWithTeam());
      prismaMock.automatedPostJob.delete.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await deleteAutomatedPostJob({ jobId: 'job-1' });

      expectFailure(result, 'NOT_FOUND');
    });
  });
});
