import { render } from '@testing-library/react';
import { Trash2Icon } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { IconButton } from '../icon-button';

describe('IconButton', () => {
  it('matches the snapshot', () => {
    const { container } = render(<IconButton icon={Trash2Icon} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
