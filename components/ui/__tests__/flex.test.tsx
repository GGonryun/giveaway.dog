import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Flex } from '../flex';

type FlexVariantProps = Omit<React.ComponentProps<typeof Flex>, 'children'>;

describe('Flex', () => {
  it('renders a flex container with its children', () => {
    render(
      <Flex data-testid="flex">
        <span>One</span>
      </Flex>
    );
    const flex = screen.getByTestId('flex');
    expect(flex).toHaveClass('flex');
    expect(flex).toContainElement(screen.getByText('One'));
  });

  it.each<[FlexVariantProps, string[]]>([
    [{ gap: 'xs' }, ['gap-1']],
    [{ gap: 'xl' }, ['gap-5']],
    [{ full: true }, ['h-full', 'w-full']],
    [{ full: 'width' }, ['w-full']],
    [{ full: 'height' }, ['h-full']],
    [{ center: true }, ['items-center', 'justify-center']]
  ])('maps %o to the %s classes', (props, classNames) => {
    render(
      <Flex data-testid="flex" {...props}>
        Content
      </Flex>
    );
    expect(screen.getByTestId('flex')).toHaveClass(...classNames);
  });

  it('merges a custom class name', () => {
    render(
      <Flex data-testid="flex" className="flex-wrap">
        Content
      </Flex>
    );
    expect(screen.getByTestId('flex')).toHaveClass('flex', 'flex-wrap');
  });

  it('does not apply the items variant and forwards it as an attribute', () => {
    render(
      <Flex data-testid="flex" items="center">
        Content
      </Flex>
    );
    const flex = screen.getByTestId('flex');
    expect(flex).not.toHaveClass('items-center');
    expect(flex).toHaveAttribute('items', 'center');
  });
});

describe('Flex.Stack', () => {
  it('stacks its children in a column', () => {
    render(
      <Flex.Stack data-testid="stack" gap="lg" full="width">
        Content
      </Flex.Stack>
    );
    expect(screen.getByTestId('stack')).toHaveClass(
      'flex',
      'flex-col',
      'gap-4',
      'w-full'
    );
  });
});
