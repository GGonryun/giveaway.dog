'use client';

import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  GiveawayFormSchema,
  giveawayFormSchema,
  GiveawayState
} from '@/schemas/giveaway/schemas';
import React, { useCallback, useEffect, useState } from 'react';

import { FormLayout } from './form-layout';
import {
  SweepstakesContext,
  useSweepstakes
} from '@/components/sweepstakes-editor/hooks/use-sweepstake-step';
import { GiveawayFormContent } from './form-content';
import { GiveawayPreview } from './preview';
import { CancelConfirmationModal } from '@/components/sweepstakes/cancel-confirmation-modal';
import { PrePublishValidationModal } from '@/components/sweepstakes/pre-publish-validation-modal';
import { useSweepstakesPage } from '../sweepstakes/use-sweepstakes-page';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { SweepstakesStatus } from '@prisma/client';
import { useDeleteSweepstakes } from '../sweepstakes/use-delete-sweepstakes';
import { useProcedure } from '@/lib/mrpc/hook';
import updateSweepstakes from '@/procedures/sweepstakes/update-sweepstakes';
import publishSweepstakes from '@/procedures/sweepstakes/publish-sweepstakes';
import { isSweepstakeStepKey } from './data/steps';
import { FormIssuesDialog } from './form-issues-dialog';
import { useFormIssuesDialog } from './hooks/use-form-issues-dialog';
import { MobileSuspense } from '../ui/mobile-suspense';
import { useIsTablet } from '../hooks/use-tablet';
import { PreviewStateContext } from './contexts/preview-state-context';
import { DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { SaveIcon } from 'lucide-react';

export const SweepstakesForm: React.FC<{
  sweepstakes: GiveawayFormSchema;
  status: SweepstakesStatus;
}> = ({ sweepstakes: defaultValues, status }) => {
  const { isTablet } = useIsTablet();
  const pathname = usePathname();

  const params = useParams();
  const searchParams = useSearchParams();
  const step = searchParams.get('step') ?? 'setup';
  const id = params.id as string;
  const action = pathname.includes('/edit') ? 'edit' : 'create';

  const form = useForm<GiveawayFormSchema>({
    resolver: zodResolver(giveawayFormSchema(true)),
    defaultValues,
    mode: 'onChange'
  });

  const startDate = useWatch({
    control: form.control,
    name: 'timing.startDate'
  });

  const [previewState, setPreviewState] = useState<GiveawayState>('active');

  useEffect(() => {
    form.trigger('timing.endDate');
  }, [startDate, form.trigger]);

  if (!id || typeof id !== 'string') return <div>Invalid ID: {id}</div>;

  return (
    <MobileSuspense>
      <SweepstakesContext.Provider
        value={{
          mobile: isTablet,
          step: isSweepstakeStepKey(step) ? step : 'setup',
          id,
          action,
          status
        }}
      >
        <PreviewStateContext.Provider value={{ previewState, setPreviewState }}>
          <FormProvider {...form}>
            <FormContent />
          </FormProvider>
        </PreviewStateContext.Provider>
      </SweepstakesContext.Provider>
    </MobileSuspense>
  );
};

const FormContent: React.FC = () => {
  const page = useSweepstakesPage();
  const { id, action, status } = useSweepstakes();
  const { open, errors, onOpenChange, onJumpToField } = useFormIssuesDialog();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const form = useFormContext<GiveawayFormSchema>();

  const deleteSweepstakes = useDeleteSweepstakes(() => {
    toast.success('Sweepstakes deleted successfully!');
    page.navigateTo();
  });

  const updateSweepstakesProcedure = useProcedure({
    action: updateSweepstakes,
    onSuccess: () => {
      toast.success('Sweepstakes updated successfully!');
      page.navigateTo();
    }
  });

  const publishSweepstakesProcedure = useProcedure({
    action: publishSweepstakes,
    onSuccess() {
      toast.success('Sweepstakes published successfully!');
      page.navigateTo();
    }
  });

  const name = useWatch({
    control: form.control,
    name: 'setup.name'
  });

  const handleSubmitValid = useCallback(async () => {
    await form.trigger();

    setShowPublishModal(true);
  }, [form.trigger, setShowPublishModal]);

  const handleSubmitInvalid = useCallback(async () => {
    await form.trigger();

    onOpenChange(true);
  }, [form.trigger, setShowPublishModal]);

  const handleCancel = useCallback(() => {
    // check if form is dirty
    if (form.formState.isDirty || action === 'create') {
      setShowCancelModal(true);
    } else {
      page.navigateTo();
    }
  }, [form.formState.isDirty, page.navigateTo]);

  const handleSaveChanges = useCallback(async () => {
    const currentValues = form.getValues();
    updateSweepstakesProcedure.run({ id, ...currentValues });
  }, [id, updateSweepstakesProcedure]);

  const handleCancelSubmission = async () => {
    setShowPublishModal(false);
  };

  const handleDiscardChanges = useCallback(async () => {
    if (action === 'create') {
      deleteSweepstakes.run({ id });
    } else {
      page.navigateTo();
    }
  }, [deleteSweepstakes.run, action, id]);

  const handlePublish = useCallback(async () => {
    const currentValues = form.getValues();
    publishSweepstakesProcedure.run({ id, ...currentValues });
  }, [id, publishSweepstakesProcedure]);

  const handleContinueEditing = useCallback(
    (fieldName?: string) => {
      setShowPublishModal(false);

      if (fieldName) {
        form.setFocus(fieldName as any);
      }
    },
    [form]
  );

  const handleClosePublishModal = () => setShowPublishModal(false);

  return (
    <>
      <form
        onSubmit={form.handleSubmit(handleSubmitValid, handleSubmitInvalid)}
      >
        <FormLayout
          title={name}
          disabled={
            deleteSweepstakes.isLoading ||
            updateSweepstakesProcedure.isLoading ||
            publishSweepstakesProcedure.isLoading
          }
          onCancel={handleCancel}
          left={<GiveawayFormContent />}
          right={<GiveawayPreview />}
        />
      </form>

      <CancelConfirmationModal
        onClose={() => setShowCancelModal(false)}
        open={showCancelModal}
        isLoading={
          deleteSweepstakes.isLoading || updateSweepstakesProcedure.isLoading
        }
        onDiscard={handleDiscardChanges}
        onSave={handleSaveChanges}
      />

      <PrePublishValidationModal
        open={showPublishModal}
        onClose={handleClosePublishModal}
        onContinueEditing={handleContinueEditing}
        onCancel={handleCancelSubmission}
        onSave={handleSaveChanges}
        onPublish={handlePublish}
        isPublishing={publishSweepstakesProcedure.isLoading}
        isSaving={updateSweepstakesProcedure.isLoading}
        giveawayName={name}
      />

      <FormIssuesDialog
        open={open}
        errors={errors}
        onOpenChange={onOpenChange}
        onJumpToField={onJumpToField}
        footer={
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateSweepstakesProcedure.isLoading}
            >
              Continue Editing
            </Button>
            {status === 'DRAFT' && (
              <Button
                onClick={handleSaveChanges}
                disabled={updateSweepstakesProcedure.isLoading}
                className="flex-1 sm:flex-none"
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                Save & Exit
              </Button>
            )}
          </DialogFooter>
        }
      />
    </>
  );
};
