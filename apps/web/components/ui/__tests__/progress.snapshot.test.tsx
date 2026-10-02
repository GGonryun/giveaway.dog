import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Progress } from '../progress';

describe('Progress', () => {
  it('matches the snapshot', () => {
    const { container } = render(<Progress value={40} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
