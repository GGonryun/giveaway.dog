import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithForm } from '@giveaway/sweepstakes-editor-setup/testing/form-harness';
import { Selection } from '../selection';

describe('Selection', () => {
  it('introduces the winner criteria', () => {
    renderWithForm(<Selection />);
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Winner Selection Criteria'
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Set requirements for winner eligibility')
    ).toBeInTheDocument();
  });

  it('renders every winner criteria field', () => {
    renderWithForm(<Selection />);
    expect(
      screen.getByLabelText('Minimum Tasks Completed')
    ).toBeInTheDocument();
    expect(screen.getByRole('group')).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Allow Multiple Wins' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Allow Prize Selection' })
    ).toBeInTheDocument();
  });
});
