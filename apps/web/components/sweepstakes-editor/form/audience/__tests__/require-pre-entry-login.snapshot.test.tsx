import { describe, expect, it } from 'vitest';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
import { RequirePreEntryLogin } from '../require-pre-entry-login';

const renderField = (requirePreEntryLogin: boolean) => {
  const values = buildFormValues();
  return renderWithForm(
    (form) => (
      <RequirePreEntryLogin
        form={form}
        fieldPath="audience.requirePreEntryLogin"
      />
    ),
    {
      values: {
        ...values,
        audience: { ...values.audience, requirePreEntryLogin }
      }
    }
  );
};

describe('RequirePreEntryLogin', () => {
  it('matches the snapshot', () => {
    const { container } = renderField(false);
    expect(stabilizeIds(container)).toMatchSnapshot();
  });
});
