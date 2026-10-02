import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NavigationHeader } from '../navigation-header';

describe('NavigationHeader', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <NavigationHeader>
        <span>Logo</span>
      </NavigationHeader>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
