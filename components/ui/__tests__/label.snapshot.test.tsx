import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Label } from '../label';

describe('Label', () => {
  it('matches the snapshot', () => {
    const { container } = render(<Label htmlFor="email">Email</Label>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
