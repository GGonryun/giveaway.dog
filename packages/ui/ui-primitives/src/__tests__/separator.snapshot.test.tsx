import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Separator } from '../separator';

describe('Separator', () => {
  it('matches the snapshot for the horizontal orientation', () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches the snapshot for the vertical orientation', () => {
    const { container } = render(<Separator orientation="vertical" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
