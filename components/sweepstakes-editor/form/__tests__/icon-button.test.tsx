import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyIcon, Trash2Icon } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from '../icon-button';

describe('IconButton', () => {
  it('matches the snapshot', () => {
    const { container } = render(<IconButton icon={Trash2Icon} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders a ghost icon button with the given icon', () => {
    const { container } = render(<IconButton icon={CopyIcon} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('h-8', 'w-8');
    expect(container.querySelector('svg.lucide-copy')).toBeInTheDocument();
  });

  describe('when an onClick handler is given', () => {
    it('calls the handler with the click event', async () => {
      const onClick = vi.fn();
      render(<IconButton icon={Trash2Icon} onClick={onClick} />);
      await userEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick.mock.calls[0][0]).toHaveProperty('type', 'click');
    });

    it('stops the click from reaching parent elements', async () => {
      const onParentClick = vi.fn();
      render(
        <div onClick={onParentClick}>
          <IconButton icon={Trash2Icon} onClick={vi.fn()} />
        </div>
      );
      await userEvent.click(screen.getByRole('button'));
      expect(onParentClick).not.toHaveBeenCalled();
    });
  });

  describe('when no onClick handler is given', () => {
    it('lets the click reach parent elements', async () => {
      const onParentClick = vi.fn();
      render(
        <div onClick={onParentClick}>
          <IconButton icon={Trash2Icon} />
        </div>
      );
      await userEvent.click(screen.getByRole('button'));
      expect(onParentClick).toHaveBeenCalledTimes(1);
    });
  });

  it('does not submit a surrounding form', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <IconButton icon={Trash2Icon} onClick={vi.fn()} />
      </form>
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
