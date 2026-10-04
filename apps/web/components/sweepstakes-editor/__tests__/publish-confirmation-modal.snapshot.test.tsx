import { screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublishConfirmationModal } from '../publish-confirmation-modal';
import { buildFormValues, FIXED_NOW, renderWithForm } from './form-harness';
import { stabilizeIds } from '@giveaway/testing-dom/stable-dom';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

type ModalProps = React.ComponentProps<typeof PublishConfirmationModal>;

const renderModal = (
  props: Partial<ModalProps> = {},
  startDate: Date | null = new Date('2026-07-01T12:00:00.000Z')
) => {
  const handlers = {
    onClose: vi.fn(),
    onContinueEditing: vi.fn(),
    onCancel: vi.fn(),
    onSave: vi.fn(),
    onPublish: vi.fn()
  };
  const values = buildFormValues();
  const view = renderWithForm(
    <PublishConfirmationModal
      open
      action="create"
      name="Summer Giveaway"
      isSaving={false}
      isPublishing={false}
      {...handlers}
      {...props}
    />,
    {
      values: {
        ...values,
        timing: { ...values.timing, startDate: startDate as Date }
      }
    }
  );
  return { ...view, ...handlers };
};

const getDialog = () => screen.getByRole('dialog');

describe('PublishConfirmationModal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when publishing a draft', () => {
    it('matches the snapshot', () => {
      renderModal();
      expect(stabilizeIds(getDialog())).toMatchSnapshot();
    });
  });

  describe('when saving changes to a published sweepstakes', () => {
    it('matches the snapshot', () => {
      renderModal({ action: 'edit' });
      expect(stabilizeIds(getDialog())).toMatchSnapshot();
    });
  });

  describe('in the demo', () => {
    it('matches the snapshot', () => {
      renderModal({ action: 'demo' });
      expect(stabilizeIds(getDialog())).toMatchSnapshot();
    });
  });
});
