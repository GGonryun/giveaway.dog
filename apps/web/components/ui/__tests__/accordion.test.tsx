import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '../accordion';

function FaqItems() {
  return (
    <>
      <AccordionItem value="entries">
        <AccordionTrigger>How do entries work?</AccordionTrigger>
        <AccordionContent>Each action earns entries.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="winners">
        <AccordionTrigger>How are winners picked?</AccordionTrigger>
        <AccordionContent>Winners are drawn at random.</AccordionContent>
      </AccordionItem>
    </>
  );
}

function renderSingle(
  props: { defaultValue?: string; onValueChange?: (value: string) => void } = {}
) {
  return render(
    <Accordion type="single" collapsible {...props}>
      <FaqItems />
    </Accordion>
  );
}

describe('Accordion', () => {
  it('renders each trigger as a button inside a heading', () => {
    renderSingle();
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(2);
    expect(
      within(headings[0]).getByRole('button', { name: 'How do entries work?' })
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the content hidden until the item is expanded', async () => {
    renderSingle();
    expect(
      screen.queryByText('Each action earns entries.')
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'How do entries work?' })
    );

    expect(
      screen.getByRole('region', { name: 'How do entries work?' })
    ).toHaveTextContent('Each action earns entries.');
    expect(
      screen.getByRole('button', { name: 'How do entries work?' })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes the open item when another one is opened', async () => {
    renderSingle({ defaultValue: 'entries' });
    await userEvent.click(
      screen.getByRole('button', { name: 'How are winners picked?' })
    );
    expect(
      screen.queryByText('Each action earns entries.')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Winners are drawn at random.')).toBeVisible();
  });

  it('collapses the open item when its trigger is clicked again', async () => {
    const onValueChange = vi.fn();
    renderSingle({ defaultValue: 'entries', onValueChange });
    await userEvent.click(
      screen.getByRole('button', { name: 'How do entries work?' })
    );
    expect(onValueChange).toHaveBeenCalledWith('');
    expect(
      screen.queryByText('Each action earns entries.')
    ).not.toBeInTheDocument();
  });

  it('keeps several items open in multiple mode', async () => {
    render(
      <Accordion type="multiple">
        <FaqItems />
      </Accordion>
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'How do entries work?' })
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'How are winners picked?' })
    );
    expect(screen.getAllByRole('region')).toHaveLength(2);
  });

  it('applies custom class names to the item, the trigger and the content body', () => {
    render(
      <Accordion type="single" defaultValue="entries">
        <AccordionItem value="entries" className="border-none">
          <AccordionTrigger className="text-lg">Entries</AccordionTrigger>
          <AccordionContent className="pb-0">Details</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    const trigger = screen.getByRole('button', { name: 'Entries' });
    expect(trigger).toHaveClass('text-lg', 'flex-1');
    expect(trigger.querySelector('svg')).toBeInTheDocument();

    const body = screen.getByText('Details');
    expect(body).toHaveClass('pb-0', 'pt-0');
    expect(body).not.toHaveClass('pb-4');
    expect(screen.getByRole('region')).toHaveClass('overflow-hidden');
    expect(screen.getByRole('region').parentElement).toHaveClass('border-none');
  });
});
