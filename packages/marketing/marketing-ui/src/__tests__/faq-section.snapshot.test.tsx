import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FaqSection } from '../faq-section';

describe('FaqSection', () => {
  it('matches the snapshot of the page header', () => {
    render(<FaqSection />);
    expect(
      screen.getByRole('heading', { level: 1 }).parentElement
    ).toMatchSnapshot();
  });
});
