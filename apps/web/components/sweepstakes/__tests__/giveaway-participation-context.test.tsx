import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  GiveawayParticipationProvider,
  useGiveawayParticipation
} from '../giveaway-participation-context';
import { buildParticipationProps } from './fixtures';
import type { GiveawayParticipationProps } from '../giveaway-participation-context';

const wrapperFor = (props: GiveawayParticipationProps) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <GiveawayParticipationProvider {...props}>
      {children}
    </GiveawayParticipationProvider>
  );
  return Wrapper;
};

describe('useGiveawayParticipation', () => {
  it('throws when used outside of the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useGiveawayParticipation())).toThrow(
      'useGiveawayParticipation must be used within a GiveawayParticipationProvider'
    );
    vi.mocked(console.error).mockRestore();
  });

  it('exposes the provider props', () => {
    const props = buildParticipationProps({ state: 'closed', isPreview: true });
    const { result } = renderHook(() => useGiveawayParticipation(), {
      wrapper: wrapperFor(props)
    });
    expect(result.current).toMatchObject({
      sweepstakes: props.sweepstakes,
      host: props.host,
      participation: props.participation,
      prizes: props.prizes,
      state: 'closed',
      isPreview: true,
      verifyEmail: false,
      onTaskComplete: props.onTaskComplete,
      onFormSubmit: props.onFormSubmit
    });
  });

  it('defaults the state to active', () => {
    const props = {
      ...buildParticipationProps(),
      state: undefined
    } as unknown as GiveawayParticipationProps;
    const { result } = renderHook(() => useGiveawayParticipation(), {
      wrapper: wrapperFor(props)
    });
    expect(result.current.state).toBe('active');
  });

  it('does not expose presentation props', () => {
    const props = buildParticipationProps({
      className: 'p-4',
      hideBackground: true,
      device: 'mobile'
    });
    const { result } = renderHook(() => useGiveawayParticipation(), {
      wrapper: wrapperFor(props)
    });
    expect(result.current).not.toHaveProperty('className');
    expect(result.current).not.toHaveProperty('hideBackground');
    expect(result.current).not.toHaveProperty('device');
  });
});
