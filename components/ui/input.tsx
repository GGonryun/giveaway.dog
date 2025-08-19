import * as React from 'react';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export function Input({
  className,
  type,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground bg-white selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-white file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  );
}

interface SpecialInputProps extends React.ComponentProps<'input'> {
  startIcon?: LucideIcon;
  endButton?: React.ReactNode;
  inputClassName?: string;
}

export const SpecialInput = React.forwardRef<
  HTMLInputElement,
  SpecialInputProps
>(
  (
    { className, inputClassName, type, startIcon, endButton, ...props },
    ref
  ) => {
    const inputClasses = cn(
      'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-white text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-white file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
      'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
      // Adjust padding based on presence of icons/buttons
      startIcon && !endButton && 'pl-9 pr-3 py-1',
      !startIcon && endButton && 'pl-3 pr-9 py-1',
      startIcon && endButton && 'pl-9 pr-9 py-1',
      !startIcon && !endButton && 'px-3 py-1',
      inputClassName
    );

    // If no icons or buttons, return the simple input
    if (!startIcon && !endButton) {
      return (
        <input
          type={type}
          data-slot="input"
          className={inputClasses}
          ref={ref}
          {...props}
        />
      );
    }

    const StartIcon = startIcon;
    // Return wrapped input with icons/buttons
    return (
      <div className={cn('relative flex items-center w-full', className)}>
        {StartIcon && (
          <div className="absolute left-2.5 flex items-center justify-center text-muted-foreground pointer-events-none z-10">
            <StartIcon className="h-4 w-4" />
          </div>
        )}

        <input
          type={type}
          data-slot="input"
          className={inputClasses}
          ref={ref}
          {...props}
        />

        {endButton && (
          <div className="absolute right-1 flex items-center justify-center z-10">
            {endButton}
          </div>
        )}
      </div>
    );
  }
);

SpecialInput.displayName = 'Input';

// Usage examples:
//
// Basic input (unchanged behavior):
// <Input placeholder="Enter text..." />
//
// With start icon:
// <Input
//   startIcon={<SearchIcon className="h-4 w-4" />}
//   placeholder="Search..."
// />
//
// With end button:
// <Input
//   endButton={<Button size="sm" variant="ghost"><EyeIcon className="h-4 w-4" /></Button>}
//   type="password"
//   placeholder="Password"
// />
//
// With both:
// <Input
//   startIcon={<UserIcon className="h-4 w-4" />}
//   endButton={<Button size="sm" variant="ghost"><XIcon className="h-4 w-4" /></Button>}
//   placeholder="Username"
// />
