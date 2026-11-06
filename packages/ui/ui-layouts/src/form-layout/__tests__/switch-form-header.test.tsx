import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Form, FormField, FormItem } from '@giveaway/ui-primitives/form';
import {
  SwitchBox,
  SwitchFormHeader,
  SwitchHeader
} from '../switch-form-header';

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

describe('SwitchFormHeader outside a form item', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws instead of linking the label to a missing control', () => {
    const Orphan = () => {
      const form = useForm();
      return (
        <Form {...form}>
          <SwitchFormHeader label="Require email" />
        </Form>
      );
    };
    expect(() => render(<Orphan />)).toThrow(
      'useFormField should be used within <FormField>'
    );
  });
});

describe('SwitchHeader', () => {
  it('shows the label without a form field', () => {
    render(<SwitchHeader label="Reward profile completion" />);
    const label = screen.getByText('Reward profile completion');
    expect(label.tagName).toBe('LABEL');
    expect(label).not.toHaveAttribute('for');
  });

  it('shows the description without a form item id', () => {
    render(
      <SwitchHeader
        label="Reward profile completion"
        description="Give bonus entries"
      />
    );
    const description = screen.getByText('Give bonus entries');
    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    expect(description).not.toHaveAttribute('id');
  });

  it('omits the description when none is given', () => {
    const { container } = render(
      <SwitchHeader label="Reward profile completion" />
    );
    expect(container.querySelector('p')).toBeNull();
  });

  it('adds a custom class to the wrapper', () => {
    render(<SwitchHeader label="Reward profile completion" className="mb-1" />);
    expect(
      screen.getByText('Reward profile completion').parentElement?.parentElement
    ).toHaveClass('mb-1', 'space-y-0.5');
  });

  it('opens the help dialog from the help icon', async () => {
    const { container } = render(
      <SwitchHeader
        label="Reward profile completion"
        help={{ title: 'Why reward it?', content: 'Better data.' }}
      />
    );
    await userEvent.click(
      container.querySelector('[aria-haspopup="dialog"]') as Element
    );
    expect(
      screen.getByRole('dialog', { name: 'Why reward it?' })
    ).toHaveTextContent('Better data.');
  });
});
