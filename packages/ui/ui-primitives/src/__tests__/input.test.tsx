import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search } from 'lucide-react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Input, SpecialInput } from '../input';

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

describe('SpecialInput', () => {
  it('renders a bare input when there are no decorations', () => {
    const { container } = render(<SpecialInput aria-label="Search" />);
    const input = screen.getByRole('textbox', { name: 'Search' });
    expect(input.parentElement).toBe(container);
    expect(input).toHaveClass('px-3', 'py-1');
  });

  it('ignores className and only applies inputClassName without decorations', () => {
    render(
      <SpecialInput
        aria-label="Search"
        className="w-64"
        inputClassName="tracking-wide"
      />
    );
    const input = screen.getByRole('textbox', { name: 'Search' });
    expect(input).not.toHaveClass('w-64');
    expect(input).toHaveClass('tracking-wide');
  });

  it('wraps the input and pads it for a start icon', () => {
    const { container } = render(
      <SpecialInput aria-label="Search" startIcon={Search} className="w-64" />
    );
    const input = screen.getByRole('textbox', { name: 'Search' });
    const wrapper = input.parentElement;
    expect(wrapper).toHaveClass('relative', 'w-64');
    expect(input).toHaveClass('pl-9', 'pr-3');
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });

  it('pads the input for an end button and renders the button', () => {
    render(
      <SpecialInput
        aria-label="Password"
        endButton={<button type="button">Show</button>}
      />
    );
    expect(screen.getByRole('textbox', { name: 'Password' })).toHaveClass(
      'pl-3',
      'pr-9'
    );
    expect(screen.getByRole('button', { name: 'Show' })).toBeInTheDocument();
  });

  it('pads both sides when there is a start icon and an end button', () => {
    render(
      <SpecialInput
        aria-label="Search"
        startIcon={Search}
        endButton={<button type="button">Clear</button>}
      />
    );
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveClass(
      'pl-9',
      'pr-9'
    );
  });

  it('forwards the ref to the input element in both layouts', () => {
    const bareRef = createRef<HTMLInputElement>();
    const decoratedRef = createRef<HTMLInputElement>();
    render(
      <>
        <SpecialInput ref={bareRef} aria-label="Bare" />
        <SpecialInput
          ref={decoratedRef}
          aria-label="Decorated"
          startIcon={Search}
        />
      </>
    );
    expect(bareRef.current).toBe(screen.getByRole('textbox', { name: 'Bare' }));
    expect(decoratedRef.current).toBe(
      screen.getByRole('textbox', { name: 'Decorated' })
    );
  });
});
