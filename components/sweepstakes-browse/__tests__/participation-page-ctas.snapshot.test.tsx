import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ParticipationPageCTAs } from '../participation-page-ctas';

describe('ParticipationPageCTAs', () => {
  it('matches the snapshot', () => {
    const { container } = render(<ParticipationPageCTAs />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
