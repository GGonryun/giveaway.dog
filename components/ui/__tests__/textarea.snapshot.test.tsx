import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Textarea } from '../textarea';

describe('Textarea', () => {
  it('matches the snapshot', () => {
    const { container } = render(<Textarea placeholder="Describe the prize" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
