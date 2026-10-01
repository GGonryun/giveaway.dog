import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '../card';

describe('Card', () => {
  it('matches the snapshot for a complete card', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Summer giveaway</CardTitle>
          <CardDescription>Ends in 3 days</CardDescription>
          <CardAction>Edit</CardAction>
        </CardHeader>
        <CardContent>120 entries</CardContent>
        <CardFooter>Hosted by Giveaway.dog</CardFooter>
      </Card>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it.each([
    { name: 'Card', Component: Card, slot: 'card', base: 'rounded-xl' },
    {
      name: 'CardHeader',
      Component: CardHeader,
      slot: 'card-header',
      base: 'grid'
    },
    {
      name: 'CardTitle',
      Component: CardTitle,
      slot: 'card-title',
      base: 'font-semibold'
    },
    {
      name: 'CardDescription',
      Component: CardDescription,
      slot: 'card-description',
      base: 'text-muted-foreground'
    },
    {
      name: 'CardAction',
      Component: CardAction,
      slot: 'card-action',
      base: 'justify-self-end'
    },
    {
      name: 'CardContent',
      Component: CardContent,
      slot: 'card-content',
      base: 'px-4'
    },
    {
      name: 'CardFooter',
      Component: CardFooter,
      slot: 'card-footer',
      base: 'items-center'
    }
  ])(
    '$name marks its slot and merges a custom class name',
    ({ Component, slot, base }) => {
      render(<Component className="custom-class">Content</Component>);
      const element = screen.getByText('Content');
      expect(element.tagName).toBe('DIV');
      expect(element).toHaveAttribute('data-slot', slot);
      expect(element).toHaveClass(base, 'custom-class');
    }
  );

  it('forwards other props to the element', () => {
    render(
      <Card role="region" aria-label="Giveaway summary">
        Content
      </Card>
    );
    expect(
      screen.getByRole('region', { name: 'Giveaway summary' })
    ).toHaveAttribute('data-slot', 'card');
  });

  it('lets a custom padding override the default one', () => {
    render(<CardContent className="px-0">Content</CardContent>);
    const content = screen.getByText('Content');
    expect(content).toHaveClass('px-0');
    expect(content).not.toHaveClass('px-4');
  });
});
