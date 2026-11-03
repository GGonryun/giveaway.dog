import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, UseFormReturn } from 'react-hook-form';
import { Form } from '@giveaway/ui-primitives/form';
import { SweepstakesFormFieldType } from '@giveaway/db-model';
import { FormFieldComponent } from '../form-field';

type AgeField = {
  id: string;
  type: SweepstakesFormFieldType;
  label: string;
  required: boolean;
  minimum: number | null | undefined;
  maximum: number | null;
};

type Values = { formFields: AgeField[] };

const ageField = (overrides: Partial<AgeField> = {}): AgeField => ({
  id: 'age',
  type: SweepstakesFormFieldType.AGE,
  label: 'I am at least 16 years of age (required)',
  required: true,
  minimum: 16,
  maximum: null,
  ...overrides
});

const renderAgeField = (field: AgeField) => {
  const ref: { form?: UseFormReturn<Values> } = {};

  const Harness = () => {
    const form = useForm<Values>({ defaultValues: { formFields: [field] } });
    ref.form = form;
    return (
      <Form {...form}>
        <FormFieldComponent
          id={field.id}
          type={field.type}
          index={0}
          open
          onRemove={vi.fn()}
          onOpenChange={vi.fn()}
          onCopy={vi.fn()}
          form={form}
          fieldPath="formFields"
        />
      </Form>
    );
  };

  render(<Harness />);

  return {
    input: () => screen.getByRole('spinbutton', { name: 'Minimum Age' }),
    values: () => ref.form!.getValues('formFields.0')
  };
};

describe('Minimum Age input', () => {
  it('shows the stored minimum', () => {
    const { input } = renderAgeField(ageField({ minimum: 18 }));

    expect(input()).toHaveValue(18);
  });

  it.each([
    ['null', null],
    ['undefined', undefined]
  ])(
    'shows an empty input when the stored minimum is %s',
    (_label, minimum) => {
      const { input } = renderAgeField(ageField({ minimum }));

      expect(input()).toHaveValue(null);
      expect(input()).toHaveAttribute('placeholder', '16');
    }
  );

  it('stores no minimum and keeps the label when the host clears the input', async () => {
    const user = userEvent.setup();
    const { input, values } = renderAgeField(ageField());

    await user.clear(input());

    expect(input()).toHaveValue(null);
    expect(values()).toMatchObject({
      minimum: null,
      label: 'I am at least 16 years of age (required)'
    });
  });

  it('rewrites the label from the last age after the host clears and types a new one', async () => {
    const user = userEvent.setup();
    const { input, values } = renderAgeField(ageField());

    await user.clear(input());
    await user.type(input(), '21');

    expect(input()).toHaveValue(21);
    expect(values()).toMatchObject({
      minimum: 21,
      label: 'I am at least 21 years of age (required)'
    });
  });

  it('writes a label with the age when the field has no minimum and no label', async () => {
    const user = userEvent.setup();
    const { input, values } = renderAgeField(
      ageField({ minimum: null, label: '' })
    );

    await user.type(input(), '18');

    expect(values()).toMatchObject({
      minimum: 18,
      label: 'I am at least 18 years of age (required)'
    });
  });

  it('keeps a custom label when the field has no stored minimum', async () => {
    const user = userEvent.setup();
    const { input, values } = renderAgeField(
      ageField({ minimum: null, label: 'Old enough?' })
    );

    await user.type(input(), '18');

    expect(values()).toMatchObject({ minimum: 18, label: 'Old enough?' });
  });
});
