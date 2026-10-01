import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Label } from '../label';

describe('Label', () => {
  it('matches the snapshot', () => {
    const { container } = render(<Label htmlFor="email">Email</Label>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('labels its associated control', () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </>
    );
    expect(screen.getByLabelText('Email')).toBe(screen.getByRole('textbox'));
  });

  it('focuses the associated control when clicked', async () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </>
    );
    await userEvent.click(screen.getByText('Email'));
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('prevents text selection on double click', () => {
    render(<Label>Email</Label>);
    const label = screen.getByText('Email');
    expect(fireEvent.mouseDown(label, { detail: 2 })).toBe(false);
    expect(fireEvent.mouseDown(label, { detail: 1 })).toBe(true);
  });

  it('merges a custom class name', () => {
    render(<Label className="text-destructive">Email</Label>);
    expect(screen.getByText('Email')).toHaveClass(
      'text-destructive',
      'font-medium'
    );
  });

  it('forwards the ref to the label element', () => {
    const ref = createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Email</Label>);
    expect(ref.current).toBe(screen.getByText('Email'));
    expect(ref.current?.tagName).toBe('LABEL');
  });
});
