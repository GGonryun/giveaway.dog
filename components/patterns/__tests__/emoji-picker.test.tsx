import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmojiPickerComponent } from '../emoji-picker';

type EmojiPickerStubProps = {
  onEmojiClick: (emoji: { emoji: string }) => void;
};

vi.mock('emoji-picker-react', () => ({
  default: ({ onEmojiClick }: EmojiPickerStubProps) => (
    <div role="listbox" aria-label="Emoji picker">
      <button type="button" onClick={() => onEmojiClick({ emoji: '🎉' })}>
        Party popper
      </button>
    </div>
  )
}));

const trigger = (container: HTMLElement) =>
  container.querySelector('[aria-haspopup="dialog"]') as HTMLElement;

describe('EmojiPickerComponent', () => {
  const onEmojiSelect = vi.fn();

  beforeEach(() => {
    onEmojiSelect.mockReset();
  });

  it('shows the selected emoji on the trigger', () => {
    const { container } = render(
      <EmojiPickerComponent value="🐶" onEmojiSelect={onEmojiSelect} />
    );
    expect(trigger(container)).toHaveTextContent('🐶');
  });

  it('shows a custom placeholder when nothing is selected', () => {
    const { container } = render(
      <EmojiPickerComponent
        value=""
        onEmojiSelect={onEmojiSelect}
        placeholder={<span>Pick one</span>}
      />
    );
    expect(trigger(container)).toHaveTextContent('Pick one');
  });

  it('shows a smile icon when there is no value or placeholder', () => {
    const { container } = render(
      <EmojiPickerComponent value="" onEmojiSelect={onEmojiSelect} />
    );
    expect(
      trigger(container).querySelector('.lucide-smile')
    ).toBeInTheDocument();
  });

  it('uses a non-submitting trigger button', () => {
    const { container } = render(
      <EmojiPickerComponent value="" onEmojiSelect={onEmojiSelect} />
    );
    expect(trigger(container)).toHaveAttribute('type', 'button');
  });

  it('shows the default title and description', () => {
    render(<EmojiPickerComponent value="" onEmojiSelect={onEmojiSelect} />);
    expect(screen.getByText('Choose an emoji')).toBeInTheDocument();
    expect(
      screen.getByText('Click the button to pick an emoji')
    ).toBeInTheDocument();
  });

  it('shows a custom title and description', () => {
    render(
      <EmojiPickerComponent
        value=""
        onEmojiSelect={onEmojiSelect}
        title="Team icon"
        description="Shown next to your team name"
      />
    );
    expect(screen.getByText('Team icon')).toBeInTheDocument();
    expect(
      screen.getByText('Shown next to your team name')
    ).toBeInTheDocument();
  });

  it('adds a custom class to the wrapper', () => {
    const { container } = render(
      <EmojiPickerComponent
        value=""
        onEmojiSelect={onEmojiSelect}
        className="mt-4"
      />
    );
    expect(container.firstChild).toHaveClass('flex', 'mt-4');
  });

  it('opens the picker when the trigger is clicked', async () => {
    const { container } = render(
      <EmojiPickerComponent value="" onEmojiSelect={onEmojiSelect} />
    );
    expect(
      screen.queryByRole('listbox', { name: 'Emoji picker' })
    ).not.toBeInTheDocument();
    await userEvent.click(trigger(container));
    expect(
      screen.getByRole('listbox', { name: 'Emoji picker' })
    ).toBeInTheDocument();
  });

  it('reports the chosen emoji and closes the picker', async () => {
    const { container } = render(
      <EmojiPickerComponent value="" onEmojiSelect={onEmojiSelect} />
    );
    await userEvent.click(trigger(container));
    await userEvent.click(screen.getByRole('button', { name: 'Party popper' }));
    expect(onEmojiSelect).toHaveBeenCalledExactlyOnceWith('🎉');
    expect(
      screen.queryByRole('listbox', { name: 'Emoji picker' })
    ).not.toBeInTheDocument();
  });
});
