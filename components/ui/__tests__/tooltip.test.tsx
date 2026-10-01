import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../tooltip';
import { withStableIds } from './test-utils';

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

  it('stays hidden until the trigger is hovered', async () => {
    renderTooltip();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await userEvent.hover(screen.getByRole('button', { name: 'Info' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Entries refresh hourly'
    );
  });

  it('opens when the trigger receives keyboard focus and describes it', async () => {
    renderTooltip();
    await userEvent.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(
      screen.getByRole('button', { name: 'Info' })
    ).toHaveAccessibleDescription('Entries refresh hourly');
    expect(tooltip).toHaveTextContent('Entries refresh hourly');
  });

  it('closes when Escape is pressed', async () => {
    renderTooltip();
    await userEvent.tab();
    await screen.findByRole('tooltip');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders an arrow and applies custom class names', async () => {
    renderTooltip({ className: 'max-w-xs', arrowClassName: 'hidden' });
    await userEvent.tab();
    await screen.findByRole('tooltip');
    const content = getVisibleContent();
    expect(content).toHaveClass('max-w-xs', 'bg-primary', 'rounded-md');
    expect(content?.querySelector('svg')).toHaveClass('hidden', 'rotate-45');
  });

  it('works inside an explicit provider', async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger>Help</TooltipTrigger>
          <TooltipContent>More details</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    await userEvent.hover(screen.getByRole('button', { name: 'Help' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'More details'
    );
  });
});
