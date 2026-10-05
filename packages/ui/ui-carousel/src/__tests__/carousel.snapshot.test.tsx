import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '../carousel';

const { emblaApi, listeners, useEmblaCarousel } = vi.hoisted(() => {
  const listeners = new Map<string, (api: unknown) => void>();
  const emblaApi = {
    canScrollPrev: vi.fn(() => false),
    canScrollNext: vi.fn(() => true),
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
    on: vi.fn((event: string, callback: (api: unknown) => void) => {
      listeners.set(event, callback);
      return emblaApi;
    }),
    off: vi.fn()
  };
  const emblaRef = vi.fn((node: HTMLElement | null) => node);
  const useEmblaCarousel = vi.fn(() => [emblaRef, emblaApi]);
  return { emblaApi, emblaRef, listeners, useEmblaCarousel };
});

vi.mock('embla-carousel-react', () => ({ default: useEmblaCarousel }));

function renderCarousel(
  props: Partial<React.ComponentProps<typeof Carousel>> = {}
) {
  return render(
    <Carousel aria-label="Prizes" {...props}>
      <CarouselContent>
        <CarouselItem>Bike</CarouselItem>
        <CarouselItem>Helmet</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

describe('Carousel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    emblaApi.canScrollPrev.mockReturnValue(false);
    emblaApi.canScrollNext.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('matches the snapshot', () => {
    const { container } = renderCarousel();
    expect(container.firstChild).toMatchSnapshot();
  });
});
