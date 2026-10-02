import { FieldKey } from '@/components/patterns/form-layout/types';
import { Nil } from '@giveaway/util-types/types';

export type TwitterV2PickerStep = 'setup';

export const TWITTER_V2_PICKER_STEP_LABELS: Record<
  TwitterV2PickerStep,
  string
> = {
  setup: 'Setup'
};

export const TWITTER_V2_PICKER_STEP_ORDER: TwitterV2PickerStep[] = ['setup'];

export const isTwitterV2PickerStepKey = (
  key: Nil<string>
): key is TwitterV2PickerStep => {
  if (!key) return false;
  return (
    TWITTER_V2_PICKER_STEP_ORDER.map((step) => step) as ReadonlyArray<string>
  ).includes(key);
};

export const TWITTER_V2_PICKER_STEP_TO_FIELD_MAP: Record<
  TwitterV2PickerStep,
  FieldKey[]
> = {
  setup: ['setup', 'winners', 'filters']
};

export const TWITTER_V2_PICKER_FIELD_TO_STEP_MAP: Record<
  FieldKey,
  TwitterV2PickerStep
> = {
  setup: 'setup',
  winners: 'setup',
  filters: 'setup'
};
