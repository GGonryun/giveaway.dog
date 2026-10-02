import { render } from '@testing-library/react';
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
});
