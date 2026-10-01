import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';

const createdImages: HTMLImageElement[] = [];
const NativeImage = window.Image;

function renderAvatar() {
  return render(
    <Avatar className="size-12">
      <AvatarImage src="https://example.com/ada.png" alt="Ada Lovelace" />
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>
  );
}

function fireImageEvent(type: 'load' | 'error') {
  act(() => {
    createdImages.forEach((image) => image.dispatchEvent(new Event(type)));
  });
}

describe('Avatar', () => {
  beforeEach(() => {
    createdImages.length = 0;
    vi.stubGlobal('Image', function TrackedImage() {
      const image = new NativeImage();
      createdImages.push(image);
      return image;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('matches the snapshot while the image is loading', () => {
    const { container } = renderAvatar();
    expect(container.firstChild).toMatchSnapshot();
  });

  it('shows the fallback while the image is loading', () => {
    renderAvatar();
    expect(screen.getByText('AL')).toHaveClass('rounded-full', 'bg-muted');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('replaces the fallback with the image once it loads', () => {
    renderAvatar();
    fireImageEvent('load');
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute(
      'src',
      'https://example.com/ada.png'
    );
    expect(screen.getByRole('img')).toHaveClass('aspect-square', 'h-full');
    expect(screen.queryByText('AL')).not.toBeInTheDocument();
  });

  it('keeps the fallback when the image fails to load', () => {
    renderAvatar();
    fireImageEvent('error');
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('merges a custom class name on the root', () => {
    renderAvatar();
    const root = screen.getByText('AL').parentElement;
    expect(root).toHaveClass('size-12', 'rounded-full', 'overflow-hidden');
  });
});
