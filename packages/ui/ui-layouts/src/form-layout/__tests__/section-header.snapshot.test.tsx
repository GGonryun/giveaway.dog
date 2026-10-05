import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UnifiedSectionHeader } from '../section-header';

const renderSection = (className?: string) =>
  render(
    <UnifiedSectionHeader
      label="Prizes"
      description="What winners receive"
      className={className}
    >
      <p>First prize</p>
      <p>Second prize</p>
    </UnifiedSectionHeader>
  );

describe('UnifiedSectionHeader', () => {
  it('matches the snapshot', () => {
    const { container } = renderSection();
    expect(container.firstChild).toMatchSnapshot();
  });
});
