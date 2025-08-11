import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { text } from '../foundations/text';
import { JSX } from 'react';

const typographyVariants = cva('', {
  variants: text,
  defaultVariants: {
    size: 'sm',
    weight: 'normal'
  }
});

const codeVariants = cva('bg-gray-100 border rounded-sm px-1 py-0.5', {
  variants: text,
  defaultVariants: {
    size: 'sm',
    weight: 'normal'
  }
});

const h1Variants = cva('', {
  variants: text,
  defaultVariants: {
    size: '3xl',
    weight: 'bold'
  }
});

const h2Variants = cva('', {
  variants: text,
  defaultVariants: {
    size: '2xl',
    weight: 'semibold'
  }
});

const h3Variants = cva('', {
  variants: text,
  defaultVariants: {
    size: 'xl',
    weight: 'semibold'
  }
});

const h4Variants = cva('', {
  variants: text,
  defaultVariants: {
    size: 'lg',
    weight: 'semibold'
  }
});

const h5Variants = cva('', {
  variants: text,
  defaultVariants: {
    size: 'base',
    weight: 'semibold'
  }
});

const h6Variants = cva('', {
  variants: text,
  defaultVariants: {
    size: 'sm',
    weight: 'semibold'
  }
});

const headerVariantMap = {
  1: h1Variants,
  2: h2Variants,
  3: h3Variants,
  4: h4Variants,
  5: h5Variants,
  6: h6Variants
} as const;

const captionVariants = cva('text-xs font-normal text-muted-foreground', {
  variants: text,
  defaultVariants: {
    size: 'xs',
    weight: 'normal'
  }
});

type HeaderLevel = 1 | 2 | 3 | 4 | 5 | 6;

type HeaderProps = {
  level: HeaderLevel;
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof h1Variants>;

type TypographyComponent = IntrinsicTypographyComponent<
  'div',
  typeof typographyVariants
> & {
  Code: IntrinsicTypographyComponent<'code', typeof codeVariants>;
  Text: IntrinsicTypographyComponent<'span', typeof typographyVariants>;
  Paragraph: IntrinsicTypographyComponent<'p', typeof typographyVariants>;
  Header: React.FC<HeaderProps>;
  Caption: IntrinsicTypographyComponent<'span', typeof typographyVariants>;
};

export const Typography: TypographyComponent = ({
  className,
  children,
  size,
  weight,
  color,
  leading,
  words,
  ...props
}) => {
  return (
    <div
      className={cn(
        typographyVariants({
          size,
          weight,
          color,
          leading,
          words
        }),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

type CVAOutput = ReturnType<typeof cva>;

type Props<TVariants extends (...args: any) => any> =
  VariantProps<TVariants> & {
    children: React.ReactNode;
    className?: string;
  };

type TypographyElement = Extract<
  keyof JSX.IntrinsicElements,
  'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'code' | 'div' | 'span'
>;

type IntrinsicTypographyComponent<
  TElement extends TypographyElement,
  TVariants extends (...args: any) => any
> = React.FC<
  VariantProps<TVariants> & {
    children: React.ReactNode;
  } & React.ComponentProps<TElement>
>;

function IntrinsicElement<
  T extends Props<TVariants>,
  TVariants extends (...args: any) => any
>(Component: TypographyElement, variants: CVAOutput): React.FC<T> {
  return ({ className, children, ...props }: T) => {
    return (
      <Component className={cn(variants(props), className)} {...props}>
        {children}
      </Component>
    );
  };
}

Typography.Paragraph = IntrinsicElement('p', typographyVariants);
Typography.Code = IntrinsicElement('code', codeVariants);
Typography.Text = IntrinsicElement('span', typographyVariants);
Typography.Caption = IntrinsicElement('span', captionVariants);

Typography.Header = ({
  level,
  className,
  children,
  size,
  weight,
  color,
  leading,
  words,
  ...props
}) => {
  const Component = `h${level}` as const;
  const variants = headerVariantMap[level];

  return (
    <Component
      className={cn(
        variants({ size, weight, color, leading, words }),
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
