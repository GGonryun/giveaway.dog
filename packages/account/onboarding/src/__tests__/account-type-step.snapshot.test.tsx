import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccountTypeStep } from '../account-type-step';

describe('AccountTypeStep', () => {
  it('matches the snapshot', () => {
    const { container } = render(<AccountTypeStep onNext={vi.fn()} />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
