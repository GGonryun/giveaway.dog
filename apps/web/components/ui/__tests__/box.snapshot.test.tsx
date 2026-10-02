import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Box } from '../box';

describe('Box', () => {
  it('matches the snapshot with spacing variants', () => {
    const { container } = render(
      <Box sy="md" p="lg" mb="sm">
        Content
      </Box>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
