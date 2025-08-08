import * as React from 'react';

// https://tailwindcss.com/docs/responsive-design
// --breakpoint-lg
const LAPTOP_BREAKPOINT = 1024; // px

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${LAPTOP_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsTablet(window.innerWidth < LAPTOP_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsTablet(window.innerWidth < LAPTOP_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return { isTablet: !!isTablet, isLoading: isTablet === undefined };
}
