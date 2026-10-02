import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RadioGroup, RadioGroupItem } from '../radio-group';

function renderRadioGroup(onValueChange = vi.fn()) {
  const result = render(
    <RadioGroup
      defaultValue="host"
      onValueChange={onValueChange}
      aria-label="Account type"
    >
      <RadioGroupItem value="host" aria-label="Host" />
      <RadioGroupItem value="participate" aria-label="Participate" />
      <RadioGroupItem value="both" aria-label="Both" disabled />
    </RadioGroup>
  );
  return { ...result, onValueChange };
}

describe('RadioGroup', () => {
  it('matches the snapshot', () => {
    const { container } = renderRadioGroup();
    expect(container.firstChild).toMatchSnapshot();
  });
});
