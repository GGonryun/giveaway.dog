import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Calendar } from '../calendar';

const january2024 = new Date(2024, 0, 1);

describe('Calendar', () => {
  it('matches the snapshot of the month navigation', () => {
    render(<Calendar mode="single" defaultMonth={january2024} />);
    expect(screen.getByRole('navigation')).toMatchSnapshot();
  });
});
