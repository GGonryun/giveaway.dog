import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip';
import { withStableIds } from '@giveaway/testing-dom/test-utils';

function renderTooltip(
  contentProps: Partial<React.ComponentProps<typeof TooltipContent>> = {}
) {
  return render(
    <Tooltip>
      <TooltipTrigger>Info</TooltipTrigger>
      <TooltipContent {...contentProps}>Entries refresh hourly</TooltipContent>
    </Tooltip>
  );
}

function getVisibleContent() {
  return document.querySelector('[data-slot="tooltip-content"]');
}

describe('Tooltip', () => {
  it('matches the snapshot when opened with the keyboard', async () => {
    renderTooltip();
    await userEvent.tab();
    await screen.findByRole('tooltip');
    expect(withStableIds(getVisibleContent())).toMatchSnapshot();
  });
});
