import { describe, expect, it } from 'vitest';
import { IdentityProviderSchema } from '@giveaway/integration-model/providers';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
import { AllowedIdentities } from '../allowed-identities';

const renderField = (
  allowedIdentities: IdentityProviderSchema[] = ['TWITTER', 'GOOGLE'],
  validate = false
) => {
  const values = buildFormValues();
  return renderWithForm(
    (form) => (
      <AllowedIdentities form={form} fieldPath="audience.allowedIdentities" />
    ),
    {
      validate,
      values: {
        ...values,
        audience: { ...values.audience, allowedIdentities }
      }
    }
  );
};

describe('AllowedIdentities', () => {
  it('matches the snapshot', () => {
    const { container } = renderField();
    expect(stabilizeIds(container)).toMatchSnapshot();
  });
});
