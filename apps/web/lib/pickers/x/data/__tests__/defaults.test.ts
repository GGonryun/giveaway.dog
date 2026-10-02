import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TWITTER_V2_PICKER_FORM,
  DEFAULT_TWITTER_V2_PICKER_NAME
} from '../defaults';
import { twitterV2PickerFormSchema } from '../../schemas/form';

describe('DEFAULT_TWITTER_V2_PICKER_FORM', () => {
  it('starts with a single empty post url', () => {
    expect(DEFAULT_TWITTER_V2_PICKER_FORM.setup).toEqual({
      postUrls: [{ url: '' }]
    });
  });

  it('enables repost and disables reply actions', () => {
    expect(DEFAULT_TWITTER_V2_PICKER_FORM.actions).toEqual({
      repost: true,
      reply: false
    });
  });

  it('has no scheduled timing', () => {
    expect(DEFAULT_TWITTER_V2_PICKER_FORM.timing).toBeNull();
  });

  it('draws a single winner', () => {
    expect(DEFAULT_TWITTER_V2_PICKER_FORM.winners).toEqual({ quota: 1 });
  });

  it('uses the default user filters', () => {
    expect(DEFAULT_TWITTER_V2_PICKER_FORM.filters).toEqual({
      minimumPostCount: 100,
      minimumAccountAgeDays: 90,
      minimumFollowers: 100,
      minimumFollowing: 100,
      lastPostWithin: null,
      hasProfileImage: true,
      hasBanner: false,
      hasLocation: false,
      hasDescription: false
    });
  });

  it('fails form validation until a post url is entered', () => {
    const result = twitterV2PickerFormSchema({
      validateTiming: true
    }).safeParse(DEFAULT_TWITTER_V2_PICKER_FORM);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ['setup', 'postUrls', 0, 'url'],
      message: 'Post URL is required'
    });
  });

  it('passes form validation once a valid post url is entered', () => {
    const result = twitterV2PickerFormSchema({
      validateTiming: true
    }).safeParse({
      ...DEFAULT_TWITTER_V2_PICKER_FORM,
      setup: { postUrls: [{ url: 'https://x.com/doglover/status/1' }] }
    });

    expect(result.success).toBe(true);
  });
});

describe('DEFAULT_TWITTER_V2_PICKER_NAME', () => {
  it('is "X Picker"', () => {
    expect(DEFAULT_TWITTER_V2_PICKER_NAME).toBe('X Picker');
  });
});
