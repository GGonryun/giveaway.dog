import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import {
  Form,
  FormAlertMessage,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormMessageParagraph
} from '../form';
import { Input } from '../input';
import { withStableIds } from './test-utils';

type Values = { email: string };

function EmailForm({
  onSubmit = vi.fn(),
  message
}: {
  onSubmit?: (values: Values) => void;
  message?: React.ReactNode;
}) {
  const form = useForm<Values>({ defaultValues: { email: '' } });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          rules={{ required: 'Email is required' }}
          render={({ field }) => (
            <FormItem className="max-w-sm">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>We never share it.</FormDescription>
              <FormMessage>{message}</FormMessage>
            </FormItem>
          )}
        />
        <button type="submit">Save</button>
      </form>
    </Form>
  );
}

async function submit() {
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
}

describe('Form', () => {
  it('matches the snapshot of a field', () => {
    const { container } = render(<EmailForm />);
    expect(
      withStableIds(container.querySelector('form > div'))
    ).toMatchSnapshot();
  });

  it('connects the label and the description to the control', () => {
    render(<EmailForm />);
    const input = screen.getByLabelText('Email');
    expect(input).toBe(screen.getByRole('textbox'));
    expect(input).toHaveAccessibleDescription('We never share it.');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('shows the validation message and marks the field invalid', async () => {
    render(<EmailForm />);
    await submit();

    const message = await screen.findByText('Email is required');
    expect(message.tagName).toBe('P');
    expect(message).toHaveClass('text-destructive');
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      'We never share it. Email is required'
    );
    expect(screen.getByText('Email')).toHaveClass('text-destructive');
  });

  it('submits valid values', async () => {
    const onSubmit = vi.fn();
    render(<EmailForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await submit();
    expect(onSubmit).toHaveBeenCalledWith(
      { email: 'ada@example.com' },
      expect.anything()
    );
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });

  it('clears the error once the value becomes valid', async () => {
    render(<EmailForm />);
    await submit();
    await screen.findByText('Email is required');

    await userEvent.type(screen.getByLabelText('Email'), 'a');

    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'false'
    );
  });

  it('renders the message children when there is no error', () => {
    render(<EmailForm message="Use your work email" />);
    expect(screen.getByText('Use your work email')).toHaveClass(
      'text-destructive'
    );
  });

  it('prefers the validation error over the message children', async () => {
    render(<EmailForm message="Use your work email" />);
    await submit();
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.queryByText('Use your work email')).not.toBeInTheDocument();
  });

  it('renders no message element without an error or children', () => {
    const { container } = render(<EmailForm />);
    expect(container.querySelector('p.text-destructive')).toBeNull();
  });

  it('merges a custom class name on the item', () => {
    render(<EmailForm />);
    expect(screen.getByLabelText('Email').parentElement).toHaveClass(
      'space-y-1',
      'max-w-sm'
    );
  });

  it('does not throw when a label is rendered outside a form field', () => {
    function Orphan() {
      const form = useForm();
      return (
        <Form {...form}>
          <FormLabel>Orphan</FormLabel>
        </Form>
      );
    }
    render(<Orphan />);
    expect(screen.getByText('Orphan')).toHaveAttribute(
      'for',
      'undefined-form-item'
    );
  });
});

describe('FormAlertMessage', () => {
  function AlertForm() {
    const form = useForm<Values>({ defaultValues: { email: '' } });
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(vi.fn())}>
          <FormField
            control={form.control}
            name="email"
            rules={{ required: 'Email is required' }}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input aria-label="Email" {...field} />
                </FormControl>
                <FormAlertMessage />
              </FormItem>
            )}
          />
          <button type="submit">Save</button>
        </form>
      </Form>
    );
  }

  it('renders nothing until there is an error', () => {
    render(<AlertForm />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the error inside a destructive alert', async () => {
    render(<AlertForm />);
    await submit();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveClass('text-destructive');
    expect(alert).toHaveTextContent('Email is required');
    expect(alert.querySelector('svg')).toBeInTheDocument();
  });
});

describe('FormMessageParagraph', () => {
  it('renders the error message with the given id', () => {
    render(
      <FormMessageParagraph
        formMessageId="email-message"
        error={{ type: 'required', message: 'Email is required' }}
      >
        Hint
      </FormMessageParagraph>
    );
    const message = screen.getByText('Email is required');
    expect(message).toHaveAttribute('id', 'email-message');
    expect(screen.queryByText('Hint')).not.toBeInTheDocument();
  });

  it('renders its children without an error', () => {
    render(
      <FormMessageParagraph formMessageId="email-message" error={undefined}>
        Hint
      </FormMessageParagraph>
    );
    expect(screen.getByText('Hint')).toHaveClass('text-destructive');
  });

  it('renders nothing without an error or children', () => {
    const { container } = render(
      <FormMessageParagraph formMessageId="email-message" error={undefined} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
