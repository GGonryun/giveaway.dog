import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { saveTaskProof } from '../proof';
import { TaskSchema, TaskType } from '../../schemas';
import { BASE_TASK } from '@giveaway/testing-server/fixtures-task-validation';

const taskOf = (task: Record<string, unknown> & { type: string }) =>
  ({ ...BASE_TASK, id: `task-${task.type}`, ...task }) as unknown as TaskSchema;

const NULL_PROOF_TYPES: TaskType[] = [
  'INSTAGRAM_LIKE',
  'INSTAGRAM_COMMENT',
  'INSTAGRAM_VISIT',
  'FACEBOOK_VIEW_POST',
  'FACEBOOK_VISIT_PAGE',
  'BONUS_TASK',
  'BONUS_TIMED',
  'BONUS_LIMITED',
  'BONUS_LOYALTY',
  'BONUS_COMPLETE_PROFILE',
  'STEAM_WISHLIST',
  'DISCORD_JOIN',
  'DISCORD_INTERACTION_IMPORT',
  'TWITCH_FOLLOW',
  'TWITCH_CHAT_IMPORT',
  'KICK_FOLLOW',
  'TWITTER_CONNECT',
  'TWITTER_FOLLOW',
  'TWITTER_LIKE',
  'TWITTER_RETWEET',
  'YOUTUBE_VISIT',
  'TWITTER_RETWEET_IMPORT',
  'TWITTER_RETWEET_IMPORT_V2',
  'TWITTER_LIKE_IMPORT',
  'TIKTOK_FOLLOW',
  'TIKTOK_LIKE',
  'BLUESKY_CONNECT',
  'BLUESKY_FOLLOW',
  'BLUESKY_LIKE',
  'BLUESKY_REPOST',
  'BLUESKY_LIKE_IMPORT',
  'BLUESKY_REPOST_IMPORT',
  'VELORA_CONNECT',
  'VELORA_FOLLOW',
  'LINKEDIN_CONNECT',
  'LINKEDIN_FOLLOW',
  'REFERRAL_LINK'
];

