import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stepper } from '../stepper';

function renderStepper(currentStep: number, totalSteps: number) {
  const { container } = render(
    <Stepper currentStep={currentStep} totalSteps={totalSteps} />
  );
  const root = container.firstElementChild as HTMLElement;
  const steps = Array.from(root.children).map((step) => ({
    indicator: step.children[0] as HTMLElement,
    connector: step.children[1] as HTMLElement | undefined
  }));
  return { container, root, steps };
}

describe('Stepper', () => {
  it('renders one indicator per step', () => {
    const { steps } = renderStepper(1, 4);
    expect(steps).toHaveLength(4);
  });

  it('shows a check mark for completed steps and numbers for the others', () => {
    const { steps } = renderStepper(3, 4);
    expect(steps[0].indicator.querySelector('svg')).toBeInTheDocument();
    expect(steps[0].indicator).toHaveTextContent('');
    expect(steps[1].indicator.querySelector('svg')).toBeInTheDocument();
    expect(steps[2].indicator).toHaveTextContent('3');
    expect(steps[3].indicator).toHaveTextContent('4');
    expect(steps[2].indicator.querySelector('svg')).not.toBeInTheDocument();
  });

  it('styles completed, current and upcoming steps differently', () => {
    const { steps } = renderStepper(2, 3);
    expect(steps[0].indicator).toHaveClass(
      'bg-primary',
      'text-primary-foreground'
    );
    expect(steps[1].indicator).toHaveClass(
      'border-primary',
      'text-primary',
      'bg-background'
    );
    expect(steps[2].indicator).toHaveClass(
      'border-muted-foreground',
      'text-muted-foreground'
    );
  });

  it('connects the steps with lines that fill once a step is completed', () => {
    const { steps } = renderStepper(2, 3);
    expect(steps[0].connector).toHaveClass('bg-primary');
    expect(steps[1].connector).toHaveClass('bg-muted-foreground/30');
    expect(steps[2].connector).toBeUndefined();
  });

  it('treats every step as upcoming when the current step is zero', () => {
    const { steps } = renderStepper(0, 2);
    steps.forEach(({ indicator }) => {
      expect(indicator).toHaveClass('border-muted-foreground');
    });
  });

  it('treats every step as completed when the current step is past the end', () => {
    const { steps } = renderStepper(5, 3);
    steps.forEach(({ indicator }) => {
      expect(indicator).toHaveClass('bg-primary');
      expect(indicator.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('renders an empty container when there are no steps', () => {
    const { root } = renderStepper(1, 0);
    expect(root).toBeEmptyDOMElement();
  });

  it('merges a custom class name', () => {
    const { container } = render(
      <Stepper currentStep={1} totalSteps={2} className="mb-6" />
    );
    expect(container.firstChild).toHaveClass('mb-6', 'flex', 'justify-center');
  });
});
