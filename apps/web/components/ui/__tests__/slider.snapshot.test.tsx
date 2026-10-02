import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Slider } from '../slider';

describe('Slider', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <Slider defaultValue={[25]} aria-label="Volume" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
