import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Logo,
  LogoBrandDownload,
  LogoImage,
  LogoImageDesktop,
  LogoImageMobile,
  LogoText,
  LogoTextDesktop,
  LogoTextMobile
} from '../logo';

describe('Logo', () => {
  it('links to the given url and merges a custom class name', () => {
    render(
      <Logo url="https://example.com" className="gap-4">
        <LogoText>Giveaway.dog</LogoText>
      </Logo>
    );
    const link = screen.getByRole('link', { name: 'Giveaway.dog' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveClass('flex', 'max-h-8', 'gap-4');
    expect(link).not.toHaveClass('gap-2');
  });

  it('forwards other anchor props', () => {
    render(
      <Logo url="https://example.com" aria-label="Home" title="Go home">
        <LogoText>Giveaway.dog</LogoText>
      </Logo>
    );
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'title',
      'Go home'
    );
  });
});

describe('logo images', () => {
  it.each([
    { name: 'LogoImage', Component: LogoImage, classNames: ['block', 'h-8'] },
    {
      name: 'LogoImageMobile',
      Component: LogoImageMobile,
      classNames: ['flex', 'md:hidden']
    },
    {
      name: 'LogoImageDesktop',
      Component: LogoImageDesktop,
      classNames: ['hidden', 'md:flex']
    }
  ])(
    '$name renders the image with its responsive classes',
    ({ Component, classNames }) => {
      render(
        <Component
          src="https://example.com/logo.svg"
          alt="Giveaway.dog"
          className="w-auto"
        />
      );
      const image = screen.getByRole('img', { name: 'Giveaway.dog' });
      expect(image).toHaveAttribute('src', 'https://example.com/logo.svg');
      expect(image).toHaveClass(...classNames, 'w-auto');
    }
  );
});

describe('logo text', () => {
  it.each([
    { name: 'LogoText', Component: LogoText, classNames: ['text-lg'] },
    {
      name: 'LogoTextMobile',
      Component: LogoTextMobile,
      classNames: ['text-lg', 'md:hidden']
    },
    {
      name: 'LogoTextDesktop',
      Component: LogoTextDesktop,
      classNames: ['hidden', 'md:flex']
    }
  ])(
    '$name renders the text with its responsive classes',
    ({ Component, classNames }) => {
      render(<Component className="text-primary">Giveaway.dog</Component>);
      expect(screen.getByText('Giveaway.dog')).toHaveClass(
        ...classNames,
        'font-semibold',
        'text-primary'
      );
    }
  );
});

describe('LogoBrandDownload', () => {
  const files = [
    { name: 'logo.svg', path: '/brand/logo.svg', format: 'svg' as const },
    { name: 'logo.png', path: '/brand/logo.png', format: 'png' as const }
  ];

  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:logo')
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn()
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(URL, 'createObjectURL');
    Reflect.deleteProperty(URL, 'revokeObjectURL');
  });

  function renderDownload() {
    render(
      <LogoBrandDownload files={files} className="p-2">
        <span>Brand logo</span>
      </LogoBrandDownload>
    );
    fireEvent.contextMenu(screen.getByText('Brand logo'));
  }

  it('wraps the logo in an inline trigger', () => {
    render(
      <LogoBrandDownload files={files} className="p-2">
        <span>Brand logo</span>
      </LogoBrandDownload>
    );
    expect(screen.getByText('Brand logo').parentElement).toHaveClass(
      'inline-block',
      'p-2'
    );
  });

  it('offers a download item per file on right click', () => {
    renderDownload();
    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent)
    ).toEqual(['Download SVG', 'Download PNG']);
  });

  it('downloads the chosen file through a temporary link', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('<svg />'));
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    renderDownload();

    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Download SVG' })
    );

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(fetchMock).toHaveBeenCalledWith('/brand/logo.svg');
    expect(link.download).toBe('logo.svg');
    expect(link.href).toBe('blob:logo');
    expect(link.isConnected).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:logo');
  });

  it('logs an error and does not download when the file cannot be fetched', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 404 })
    );
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    renderDownload();

    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Download PNG' })
    );

    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to download file:',
        new Error('Failed to fetch logo.png')
      )
    );
    expect(click).not.toHaveBeenCalled();
  });
});
