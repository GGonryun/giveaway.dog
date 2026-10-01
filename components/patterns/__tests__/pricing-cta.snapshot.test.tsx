import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CallToAction } from '../pricing-cta';

describe('CallToAction', () => {
  it('matches the snapshot', () => {
    const { container } = render(<CallToAction />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
