'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      {...props}
      toastOptions={{
        classNames: {
          description: '!text-destructive-foreground',
          error:
            '!bg-destructive !text-destructive-foreground !border-destructive'
        }
      }}
    />
  );
};

export { Toaster };
