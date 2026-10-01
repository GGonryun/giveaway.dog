import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DesktopFormLayout } from '../desktop-form-layout';
import { LayoutContextValue, renderWithLayout } from './layout-context';

const cancelNavigation = (event: MouseEvent) => event.preventDefault();

const renderDesktop = (
  overrides: Partial<LayoutContextValue> = {},
  hideTabs?: boolean
) =>
  renderWithLayout(
    <DesktopFormLayout
      form={<div>Form body</div>}
      preview={<div>Preview body</div>}
      previewFooter={<div>Preview footer</div>}
      hideTabs={hideTabs}
    />,
    overrides
  );

const header = () => within(screen.getByRole('banner'));

describe('DesktopFormLayout', () => {
  beforeEach(() => {
    document.addEventListener('click', cancelNavigation);
  });

  afterEach(() => {
    document.removeEventListener('click', cancelNavigation);
  });

  describe('title', () => {
    it('shows the form title', () => {
      renderDesktop();
      expect(
        screen.getByRole('heading', { level: 1, name: 'Summer Giveaway' })
      ).toBeInTheDocument();
    });

    it.each([
      ['sweepstake', 'Untitled Sweepstake'],
      ['picker', 'Untitled Picker'],
      ['template', 'Untitled Template']
    ] as const)('falls back to an untitled %s name', (type, name) => {
      renderDesktop({ title: '', type });
      expect(
        screen.getByRole('heading', { level: 1, name })
      ).toBeInTheDocument();
    });
  });

  describe('step tabs', () => {
    it('shows a tab per step with the current step selected', () => {
      renderDesktop({ currentStep: 'prizes' });
      expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
        'Details',
        'Prizes',
        'Tasks'
      ]);
      expect(screen.getByRole('tab', { name: 'Prizes' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('shows the error count on steps that have errors', () => {
      renderDesktop({ stepErrors: { details: 0, prizes: 2, tasks: 0 } });
      expect(
        within(screen.getByRole('tab', { name: /Prizes/ })).getByText('2')
      ).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Details' })).toHaveTextContent(
        /^Details$/
      );
    });

    it('links each tab to its step', () => {
      renderDesktop();
      expect(screen.getByRole('tab', { name: 'Tasks' })).toHaveAttribute(
        'href',
        '?step=tasks'
      );
    });

    it('changes the step when a tab is clicked', async () => {
      const { context } = renderDesktop();
      await userEvent.click(screen.getByRole('tab', { name: 'Tasks' }));
      expect(context.setCurrentStep).toHaveBeenCalledExactlyOnceWith('tasks');
    });

    it('can be hidden', () => {
      renderDesktop({}, true);
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });
  });

  describe('header actions', () => {
    it('cancels from the header', async () => {
      const { context } = renderDesktop();
      await userEvent.click(header().getByRole('button', { name: 'Cancel' }));
      expect(context.onCancel).toHaveBeenCalledTimes(1);
    });

    it('submits with Publish while creating', () => {
      renderDesktop({ action: 'create', hasErrors: true });
      const publish = header().getByRole('button', { name: 'Publish' });
      expect(publish).toHaveAttribute('type', 'submit');
      expect(publish).not.toHaveClass('bg-destructive');
    });

    it('submits with Save Changes while editing', () => {
      renderDesktop({ action: 'edit' });
      const save = header().getByRole('button', { name: 'Save Changes' });
      expect(save).toHaveAttribute('type', 'submit');
      expect(save).not.toHaveClass('bg-destructive');
    });

    it('warns with a destructive save button when an edited form has errors', () => {
      renderDesktop({ action: 'edit', hasErrors: true });
      expect(
        header().getByRole('button', { name: 'Save Changes' })
      ).toHaveClass('bg-destructive');
    });

    it('disables both actions while the form is disabled', () => {
      renderDesktop({ disabled: true });
      expect(header().getByRole('button', { name: 'Cancel' })).toBeDisabled();
      expect(header().getByRole('button', { name: 'Publish' })).toBeDisabled();
    });
  });

  it('renders the form, the step footer, the preview and its footer', () => {
    renderDesktop();
    expect(screen.getByText('Form body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.getByText('Preview body')).toBeInTheDocument();
    expect(screen.getByText('Preview footer')).toBeInTheDocument();
  });

  it('places the form and preview in resizable panels', () => {
    const { container } = renderDesktop();
    expect(
      container.querySelector('[data-panel-group-direction="horizontal"]')
    ).toContainElement(screen.getByText('Preview body'));
  });

  it('shows the demo banner in demo mode', () => {
    renderDesktop({ action: 'demo' });
    expect(screen.getByText('Demo Mode')).toBeInTheDocument();
  });

  it('scrolls the form back to the top when the step changes', () => {
    const { rerenderWithLayout } = renderDesktop();
    const scrollContainer = screen.getByText('Form body')
      .parentElement as HTMLElement;
    scrollContainer.scrollTop = 120;
    rerenderWithLayout({ currentStep: 'prizes' });
    expect(scrollContainer.scrollTop).toBe(0);
  });

  it('keeps the scroll position while the step stays the same', () => {
    const { rerenderWithLayout } = renderDesktop();
    const scrollContainer = screen.getByText('Form body')
      .parentElement as HTMLElement;
    scrollContainer.scrollTop = 120;
    rerenderWithLayout({ title: 'Winter Giveaway' });
    expect(scrollContainer.scrollTop).toBe(120);
  });
});
