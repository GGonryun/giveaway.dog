import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StatusExplanationDialog } from '../status-explanation-dialog';

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

describe('StatusExplanationDialog', () => {
  describe('for an active user', () => {
    it('matches the snapshot', () => {
      render(
        <StatusExplanationDialog open onClose={vi.fn()} status="active" />
      );

      expect(screen.getByRole('alertdialog')).toMatchSnapshot();
    });
  });

  describe('for a blocked user', () => {
    it('matches the snapshot', () => {
      render(
        <StatusExplanationDialog open onClose={vi.fn()} status="blocked" />
      );

      expect(screen.getByRole('alertdialog')).toMatchSnapshot();
    });
  });
});
