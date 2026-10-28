import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBeforeUnload } from '../use-before-unload';

const unload = () => {
  const event = document.createEvent('BeforeUnloadEvent');
  event.initEvent('beforeunload', false, true);
  window.dispatchEvent(event);
  return event;
};

describe('useBeforeUnload', () => {
  it('asks the browser to confirm leaving while enabled', () => {
    renderHook(() => useBeforeUnload(true));

    const event = unload();

    expect(event.defaultPrevented).toBe(true);
  });

  it('lets the page unload while disabled', () => {
    renderHook(() => useBeforeUnload(false));

    const event = unload();

    expect(event.defaultPrevented).toBe(false);
  });

  it('stops asking once it is disabled', () => {
    const { rerender } = renderHook(({ enabled }) => useBeforeUnload(enabled), {
      initialProps: { enabled: true }
    });

    rerender({ enabled: false });
    const event = unload();

    expect(event.defaultPrevented).toBe(false);
  });

  it('starts asking once it is enabled', () => {
    const { rerender } = renderHook(({ enabled }) => useBeforeUnload(enabled), {
      initialProps: { enabled: false }
    });

    rerender({ enabled: true });
    const event = unload();

    expect(event.defaultPrevented).toBe(true);
  });

  it('stops asking when unmounted', () => {
    const { unmount } = renderHook(() => useBeforeUnload(true));

    unmount();
    const event = unload();

    expect(event.defaultPrevented).toBe(false);
  });
});
