import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from '../skeleton';

describe('Skeleton', () => {
  it('matches the snapshot', () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