describe('saveTaskProof', () => {
  describe('VISIT_URL', () => {
    it('returns JsonNull when the task has no afterVisit step', () => {
      expect(
        saveTaskProof(taskOf({ type: 'VISIT_URL' }), { answer: 'x' })
      ).toBe(Prisma.JsonNull);
    });

    it('returns JsonNull when the afterVisit step is not a question', () => {
      const task = taskOf({
        type: 'VISIT_URL',
        afterVisit: { type: 'DELAY', seconds: 10 }
      });

      expect(saveTaskProof(task, 'ignored')).toBe(Prisma.JsonNull);
    });

    it('stores the question and the submitted answer', () => {
      const task = taskOf({
        type: 'VISIT_URL',
        afterVisit: { type: 'QUESTION', question: 'What?', input: 'TEXT' }
      });

      expect(saveTaskProof(task, { answer: 'This' })).toEqual({
        question: 'What?',
        answer: 'This'
      });
    });

    it('stores an undefined answer when none was submitted', () => {
      const task = taskOf({
        type: 'VISIT_URL',
        afterVisit: { type: 'QUESTION', question: 'What?', input: 'TEXT' }
      });

      expect(saveTaskProof(task, {})).toEqual({
        question: 'What?',
        answer: undefined
      });
    });

    it('throws a ZodError when the answer is not a string', () => {
      const task = taskOf({
        type: 'VISIT_URL',
        afterVisit: { type: 'QUESTION', question: 'What?', input: 'TEXT' }
      });

      expect(() => saveTaskProof(task, { answer: 3 })).toThrow(ZodError);
    });
  });

  describe('SECRET_CODE', () => {
    it('stores only the submitted code', () => {
      expect(
        saveTaskProof(taskOf({ type: 'SECRET_CODE', code: 'SECRET' }), {
          code: 'guess',
          extra: true
        })
      ).toEqual({ code: 'guess' });
    });

    it('throws a ZodError when the code is empty', () => {
      expect(() =>
        saveTaskProof(taskOf({ type: 'SECRET_CODE' }), { code: '' })
      ).toThrow(ZodError);
    });
  });

  describe('SECRET_CODE_V2', () => {
    it('stores only the submitted code', () => {
      expect(
        saveTaskProof(taskOf({ type: 'SECRET_CODE_V2', codes: ['A'] }), {
          code: 'A'
        })
      ).toEqual({ code: 'A' });
    });

    it('throws a ZodError when the code is missing', () => {
      expect(() =>
        saveTaskProof(taskOf({ type: 'SECRET_CODE_V2' }), undefined)
      ).toThrow(ZodError);
    });
  });

  describe('ASK_QUESTION', () => {
    it('stores the question and the answer', () => {
      expect(
        saveTaskProof(taskOf({ type: 'ASK_QUESTION', question: 'Why?' }), {
          answer: 'Because'
        })
      ).toEqual({ question: 'Why?', answer: 'Because' });
    });

    it('throws a ZodError when the answer is empty', () => {
      expect(() =>
        saveTaskProof(taskOf({ type: 'ASK_QUESTION', question: 'Why?' }), {
          answer: ''
        })
      ).toThrow(ZodError);
    });
  });

  describe('SINGLE_CHOICE', () => {
    it('stores the question, the options and the choice', () => {
      const task = taskOf({
        type: 'SINGLE_CHOICE',
        question: 'Color?',
        options: ['red', 'blue']
      });

      expect(saveTaskProof(task, { choice: 'blue' })).toEqual({
        question: 'Color?',
        options: ['red', 'blue'],
        choice: 'blue'
      });
    });

    it('does not check that the choice is one of the options', () => {
      const task = taskOf({
        type: 'SINGLE_CHOICE',
        question: 'Color?',
        options: ['red', 'blue']
      });

      expect(saveTaskProof(task, { choice: 'green' })).toMatchObject({
        choice: 'green'
      });
    });

    it('throws a ZodError when the choice is empty', () => {
      expect(() =>
        saveTaskProof(taskOf({ type: 'SINGLE_CHOICE' }), { choice: '' })
      ).toThrow(ZodError);
    });
  });

  describe('MULTIPLE_CHOICE', () => {
    it('stores the question, the options and the choices', () => {
      const task = taskOf({
        type: 'MULTIPLE_CHOICE',
        question: 'Colors?',
        options: ['red', 'blue', 'green']
      });

      expect(saveTaskProof(task, { choices: ['red', 'green'] })).toEqual({
        question: 'Colors?',
        options: ['red', 'blue', 'green'],
        choices: ['red', 'green']
      });
    });

    it('throws a ZodError when no choices are submitted', () => {
      expect(() =>
        saveTaskProof(taskOf({ type: 'MULTIPLE_CHOICE' }), { choices: [] })
      ).toThrow(ZodError);
    });
  });

  describe('SUBMIT_MEDIA', () => {
    it('stores the media URL', () => {
      expect(
        saveTaskProof(taskOf({ type: 'SUBMIT_MEDIA' }), {
          mediaUrl: 'https://cdn.example.com/proof.png'
        })
      ).toEqual({ mediaUrl: 'https://cdn.example.com/proof.png' });
    });

    it('throws a ZodError when the media URL is invalid', () => {
      expect(() =>
        saveTaskProof(taskOf({ type: 'SUBMIT_MEDIA' }), {
          mediaUrl: 'not-a-url'
        })
      ).toThrow(ZodError);
    });
  });

  describe('STEAM_FOLLOW', () => {
    it('returns JsonNull without parsing when proof is not required', () => {
      expect(
        saveTaskProof(taskOf({ type: 'STEAM_FOLLOW', requireProof: false }), {
          mediaUrl: 'not-a-url'
        })
      ).toBe(Prisma.JsonNull);
    });

    it('stores the media URL when proof is required', () => {
      expect(
        saveTaskProof(taskOf({ type: 'STEAM_FOLLOW', requireProof: true }), {
          mediaUrl: 'https://cdn.example.com/steam.png'
        })
      ).toEqual({ mediaUrl: 'https://cdn.example.com/steam.png' });
    });

    it('returns JsonNull when proof is required but no media URL was sent', () => {
      expect(
        saveTaskProof(taskOf({ type: 'STEAM_FOLLOW', requireProof: true }), {})
      ).toBe(Prisma.JsonNull);
    });

    it('throws a ZodError when proof is required and the media URL is invalid', () => {
      expect(() =>
        saveTaskProof(taskOf({ type: 'STEAM_FOLLOW', requireProof: true }), {
          mediaUrl: 'not-a-url'
        })
      ).toThrow(ZodError);
    });
  });

  describe('task types without proof', () => {
    it.each(NULL_PROOF_TYPES)('returns JsonNull for %s', (type) => {
      expect(saveTaskProof(taskOf({ type }), { anything: true })).toBe(
        Prisma.JsonNull
      );
    });
  });

  it('throws for an unknown task type', () => {
    expect(() => saveTaskProof(taskOf({ type: 'UNKNOWN_TYPE' }), {})).toThrow(
      'Unexpected value: [object Object]'
    );
  });
});
