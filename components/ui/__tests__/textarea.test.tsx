import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Textarea } from '../textarea';

describe('Textarea', () => {
  it('matches the snapshot', () => {
    const { container } = render(<Textarea placeholder="Describe the prize" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders a multi-line text box that accepts typing', async () => {
    render(<Textarea placeholder="Describe the prize" />);
    const textarea = screen.getByPlaceholderText('Describe the prize');
    expect(textarea.tagName).toBe('TEXTAREA');
    await userEvent.type(textarea, 'A shiny{enter}new bike');
    expect(textarea).toHaveValue('A shiny\nnew bike');
  });

  it('calls onChange for each keystroke', async () => {
    const onChange = vi.fn();
    render(<Textarea onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'abc');
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('does not accept input when disabled', async () => {
    render(<Textarea disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
    await userEvent.type(textarea, 'abc');
    expect(textarea).toHaveValue('');
  });

  it('forwards the ref to the textarea element', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('textbox'));
  });

  it('merges a custom class name', () => {
    render(<Textarea className="min-h-40" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('min-h-40', 'rounded-md');
    expect(textarea).not.toHaveClass('min-h-[80px]');
  });
});
