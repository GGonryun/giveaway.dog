import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Input } from '../input';

describe('Input', () => {
  it('renders a text box with the data-slot attribute', () => {
    render(<Input aria-label="Email" />);
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
      'data-slot',
      'input'
    );
  });

  it('accepts typed text and reports changes', async () => {
    const onChange = vi.fn();
    render(<Input aria-label="Name" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    await userEvent.type(input, 'Ada');
    expect(input).toHaveValue('Ada');
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('passes the type attribute through', () => {
    render(<Input type="email" aria-label="Email" />);
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
      'type',
      'email'
    );
  });

  it('does not accept input when disabled', async () => {
    render(<Input aria-label="Name" disabled />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toBeDisabled();
    await userEvent.type(input, 'Ada');
    expect(input).toHaveValue('');
  });

  it('exposes the invalid state', () => {
    render(<Input aria-label="Name" aria-invalid />);
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInvalid();
  });

  it('merges a custom class name', () => {
    render(<Input aria-label="Name" className="h-12" />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveClass('h-12', 'rounded-md');
    expect(input).not.toHaveClass('h-9');
  });

  it('forwards the ref to the input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} aria-label="Name" />);
    expect(ref.current).toBe(screen.getByRole('textbox', { name: 'Name' }));
  });
});
