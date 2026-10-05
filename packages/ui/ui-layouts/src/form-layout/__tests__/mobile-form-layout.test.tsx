import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MobileFormLayout } from '../mobile-form-layout';
import {
  LayoutContextValue,
  renderWithLayout
} from '../../testing/layout-context';

const cancelNavigation = (event: MouseEvent) => event.preventDefault();

const renderMobile = (
  overrides: Partial<LayoutContextValue> = {},
  hideTabs?: boolean
) =>
  renderWithLayout(
    <MobileFormLayout
      form={<div>Form body</div>}
      preview={<div>Preview body</div>}
      previewFooter={<div>Preview footer</div>}
      hideTabs={hideTabs}
    />,
    overrides
  );

const headerButtons = () => {
  const [cancel, save] = within(screen.getByRole('banner')).getAllByRole(
    'button'
  );
  return { cancel, save };
};

describe('MobileFormLayout', () => {
  beforeEach(() => {
    document.addEventListener('click', cancelNavigation);
  });

  afterEach(() => {
    document.removeEventListener('click', cancelNavigation);
  });

  it('shows the form title', () => {
    renderMobile();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Summer Giveaway' })
    ).toBeInTheDocument();
  });

  it('leaves the heading empty when the form has no title', () => {
    renderMobile({ title: '' });
    expect(screen.getByRole('heading', { level: 1 })).toBeEmptyDOMElement();
  });

  describe('header actions', () => {
    it('cancels from the header', async () => {
      const { context } = renderMobile();
      await userEvent.click(headerButtons().cancel);
      expect(context.onCancel).toHaveBeenCalledTimes(1);
    });

    it('submits from the save icon', () => {
      renderMobile();
      expect(headerButtons().save).toHaveAttribute('type', 'submit');
      expect(headerButtons().cancel).toHaveAttribute('type', 'button');
    });

    it('disables both actions while the form is disabled', () => {
      renderMobile({ disabled: true });
      expect(headerButtons().cancel).toBeDisabled();
      expect(headerButtons().save).toBeDisabled();
    });
  });

  describe('step tabs', () => {
    it('shows a tab per step with the current step selected', () => {
      renderMobile({ currentStep: 'tasks' });
      expect(screen.getAllByRole('tab')).toHaveLength(3);
      expect(screen.getByRole('tab', { name: 'Tasks' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('shows the error count on steps that have errors', () => {
      renderMobile({ stepErrors: { details: 3, prizes: 0, tasks: 0 } });
      expect(
        within(screen.getByRole('tab', { name: /Details/ })).getByText('3')
      ).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Prizes' })).toHaveTextContent(
        /^Prizes$/
      );
    });

    it('changes the step when a tab is clicked', async () => {
      const { context } = renderMobile();
      await userEvent.click(screen.getByRole('tab', { name: 'Prizes' }));
      expect(context.setCurrentStep).toHaveBeenCalledExactlyOnceWith('prizes');
    });

    it('can be hidden with a shorter header', () => {
      renderMobile({}, true);
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.getByRole('banner')).toHaveClass('h-14');
      expect(screen.getByRole('banner')).not.toHaveClass('h-22');
    });

    it('uses a taller header to fit the tabs', () => {
      renderMobile();
      expect(screen.getByRole('banner')).toHaveClass('h-22');
    });
  });

  describe('edit and preview toggle', () => {
    it('starts on the form with its step footer', () => {
      renderMobile();
      expect(screen.getByText('Form body')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
      expect(screen.queryByText('Preview body')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit' })).toHaveClass(
        'bg-primary'
      );
    });

    it('switches to the preview', async () => {
      renderMobile();
      await userEvent.click(screen.getByRole('button', { name: 'Preview' }));
      expect(screen.getByText('Preview body')).toBeInTheDocument();
      expect(screen.getByText('Preview footer')).toBeInTheDocument();
      expect(screen.queryByText('Form body')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Next' })
      ).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Preview' })).toHaveClass(
        'bg-primary'
      );
    });

    it('switches back to the form', async () => {
      renderMobile();
      await userEvent.click(screen.getByRole('button', { name: 'Preview' }));
      await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
      expect(screen.getByText('Form body')).toBeInTheDocument();
      expect(screen.queryByText('Preview body')).not.toBeInTheDocument();
    });

    it('does not submit the form when toggling', () => {
      renderMobile();
      expect(screen.getByRole('button', { name: 'Preview' })).toHaveAttribute(
        'type',
        'button'
      );
      expect(screen.getByRole('button', { name: 'Edit' })).toHaveAttribute(
        'type',
        'button'
      );
    });
  });

  it('shows the demo banner in demo mode', () => {
    renderMobile({ action: 'demo' });
    expect(screen.getByText('Demo Mode')).toBeInTheDocument();
  });

  it('scrolls the form back to the top when the step changes', () => {
    const { rerenderWithLayout } = renderMobile();
    const scrollContainer = screen.getByText('Form body')
      .parentElement as HTMLElement;
    scrollContainer.scrollTop = 80;
    rerenderWithLayout({ currentStep: 'tasks' });
    expect(scrollContainer.scrollTop).toBe(0);
  });
});
