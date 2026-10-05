import { act, render } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it } from 'vitest';
import { Toaster } from '../toaster';

describe('Toaster', () => {
  afterEach(() => {
    act(() => {
      toast.dismiss();
    });
    localStorage.clear();
  });

  it('matches the snapshot without toasts', () => {
    const { container } = render(<Toaster />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
