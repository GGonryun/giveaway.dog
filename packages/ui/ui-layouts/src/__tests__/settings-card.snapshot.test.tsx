import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingsCard } from '../settings-card';

describe('SettingsCard', () => {
  describe('snapshots', () => {
    it('matches the snapshot with a footer and a save button', () => {
      const { container } = render(
        <SettingsCard
          title="Team Name"
          description="The name of your team."
          footer="Must be at least 1 character long."
          onSave={vi.fn()}
          hasChanges
        >
          <input aria-label="Team name" />
        </SettingsCard>
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches the snapshot for the destructive variant with an action', () => {
      const { container } = render(
        <SettingsCard
          variant="destructive"
          title="Account Actions"
          footer="Deletion is permanent."
          action={<button type="button">Delete Account</button>}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
