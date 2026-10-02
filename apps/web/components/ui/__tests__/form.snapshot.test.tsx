import { render } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
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

describe('Form', () => {
  it('matches the snapshot of a field', () => {
    const { container } = render(<EmailForm />);
    expect(
      withStableIds(container.querySelector('form > div'))
    ).toMatchSnapshot();
  });
});
