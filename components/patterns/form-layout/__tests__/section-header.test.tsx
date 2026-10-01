import { render, screen } from '@testing-library/react';
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
  it('shows the label as a section heading', () => {
    renderSection();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Prizes' })
    ).toBeInTheDocument();
  });

  it('shows the description under the label', () => {
    renderSection();
    expect(screen.getByText('What winners receive').tagName).toBe('P');
  });

  it('renders the children below the sticky header', () => {
    renderSection();
    const header = screen.getByRole('heading').closest('.sticky');
    const body = screen.getByText('First prize').parentElement;
    expect(header).not.toContainElement(body);
    expect(body).toHaveTextContent('First prizeSecond prize');
  });

  it('adds a custom class to the sticky header', () => {
    renderSection('bg-muted');
    const header = screen.getByRole('heading').closest('.sticky');
    expect(header).toHaveClass('bg-muted', 'top-0');
    expect(header).not.toHaveClass('bg-background');
  });

  it('matches the snapshot', () => {
    const { container } = renderSection();
    expect(container.firstChild).toMatchSnapshot();
  });
});
