import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GiveawayDesignBackgroundSchema,
  GiveawayDesignSchema,
  GradientBackgroundSchema
} from '@giveaway/sweepstakes-model/schemas';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@giveaway/testing-dom/stable-dom';
import { BackgroundFields, Design } from '../design';

const buildDesign = (
  overrides: Partial<GiveawayDesignSchema> = {}
): GiveawayDesignSchema => ({
  displayName: true,
  displayDescription: true,
  aspectRatio: 'VIDEO',
  background: { type: 'color', color: '#123456' },
  ...overrides
});

const valuesWith = (design: GiveawayDesignSchema) =>
  buildFormValues({ design });

const gradient = (
  overrides: Partial<GradientBackgroundSchema> = {}
): GradientBackgroundSchema => ({
  type: 'gradient',
  format: 'linear',
  angle: 90,
  stops: [
    { color: '#ff0000', position: 0 },
    { color: '#0000ff', position: 50 }
  ],
  ...overrides
});

const renderBackground = (background: GiveawayDesignBackgroundSchema) =>
  renderWithForm(
    (form) => <BackgroundFields form={form} fieldPath="design" />,
    { values: valuesWith(buildDesign({ background })) }
  );

const openGradientEditor = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Modify' }));
  return screen.getByRole('dialog');
};

describe('Design', () => {
  it('matches the snapshot', () => {
    const { container } = renderWithForm(<Design />, {
      values: valuesWith(buildDesign())
    });
    expect(stabilizeIds(container)).toMatchSnapshot();
  });
});

describe('BackgroundFields', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('with a solid color background', () => {
    it('matches the snapshot', () => {
      const { container } = renderBackground({
        type: 'color',
        color: '#123456'
      });
      expect(stabilizeIds(container)).toMatchSnapshot();
    });
  });

  describe('with a gradient background', () => {
    it('matches the snapshot', () => {
      const { container } = renderBackground(gradient());
      expect(stabilizeIds(container)).toMatchSnapshot();
    });

    it('matches the snapshot of the gradient editor', async () => {
      renderBackground(gradient());
      expect(stabilizeIds(await openGradientEditor())).toMatchSnapshot();
    });
  });
});
