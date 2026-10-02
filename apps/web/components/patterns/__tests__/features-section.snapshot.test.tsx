import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeaturesSection } from '../features-section';

const renderFeaturesSection = async () => render(await FeaturesSection());

describe('FeaturesSection', () => {
  it('matches the snapshot', async () => {
    const { container } = await renderFeaturesSection();
    expect(container.firstChild).toMatchSnapshot();
  });
});
