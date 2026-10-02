import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HowItWorksSection } from '../how-it-works-section';

const makeSteps = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    title: `Step title ${index + 1}`,
    description: `Step description ${index + 1}`
  }));

const stepGrid = (container: HTMLElement) =>
  container.querySelector('.grid') as HTMLElement;

describe('HowItWorksSection', () => {
  it('shows the section title as a heading', () => {
    render(<HowItWorksSection title="How it works" steps={makeSteps(3)} />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'How it works' })
    ).toBeInTheDocument();
  });

  it('numbers each step in order with its title and description', () => {
    const { container } = render(
      <HowItWorksSection title="How it works" steps={makeSteps(3)} />
    );
    const steps = Array.from(stepGrid(container).children) as HTMLElement[];
    expect(steps).toHaveLength(3);
    steps.forEach((step, index) => {
      expect(within(step).getByText(String(index + 1))).toBeInTheDocument();
      expect(
        within(step).getByRole('heading', {
          level: 4,
          name: `Step title ${index + 1}`
        })
      ).toBeInTheDocument();
      expect(
        within(step).getByText(`Step description ${index + 1}`)
      ).toBeInTheDocument();
    });
  });

  it.each([
    [3, 'md:grid-cols-3'],
    [4, 'md:grid-cols-4']
  ])('lays out %i steps with the %s class', (count, className) => {
    const { container } = render(
      <HowItWorksSection title="Steps" steps={makeSteps(count)} />
    );
    expect(stepGrid(container)).toHaveClass(className);
  });

  it.each([2, 5])(
    'falls back to two medium columns and a dynamic large column count for %i steps',
    (count) => {
      const { container } = render(
        <HowItWorksSection title="Steps" steps={makeSteps(count)} />
      );
      expect(stepGrid(container)).toHaveClass(
        'md:grid-cols-2',
        `lg:grid-cols-${count}`
      );
    }
  );

  it('renders an empty grid when there are no steps', () => {
    const { container } = render(
      <HowItWorksSection title="Steps" steps={[]} />
    );
    expect(stepGrid(container)).toBeEmptyDOMElement();
  });
});
