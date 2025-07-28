import * as React from 'react';

const TABLET_BREAKPOINT = 1024; // Define the breakpoint for tablet (common value)
export const useIsTablet = () => {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`); // 1024 is a common tablet breakpoint
    const onChange = () => {
      setIsTablet(window.innerWidth <= TABLET_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsTablet(window.innerWidth <= TABLET_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isTablet;
};
