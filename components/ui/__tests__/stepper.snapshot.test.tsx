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
  it('matches the snapshot for the second of three steps', () => {
    const { container } = renderStepper(2, 3);
    expect(container.firstChild).toMatchSnapshot();
  });
});
