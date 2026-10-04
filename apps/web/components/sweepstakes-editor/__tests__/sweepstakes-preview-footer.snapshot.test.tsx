import { render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GiveawayState } from '@/schemas/giveaway/schemas';
import { PreviewStateContext } from '../contexts/preview-state-context';
import { SweepstakesPreviewFooter } from '../sweepstakes-preview-footer';
import { stabilizeIds } from '@giveaway/testing-dom/stable-dom';

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

  it('matches the snapshot', () => {
    const { container } = renderFooter();
    expect(stabilizeIds(container)).toMatchSnapshot();
  });
});
