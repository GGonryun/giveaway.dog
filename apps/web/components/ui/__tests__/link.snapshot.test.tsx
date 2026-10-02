import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Link } from '../link';

describe('Link', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <Link href="https://example.com/giveaways">Giveaways</Link>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
