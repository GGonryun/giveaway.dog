export const text = {
  size: {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-md',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl'
  },
  weight: {
    thin: 'font-thin',
    extralight: 'font-extralight',
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  },
  color: {
    primary: 'text-primary',
    muted: 'text-muted-foreground',
    white: 'text-white',
    destructive: 'text-red-500'
  },
  leading: {
    none: 'leading-none',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
    xs: 'leading-1',
    sm: 'leading-2',
    md: 'leading-3',
    lg: 'leading-4',
    xl: 'leading-5'
  },
  words: {
    break: 'break-words overflow-x-auto'
  }
} as const;
