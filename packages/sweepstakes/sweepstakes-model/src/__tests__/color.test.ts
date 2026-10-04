import { describe, it, expect } from 'vitest';
import { toGradient, toBackgroundStyle } from '../color';
import type {
  GiveawayDesignBackgroundSchema,
  GradientBackgroundSchema
} from '../schemas';

const gradient = (
  overrides: Partial<GradientBackgroundSchema> = {}
): GradientBackgroundSchema => ({
  type: 'gradient',
  format: 'linear',
  angle: 45,
  stops: [
    { color: '#ff0000', position: 0 },
    { color: '#0000ff', position: 100 }
  ],
  ...overrides
});

describe('toGradient', () => {
  it('builds a linear gradient using the angle', () => {
    expect(toGradient(gradient())).toBe(
      'linear-gradient(45deg, #ff0000 0%, #0000ff 100%)'
    );
  });

  it('builds a circular radial gradient and ignores the angle', () => {
    expect(toGradient(gradient({ format: 'radial', angle: 270 }))).toBe(
      'radial-gradient(circle, #ff0000 0%, #0000ff 100%)'
    );
  });

  it('keeps the stop order and supports fractional positions', () => {
    expect(
      toGradient(
        gradient({
          angle: 0,
          stops: [
            { color: '#fff', position: 12.5 },
            { color: '#000', position: 3 },
            { color: '#abc', position: 99 }
          ]
        })
      )
    ).toBe('linear-gradient(0deg, #fff 12.5%, #000 3%, #abc 99%)');
  });

  it('produces an empty stop list when there are no stops', () => {
    expect(toGradient(gradient({ stops: [] }))).toBe(
      'linear-gradient(45deg, )'
    );
  });
});

describe('toBackgroundStyle', () => {
  it('returns the raw color for a solid background', () => {
    expect(toBackgroundStyle({ type: 'color', color: '#123456' })).toBe(
      '#123456'
    );
  });

  it('returns the CSS gradient for a gradient background', () => {
    expect(toBackgroundStyle(gradient({ format: 'radial' }))).toBe(
      'radial-gradient(circle, #ff0000 0%, #0000ff 100%)'
    );
  });

  it("falls back to the 'bg-secondary' class for an unknown type", () => {
    expect(
      toBackgroundStyle({
        type: 'image'
      } as unknown as GiveawayDesignBackgroundSchema)
    ).toBe('bg-secondary');
  });
});
