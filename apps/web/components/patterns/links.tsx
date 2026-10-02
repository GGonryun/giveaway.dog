import Link from 'next/link';

export const NonNavigationalLink: React.FC<
  Omit<React.ComponentProps<typeof Link>, 'shallow' | 'prefetch' | 'scroll'>
> = ({ ...props }) => {
  return (
    <Link
      {...props}
      shallow
      prefetch={false}
      scroll={false}
      onClick={(e) => {
        // ⛔ if user is opening in a new tab/window, don't intercept
        if (
          e.metaKey || // cmd-click (Mac)
          e.ctrlKey || // ctrl-click (Win)
          e.shiftKey || // shift-click
          e.altKey || // alt-click
          e.button !== 0 // not left click
        ) {
          return; // allow default browser behavior
        }
        e.preventDefault();
        e.stopPropagation();

        props.onClick?.(e);
      }}
    />
  );
};
