import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeaturesSection } from '../features-section';

const renderFeaturesSection = async () => render(await FeaturesSection());

describe('FeaturesSection', () => {
  it('introduces the features with a highlighted heading', async () => {
    await renderFeaturesSection();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Everything you need to run successful giveaways'
      })
    ).toBeInTheDocument();
    expect(screen.getByText('run successful giveaways')).toHaveClass(
      'text-primary'
    );
  });

  it.each([
    ['Launch Giveaways in Minutes', /plug-and-play templates/],
    ['Edit Everything, Instantly', /intuitive visual editor/],
    ['No Bots. No Spam. Just Real Fans.', /automated fraud detection/],
    ['Fair Pricing & Full Ownership', /no monthly subscriptions/]
  ])('describes the "%s" feature', async (title, description) => {
    await renderFeaturesSection();
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('renders one card per feature', async () => {
    const { container } = await renderFeaturesSection();
    expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(4);
  });

  it('matches the snapshot', async () => {
    const { container } = await renderFeaturesSection();
    expect(container.firstChild).toMatchSnapshot();
  });
});
