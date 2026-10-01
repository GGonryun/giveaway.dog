import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HostCTA } from '../host-cta';

describe('HostCTA', () => {
  it('matches the snapshot', () => {
    const { container } = render(<HostCTA />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
