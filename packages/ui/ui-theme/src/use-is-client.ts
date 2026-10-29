import { useSyncExternalStore } from 'react';

// Stryker disable next-line ArrowFunction: React ignores an unsubscribe that returns undefined, and this store never changes
const subscribe = () => () => {};

export const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
