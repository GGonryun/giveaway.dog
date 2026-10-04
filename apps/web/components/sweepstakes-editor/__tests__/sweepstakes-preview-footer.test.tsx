import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GiveawayState } from '@giveaway/sweepstakes-model/schemas';
import { PreviewStateContext } from '../contexts/preview-state-context';
import { SweepstakesPreviewFooter } from '../sweepstakes-preview-footer';

const StatefulFooter = ({
  initialState,
  onChange
}: {
  initialState: GiveawayState;
  onChange: (state: GiveawayState) => void;
}) => {
  const [previewState, setState] = useState(initialState);
  const setPreviewState = (state: GiveawayState) => {
    onChange(state);
    setState(state);
  };
  return (
    <PreviewStateContext.Provider value={{ previewState, setPreviewState }}>
      <SweepstakesPreviewFooter />
    </PreviewStateContext.Provider>
  );
};

const renderFooter = (initialState: GiveawayState = 'active') => {
  const onChange = vi.fn();
  const view = render(
    <StatefulFooter initialState={initialState} onChange={onChange} />
  );
  return { ...view, onChange };
};

describe('SweepstakesPreviewFooter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('labels the preview mode', () => {
    renderFooter();
    expect(screen.getByText('Preview Mode')).toBeInTheDocument();
  });

  it.each([
    ['active', 'Active State'],
    ['winners-announced', 'Winners Announced'],
    ['no-prize-allocation', 'No Prize Selected']
  ] as const)('shows the %s state as %s', (state, label) => {
    renderFooter(state);
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  });

  it('lists the states that can be previewed', async () => {
    renderFooter();
    await userEvent.click(screen.getByRole('button', { name: 'Active State' }));

    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent)
    ).toEqual([
      'Active State',
      'Not Logged In',
      'Profile Incomplete',
      'Not Eligible',
      'Winners Announced',
      'No Prize Selected'
    ]);
  });

  it('changes the preview state when a state is chosen', async () => {
    const { onChange } = renderFooter();
    await userEvent.click(screen.getByRole('button', { name: 'Active State' }));
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Not Eligible' })
    );

    expect(onChange).toHaveBeenCalledWith('not-eligible');
    expect(
      screen.getByRole('button', { name: 'Not Eligible' })
    ).toBeInTheDocument();
  });

  it('requires a preview state provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<SweepstakesPreviewFooter />)).toThrow(
      'usePreviewState must be used within a PreviewStateProvider'
    );
  });
});
