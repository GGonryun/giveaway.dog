import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToolCta } from '../tool-cta';

describe('ToolCta', () => {
  it('matches the snapshot', () => {
    const { container } = render(<ToolCta />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
