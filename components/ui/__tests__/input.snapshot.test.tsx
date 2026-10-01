import { render } from '@testing-library/react';
import { Search } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Input, SpecialInput } from '../input';

describe('Input', () => {
  it('matches the snapshot', () => {
    const { container } = render(<Input placeholder="Email" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('SpecialInput', () => {
  it('matches the snapshot without decorations', () => {
    const { container } = render(<SpecialInput placeholder="Search" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches the snapshot with a start icon and an end button', () => {
    const { container } = render(
      <SpecialInput
        placeholder="Search"
        startIcon={Search}
        endButton={<button type="button">Clear</button>}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
