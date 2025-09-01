'use client';

import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { GiveawayFormSchema, giveawayFormSchema } from '@/schemas/giveaway';
import { useCallback, useEffect, useState, useTransition } from 'react';

import { FormLayout } from './form-layout';
import { SweepstakesProvider } from '@/components/hooks/use-sweepstake-step';
import { GiveawayFormContent } from './form-content';
import { GiveawayPreview } from './preview';
import { CancelConfirmationModal } from '@/components/sweepstakes/cancel-confirmation-modal';
import { PrePublishValidationModal } from '@/components/sweepstakes/pre-publish-validation-modal';

export const GiveawayForm: React.FC<{ sweepstakes: GiveawayFormSchema }> = ({
  sweepstakes: defaultValues
}) => {
  const [isPending, startTransition] = useTransition();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [pendingValues, setPendingValues] = useState<GiveawayFormSchema | null>(
    null
  );

  const form = useForm<GiveawayFormSchema>({
    resolver: zodResolver(giveawayFormSchema),
    defaultValues,
    mode: 'onChange'
  });

  useEffect(() => {
    // runs after defaultValues are applied
    form.trigger();
  }, [defaultValues, form]);

  const startDate = useWatch({
    control: form.control,
    name: 'timing.startDate'
  });

  const name = useWatch({
    control: form.control,
    name: 'setup.name'
  });

  useEffect(() => {
    form.trigger('timing.endDate');
  }, [startDate, form.trigger]);

  const getFormErrors = useCallback(() => {
    const errors: Array<{ field: string; message: string; section?: string }> =
      [];
    const formErrors = form.formState.errors;

    const addError = (field: string, message: string, section?: string) => {
      errors.push({ field, message, section });
    };

    // Check for errors in different sections
    if (formErrors.setup?.name) {
      addError('setup.name', 'Giveaway name is required', 'Setup');
    }
    if (formErrors.setup?.description) {
      addError('setup.description', 'Description is required', 'Setup');
    }
    if (formErrors.timing?.startDate) {
      addError('timing.startDate', 'Start date is required', 'Timing');
    }
    if (formErrors.timing?.endDate) {
      addError('timing.endDate', 'End date is required', 'Timing');
    }
    if (formErrors.tasks) {
      addError('tasks', 'At least one task is required', 'Tasks');
    }
    if (formErrors.prizes) {
      addError('prizes', 'At least one prize is required', 'Prizes');
    }

    return errors;
  }, [form.formState.errors]);

  const handleSubmit = async (values: GiveawayFormSchema) => {
    // First, trigger validation to ensure we have the latest error state
    const isValid = await form.trigger();

    if (!isValid) {
      // Form has errors, show the validation modal
      setPendingValues(values);
      setShowPublishModal(true);
      return;
    }

    // Form is valid, show confirmation modal
    setPendingValues(values);
    setShowPublishModal(true);
  };

  const handlePublishConfirm = useCallback(async () => {
    if (!pendingValues) return;

    startTransition(async () => {
      try {
        alert('TODO: Implement publish logic');
        setShowPublishModal(false);
        setPendingValues(null);
      } catch (error: any) {
        toast('Error', {
          description: error.message
        });
        form.setError('tasks', {
          type: 'manual',
          message: error.message
        });
      }
    });
  }, [pendingValues, form]);

  const handleSaveDraft = useCallback(async () => {
    // TODO: Implement draft saving logic
    toast.success('Draft saved successfully!');
    setShowPublishModal(false);
    setPendingValues(null);
  }, []);

  const handleContinueEditing = useCallback(
    (fieldName?: string) => {
      setShowPublishModal(false);
      setPendingValues(null);

      // TODO: Focus the specific field if provided
      if (fieldName) {
        form.setFocus(fieldName as any);
      }
    },
    [form]
  );

  return (
    <SweepstakesProvider>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FormLayout
            title={name}
            onCancel={() => setShowCancelModal(true)}
            disabled={isPending}
            left={<GiveawayFormContent />}
            right={<GiveawayPreview />}
          />
        </form>

        <CancelConfirmationModal
          onClose={() => setShowCancelModal(false)}
          open={showCancelModal}
        />

        <PrePublishValidationModal
          open={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          onContinueEditing={handleContinueEditing}
          onSaveDraft={handleSaveDraft}
          onPublishConfirm={handlePublishConfirm}
          errors={getFormErrors()}
          isLoading={isPending}
          giveawayName={name}
        />
      </FormProvider>
    </SweepstakesProvider>
  );
};
