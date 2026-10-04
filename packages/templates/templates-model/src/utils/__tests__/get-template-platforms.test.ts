import { describe, it, expect } from 'vitest';
import { getTemplatePlatforms } from '../get-template-platforms';
import { getTemplateById } from '../../data/static-templates';
import type { TemplateDetailsSchema } from '../../schemas/template';
import { TASK_PLATFORM } from '@giveaway/task-model/schemas';

const withTasks = (...types: string[]) =>
  ({
    tasks: types.map((type, index) => ({ id: `task-${index}`, type }))
  }) as unknown as TemplateDetailsSchema;

describe('getTemplatePlatforms', () => {
  it('returns an empty list for a template without tasks', () => {
    expect(getTemplatePlatforms(withTasks())).toEqual([]);
  });

  it('includes the WEBSITE platform for visit-url tasks', () => {
    expect(getTemplatePlatforms(withTasks('VISIT_URL'))).toEqual(['WEBSITE']);
  });

  it('excludes BONUS platform tasks', () => {
    expect(
      getTemplatePlatforms(
        withTasks('BONUS_TASK', 'SECRET_CODE', 'REFERRAL_LINK')
      )
    ).toEqual([]);
  });

  it('excludes QUESTION platform tasks', () => {
    expect(
      getTemplatePlatforms(
        withTasks('ASK_QUESTION', 'MULTIPLE_CHOICE', 'SUBMIT_MEDIA')
      )
    ).toEqual([]);
  });

  it('lists each platform once in first-seen order', () => {
    expect(
      getTemplatePlatforms(
        withTasks(
          'TWITTER_FOLLOW',
          'VISIT_URL',
          'TWITTER_LIKE',
          'DISCORD_JOIN',
          'BONUS_TASK'
        )
      )
    ).toEqual(['TWITTER', 'WEBSITE', 'DISCORD']);
  });

  it('skips task types with no known platform', () => {
    expect(getTemplatePlatforms(withTasks('UNKNOWN_TASK'))).toEqual([]);
  });

  it('reports every non-bonus, non-question platform in the task catalog', () => {
    const types = Object.keys(TASK_PLATFORM);
    const expected = [
      ...new Set(
        Object.values(TASK_PLATFORM).filter(
          (platform) => platform !== 'BONUS' && platform !== 'QUESTION'
        )
      )
    ];

    expect(getTemplatePlatforms(withTasks(...types))).toEqual(expected);
  });

  it('derives the platforms of the static templates', () => {
    const platformsOf = (id: string) => {
      const template = getTemplateById(id);
      if (!template) throw new Error(`Missing template ${id}`);
      return getTemplatePlatforms(template);
    };

    expect(platformsOf('basic-giveaway')).toEqual(['WEBSITE']);
    expect(platformsOf('x-giveaway')).toEqual(['TWITTER']);
    expect(platformsOf('anonymous-sweepstakes')).toEqual([]);
  });
});
