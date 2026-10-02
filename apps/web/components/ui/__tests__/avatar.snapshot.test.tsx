import { render } from '@testing-library/react';
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
});
