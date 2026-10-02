import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FeatureInDevelopmentDialog } from '../feature-in-development-dialog';

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

describe('FeatureInDevelopmentDialog', () => {
  it('matches the snapshot', () => {
    render(<FeatureInDevelopmentDialog open onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toMatchSnapshot();
  });
});
