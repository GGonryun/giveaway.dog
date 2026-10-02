import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '../accordion';
import { withStableIds } from './test-utils';

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
  it('matches the snapshot with the first item open', () => {
    const { container } = renderSingle({ defaultValue: 'entries' });
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });
});
