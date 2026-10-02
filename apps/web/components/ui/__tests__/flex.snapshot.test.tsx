import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Flex } from '../flex';

describe('Flex', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <Flex gap="md" center>
        <span>One</span>
        <span>Two</span>
      </Flex>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('Flex.Stack', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <Flex.Stack gap="sm">
        <span>One</span>
        <span>Two</span>
      </Flex.Stack>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
