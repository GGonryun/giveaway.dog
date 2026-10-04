import { TwitterV2PickerFormSchema } from './schemas/form';

export const DEFAULT_TWITTER_V2_PICKER_FORM: TwitterV2PickerFormSchema = {
  setup: {
    postUrls: [{ url: '' }]
  },
  actions: {
    repost: true,
    reply: false
  },
  timing: null,
  winners: {
    quota: 1
  },
  filters: {
    minimumPostCount: 100,
    minimumAccountAgeDays: 90,
    minimumFollowers: 100,
    minimumFollowing: 100,
    lastPostWithin: null,
    hasProfileImage: true,
    hasBanner: false,
    hasLocation: false,
    hasDescription: false
  }
};

export const DEFAULT_TWITTER_V2_PICKER_NAME = 'X Picker';
