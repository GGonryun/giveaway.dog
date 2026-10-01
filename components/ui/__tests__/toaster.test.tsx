import { act, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { toast } from 'sonner';
import { afterEach, describe, expect, it } from 'vitest';
import { Toaster } from '../toaster';

function getToaster() {
  return document.querySelector('[data-sonner-toaster]');
}

async function showToast(message: string) {
  act(() => {
    toast(message);
  });
  await screen.findByText(message);
}

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

  it('renders an empty notifications region', () => {
    render(<Toaster />);
    expect(
      screen.getByRole('region', { name: /Notifications/ })
    ).toBeEmptyDOMElement();
  });

  it('shows toasts in a styled list', async () => {
    render(<Toaster />);
    await showToast('Giveaway saved');
    const toaster = getToaster();
    expect(toaster).toHaveClass('toaster', 'group');
    expect(toaster).toHaveStyle({
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)'
    });
  });

  it('falls back to the system theme without a theme provider', async () => {
    render(<Toaster />);
    await showToast('Giveaway saved');
    expect(getToaster()).toHaveAttribute('data-sonner-theme', 'light');
  });

  it('follows the theme from next-themes', async () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <Toaster />
      </ThemeProvider>
    );
    await showToast('Giveaway saved');
    expect(getToaster()).toHaveAttribute('data-sonner-theme', 'dark');
  });

  it('forwards sonner props such as the position', async () => {
    render(<Toaster position="top-center" />);
    await showToast('Giveaway saved');
    expect(getToaster()).toHaveAttribute('data-y-position', 'top');
    expect(getToaster()).toHaveAttribute('data-x-position', 'center');
  });
});
