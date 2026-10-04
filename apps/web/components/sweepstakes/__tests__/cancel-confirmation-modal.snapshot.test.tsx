import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import type { UnifiedFormAction } from '@giveaway/ui-layouts/form-layout/types';
import type { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { CancelConfirmationModal } from '../cancel-confirmation-modal';
import { withStableIds } from './fixtures';

const EditorForm = ({
  name,
  children
}: {
  name: string;
  children: ReactNode;
}) => {
  const form = useForm<GiveawayFormSchema>({
    defaultValues: { setup: { name, description: '', banner: '' } }
  });
  return <FormProvider {...form}>{children}</FormProvider>;
};

const renderModal = ({
  action = 'create',
  name = 'Summer Giveaway',
  open = true,
  isLoading = false
}: {
  action?: UnifiedFormAction;
  name?: string;
  open?: boolean;
  isLoading?: boolean;
} = {}) => {
  const handlers = { onClose: vi.fn(), onDiscard: vi.fn(), onSave: vi.fn() };
  render(
    <EditorForm name={name}>
      <CancelConfirmationModal
        action={action}
        open={open}
        isLoading={isLoading}
        {...handlers}
      />
    </EditorForm>
  );
  return handlers;
};

describe('CancelConfirmationModal', () => {
  it.each<UnifiedFormAction>(['create', 'edit', 'demo'])(
    'matches the snapshot for the %s action',
    (action) => {
      renderModal({ action });
      expect(withStableIds(screen.getByRole('dialog'))).toMatchSnapshot();
    }
  );
});
