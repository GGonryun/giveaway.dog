import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NonNavigationalLink } from '../links';

const renderLink = (onClick = vi.fn()) => {
  const parentSawDefaultPrevented: boolean[] = [];
  render(
    <div
      onClick={(event) => {
        parentSawDefaultPrevented.push(event.defaultPrevented);
        event.preventDefault();
      }}
    >
      <NonNavigationalLink href="?step=prizes" onClick={onClick}>
        Prizes
      </NonNavigationalLink>
    </div>
  );
  return {
    link: screen.getByRole('link', { name: 'Prizes' }),
    onClick,
    parentSawDefaultPrevented
  };
};

describe('NonNavigationalLink', () => {
  it('renders a link to the given href', () => {
    const { link } = renderLink();
    expect(link).toHaveAttribute('href', '?step=prizes');
  });

  it('handles a plain left click itself instead of navigating', () => {
    const { link, onClick } = renderLink();
    const notCancelled = fireEvent.click(link);
    expect(notCancelled).toBe(false);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('stops a plain left click from reaching parent handlers', () => {
    const { link, parentSawDefaultPrevented } = renderLink();
    fireEvent.click(link);
    expect(parentSawDefaultPrevented).toEqual([]);
  });

  it('prevents navigation even without an onClick handler', () => {
    render(<NonNavigationalLink href="?step=tasks">Tasks</NonNavigationalLink>);
    expect(fireEvent.click(screen.getByRole('link', { name: 'Tasks' }))).toBe(
      false
    );
  });

  it.each(['metaKey', 'ctrlKey', 'shiftKey', 'altKey'])(
    'leaves a click with %s to the browser',
    (modifier) => {
      const { link, onClick, parentSawDefaultPrevented } = renderLink();
      fireEvent.click(link, { [modifier]: true });
      expect(onClick).not.toHaveBeenCalled();
      expect(parentSawDefaultPrevented).toEqual([false]);
    }
  );

  it('ignores clicks from buttons other than the main one', () => {
    const { link, onClick } = renderLink();
    fireEvent.click(link, { button: 1 });
    expect(onClick).not.toHaveBeenCalled();
  });
});
