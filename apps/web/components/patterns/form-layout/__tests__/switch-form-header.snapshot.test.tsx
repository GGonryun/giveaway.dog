import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SwitchBox } from '../switch-form-header';

describe('SwitchBox', () => {
  it('matches the snapshot', () => {
    const { container } = render(<SwitchBox>Notify winners</SwitchBox>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
