import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsCard } from '../settings-card';

describe('SettingsCard', () => {
  describe('header', () => {
    it('shows the title and description', () => {
      render(<SettingsCard title="Team Logo" description="Your team image." />);

      expect(screen.getByText('Team Logo')).toBeInTheDocument();
      expect(screen.getByText('Your team image.')).toBeInTheDocument();
    });

    it('omits the description when none is given', () => {
      const { container } = render(<SettingsCard title="Team Logo" />);

      expect(
        container.querySelector('[data-slot="card-description"]')
      ).not.toBeInTheDocument();
    });

    it('renders an accent next to the title', () => {
      render(
        <SettingsCard
          title="Invite Team Members"
          accent={<button type="button">Invite Link</button>}
        />
      );

      expect(
        screen.getByRole('button', { name: 'Invite Link' })
      ).toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('renders its children', () => {
      render(
        <SettingsCard title="Team Name">
          <p>Card body</p>
        </SettingsCard>
      );

      expect(screen.getByText('Card body')).toBeInTheDocument();
    });

    it('removes the content padding when there are no children', () => {
      const { container } = render(<SettingsCard title="Team Name" />);

      expect(container.querySelector('[data-slot="card-content"]')).toHaveClass(
        'p-0'
      );
    });
  });

  describe('footer', () => {
    it('renders nothing below the content when there is no footer', () => {
      render(
        <SettingsCard title="Team Name" onSave={vi.fn()} hasChanges>
          <p>Card body</p>
        </SettingsCard>
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows the footer text', () => {
      render(<SettingsCard title="Team Name" footer="Saved automatically." />);

      expect(screen.getByText('Saved automatically.')).toBeInTheDocument();
    });

    it('hides the save button when there is no save handler', () => {
      render(<SettingsCard title="Team Slug" footer="Cannot be changed." />);

      expect(screen.getByRole('button', { name: 'Save' })).toHaveClass(
        'hidden'
      );
    });

    it('replaces the save button with a custom action', () => {
      render(
        <SettingsCard
          title="Account Actions"
          footer="Deletion is permanent."
          onSave={vi.fn()}
          action={<button type="button">Delete Account</button>}
        />
      );

      expect(
        screen.getByRole('button', { name: 'Delete Account' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Save' })
      ).not.toBeInTheDocument();
    });
  });

  describe('save button', () => {
    it('is disabled when there are no changes', () => {
      render(
        <SettingsCard title="Team Name" footer="Footer" onSave={vi.fn()} />
      );

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it('calls onSave when there are changes', async () => {
      const onSave = vi.fn();
      render(
        <SettingsCard
          title="Team Name"
          footer="Footer"
          onSave={onSave}
          hasChanges
        />
      );

      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('shows a disabled saving state while saving', () => {
      render(
        <SettingsCard
          title="Team Name"
          footer="Footer"
          onSave={vi.fn()}
          hasChanges
          isSaving
        />
      );

      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    });
  });

  describe('variants', () => {
    it('outlines the destructive variant', () => {
      const { container } = render(
        <SettingsCard variant="destructive" title="Danger" />
      );

      expect(container.firstChild).toHaveClass('border-destructive');
    });

    it('does not outline the default variant', () => {
      const { container } = render(<SettingsCard title="Team Name" />);

      expect(container.firstChild).not.toHaveClass('border-destructive');
    });
  });
});
