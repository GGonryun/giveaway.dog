import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { Form, FormField, FormItem } from '@/components/ui/form';
import { SwitchBox, SwitchFormHeader } from '../switch-form-header';

type FieldHarnessProps = {
  children: React.ReactNode;
  error?: string;
};

const FieldHarness = ({ children, error }: FieldHarnessProps) => {
  const form = useForm<{ enabled: boolean }>({
    defaultValues: { enabled: false }
  });

  useEffect(() => {
    if (error) {
      form.setError('enabled', { type: 'custom', message: error });
    }
  }, [error, form]);

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="enabled"
        render={() => <FormItem>{children}</FormItem>}
      />
    </Form>
  );
};

describe('SwitchBox', () => {
  it('renders its children in a bordered box', () => {
    render(<SwitchBox>Notify winners</SwitchBox>);
    expect(screen.getByText('Notify winners')).toHaveClass(
      'rounded-lg',
      'border'
    );
  });

  it('merges a custom class', () => {
    render(<SwitchBox className="p-6">Notify winners</SwitchBox>);
    const box = screen.getByText('Notify winners');
    expect(box).toHaveClass('p-6', 'border');
    expect(box).not.toHaveClass('p-3');
  });
});

describe('SwitchFormHeader', () => {
  it('shows the label', () => {
    render(
      <FieldHarness>
        <SwitchFormHeader label="Require email" />
      </FieldHarness>
    );
    expect(screen.getByText('Require email').tagName).toBe('LABEL');
  });

  it('shows the description when one is given', () => {
    render(
      <FieldHarness>
        <SwitchFormHeader
          label="Require email"
          description="Participants must verify an email"
        />
      </FieldHarness>
    );
    expect(screen.getByText('Participants must verify an email')).toHaveClass(
      'text-muted-foreground'
    );
  });

  it('omits the description when none is given', () => {
    const { container } = render(
      <FieldHarness>
        <SwitchFormHeader label="Require email" />
      </FieldHarness>
    );
    expect(container.querySelector('p')).toBeNull();
  });

  it('adds a custom class to the wrapper', () => {
    render(
      <FieldHarness>
        <SwitchFormHeader label="Require email" className="opacity-50" />
      </FieldHarness>
    );
    expect(
      screen.getByText('Require email').parentElement?.parentElement
    ).toHaveClass('opacity-50', 'space-y-0.5');
  });

  it('highlights the label when the field has an error', async () => {
    render(
      <FieldHarness error="Pick one">
        <SwitchFormHeader label="Require email" />
      </FieldHarness>
    );
    expect(await screen.findByText('Require email')).toHaveClass(
      'text-destructive'
    );
  });

  it('renders no help trigger without help content', () => {
    const { container } = render(
      <FieldHarness>
        <SwitchFormHeader label="Require email" />
      </FieldHarness>
    );
    expect(container.querySelector('[aria-haspopup="dialog"]')).toBeNull();
  });

  it('opens the help dialog from the help icon', async () => {
    const { container } = render(
      <FieldHarness>
        <SwitchFormHeader
          label="Require email"
          help={{
            title: 'Why require email?',
            content: 'We use it to contact winners.'
          }}
        />
      </FieldHarness>
    );
    await userEvent.click(
      container.querySelector('[aria-haspopup="dialog"]') as Element
    );
    expect(
      screen.getByRole('dialog', { name: 'Why require email?' })
    ).toHaveTextContent('We use it to contact winners.');
  });
});
