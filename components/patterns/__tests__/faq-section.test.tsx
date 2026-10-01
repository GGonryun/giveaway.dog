import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FaqSection } from '../faq-section';

const question = (name: string) => screen.getByRole('button', { name });

describe('FaqSection', () => {
  it('introduces the questions with a page header', () => {
    render(<FaqSection />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Frequently Asked Questions'
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Everything you need to know about Giveaway.dog')
    ).toBeInTheDocument();
  });

  it('lists every question in order', () => {
    render(<FaqSection />);
    const questions = screen.getAllByRole('button');
    expect(questions).toHaveLength(11);
    expect(questions[0]).toHaveTextContent(
      'Why switch from Gleam or SocialMan?'
    );
    expect(questions[10]).toHaveTextContent('I have another question');
  });

  it('starts with every answer collapsed', () => {
    render(<FaqSection />);
    screen.getAllByRole('button').forEach((button) => {
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('reveals an answer when its question is clicked', async () => {
    render(<FaqSection />);
    await userEvent.click(question('Can I cancel anytime?'));
    expect(question('Can I cancel anytime?')).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('region')).toHaveTextContent(
      'You can cancel your Pro subscription at any time'
    );
  });

  it('keeps only one answer open at a time', async () => {
    render(<FaqSection />);
    await userEvent.click(question('Can I cancel anytime?'));
    await userEvent.click(question('Can I get a refund?'));
    expect(screen.getAllByRole('region')).toHaveLength(1);
    expect(screen.getByRole('region')).toHaveTextContent(
      'money-back guarantee'
    );
    expect(question('Can I cancel anytime?')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('collapses an open answer when its question is clicked again', async () => {
    render(<FaqSection />);
    await userEvent.click(question('Can I cancel anytime?'));
    await userEvent.click(question('Can I cancel anytime?'));
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
