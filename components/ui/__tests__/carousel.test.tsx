import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '../carousel';

const { emblaApi, emblaRef, listeners, useEmblaCarousel } = vi.hoisted(() => {
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

  it('renders a carousel region with its slides', () => {
    renderCarousel();
    expect(screen.getByRole('region', { name: 'Prizes' })).toHaveAttribute(
      'aria-roledescription',
      'carousel'
    );
    const slides = screen.getAllByRole('group');
    expect(slides).toHaveLength(2);
    expect(slides[0]).toHaveAttribute('aria-roledescription', 'slide');
  });

  it('passes the options and the horizontal axis to Embla', () => {
    const plugins = [
      {
        name: 'autoplay',
        options: {},
        init: vi.fn(),
        destroy: vi.fn()
      }
    ];
    renderCarousel({ opts: { loop: true }, plugins });
    expect(useEmblaCarousel).toHaveBeenCalledWith(
      { loop: true, axis: 'x' },
      plugins
    );
  });

  it('enables the navigation buttons based on where Embla can scroll', () => {
    renderCarousel();
    expect(
      screen.getByRole('button', { name: 'Previous slide' })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeEnabled();
  });

  it('scrolls when the navigation buttons are clicked', async () => {
    emblaApi.canScrollPrev.mockReturnValue(true);
    renderCarousel();
    await userEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Previous slide' })
    );
    expect(emblaApi.scrollNext).toHaveBeenCalledTimes(1);
    expect(emblaApi.scrollPrev).toHaveBeenCalledTimes(1);
  });

  it('updates the buttons when Embla selects another slide', () => {
    renderCarousel();
    emblaApi.canScrollPrev.mockReturnValue(true);
    emblaApi.canScrollNext.mockReturnValue(false);

    act(() => {
      listeners.get('select')?.(emblaApi);
    });

    expect(
      screen.getByRole('button', { name: 'Previous slide' })
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled();
  });

  it('scrolls with the left and right arrow keys', () => {
    renderCarousel();
    const region = screen.getByRole('region', { name: 'Prizes' });
    fireEvent.keyDown(region, { key: 'ArrowRight' });
    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    fireEvent.keyDown(region, { key: 'ArrowDown' });
    expect(emblaApi.scrollNext).toHaveBeenCalledTimes(1);
    expect(emblaApi.scrollPrev).toHaveBeenCalledTimes(1);
  });

  it('hands the Embla API to setApi', () => {
    const setApi = vi.fn();
    renderCarousel({ setApi });
    expect(setApi).toHaveBeenCalledWith(emblaApi);
  });

  it('lays the slides out vertically', () => {
    renderCarousel({ orientation: 'vertical' });
    expect(useEmblaCarousel).toHaveBeenCalledWith({ axis: 'y' }, undefined);
    const [slide] = screen.getAllByRole('group');
    expect(slide).toHaveClass('pt-4');
    expect(slide.parentElement).toHaveClass('-mt-4', 'flex-col');
    expect(screen.getByRole('button', { name: 'Next slide' })).toHaveClass(
      'rotate-90'
    );
  });

  it('removes only its select listener when unmounted', () => {
    const { unmount } = renderCarousel();
    expect(emblaApi.on).toHaveBeenCalledWith('reInit', expect.any(Function));
    unmount();
    expect(emblaApi.off).toHaveBeenCalledTimes(1);
    expect(emblaApi.off).toHaveBeenCalledWith('select', expect.any(Function));
  });

  it('attaches the Embla ref to the viewport', () => {
    renderCarousel();
    const [viewport] = emblaRef.mock.calls[0];
    expect(viewport).toHaveAttribute('data-slot', 'carousel-content');
    expect(viewport).toHaveClass('overflow-hidden');
  });

  it('throws when a carousel part is rendered outside a Carousel', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<CarouselItem>Bike</CarouselItem>)).toThrow(
      'useCarousel must be used within a <Carousel />'
    );
  });
});
