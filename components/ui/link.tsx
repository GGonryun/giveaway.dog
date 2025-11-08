import NextLink from 'next/link';
import { Slot } from '@radix-ui/react-slot';

export function Link({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<typeof NextLink> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : NextLink;

  return <Comp {...props} />;
}
