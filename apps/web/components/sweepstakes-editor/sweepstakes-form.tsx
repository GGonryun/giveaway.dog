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
} from '@giveaway/sweepstakes-model/schemas';
import React, { useCallback, useEffect, useState } from 'react';

import { SweepstakesFormPreview } from './sweepstakes-editor-preview';
import { useSweepstakesPage } from '@giveaway/sweepstakes-routes/use-sweepstakes-page';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useDeleteSweepstakes } from '../sweepstakes/use-delete-sweepstakes';
import { useProcedure } from '@giveaway/rpc-client/hook';
import updateSweepstakes from '@/procedures/sweepstakes/update-sweepstakes';
import publishSweepstakes from '@/procedures/sweepstakes/publish-sweepstakes';
import { PreviewStateContext } from './contexts/preview-state-context';

import { UnifiedFormLayoutContextProvider } from '@giveaway/ui-layouts/form-layout/use-unified-form-layout';
import { IntegrationsSchema } from '@giveaway/integration-model/schemas';
import {
  SWEEPSTAKE_FIELD_TO_STEP_MAP,
  isSweepstakeStepKey,
  SWEEPSTAKE_STEP_TO_FIELD_MAP,
  SWEEPSTAKE_STEP_LABELS,
  SWEEPSTAKE_STEP_ORDER,
  SweepstakeStep
} from './data/steps';
import { SweepstakesPreviewFooter } from './sweepstakes-preview-footer';
import { UnifiedFormAction } from '@giveaway/ui-layouts/form-layout/types';
import { SweepstakeFormContent } from './sweepstake-form-content';
import { CancelConfirmationModal } from '@giveaway/sweepstakes-ui/cancel-confirmation-modal';
import { PublishConfirmationModal } from './publish-confirmation-modal';
import { useSweepstakesDetailsPage } from '@giveaway/sweepstakes-routes/use-sweepstakes-details-page';

export const SweepstakesForm: React.FC<{
  sweepstakes: GiveawayFormSchema;
  integrations: IntegrationsSchema;
  maxLoyalty: number;
  isDemo?: boolean;
}> = ({
  sweepstakes: defaultValues,
  integrations,
  maxLoyalty,
  isDemo = false
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const id = params.id as string;
  const rawStep = searchParams.get('step');
  const step = isSweepstakeStepKey(rawStep) ? rawStep : 'setup';

  const action = isDemo
    ? 'demo'
    : pathname.includes('/edit')
      ? 'edit'
      : 'create';

  const form = useForm<GiveawayFormSchema>({
    resolver: zodResolver(
      giveawayFormSchema({ validate: !isDemo, maxLoyalty })
    ),
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

  if (action !== 'demo' && (!id || typeof id !== 'string'))
    return <div>Invalid ID: {id}</div>;

  return (
    <PreviewStateContext.Provider value={{ previewState, setPreviewState }}>
      <FormProvider {...form}>
        <FormContent
          id={id}
          step={step}
          action={action}
          integrations={integrations}
        />
      </FormProvider>
    </PreviewStateContext.Provider>
  );
};

const FormContent: React.FC<{
  id: string;
  step: SweepstakeStep;
  integrations: IntegrationsSchema;
  action: UnifiedFormAction;
}> = ({ id, integrations, action, step }) => {
  const detailsPage = useSweepstakesDetailsPage();
  const sweepstakesPage = useSweepstakesPage();

  const [showIssues, setShowIssues] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const form = useFormContext<GiveawayFormSchema>();

  const deleteSweepstakes = useDeleteSweepstakes(() => {
    toast.success('Sweepstakes deleted successfully!');
    sweepstakesPage.navigateTo();
  });

  const returnToPage = () => {
    if (action === 'edit' || action === 'view') {
      detailsPage.navigateTo(id);
    } else {
      sweepstakesPage.navigateTo();
    }
  };

  const updateSweepstakesProcedure = useProcedure({
    action: updateSweepstakes,
    onSuccess: () => {
      toast.success('Sweepstakes updated successfully!');
      returnToPage();
    }
  });

  const publishSweepstakesProcedure = useProcedure({
    action: publishSweepstakes,
    onSuccess() {
      toast.success('Sweepstakes published successfully!');
      returnToPage();
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

    setShowIssues(true);
  }, [form.trigger, setShowPublishModal]);

  const handleCancel = useCallback(() => {
    // check if form is dirty
    if (form.formState.isDirty || action === 'create' || action === 'demo') {
      setShowCancelModal(true);
    } else {
      returnToPage();
    }
  }, [form.formState.isDirty, returnToPage, action]);

  const handleSaveChanges = useCallback(async () => {
    if (action === 'demo') {
      toast.info('Demo Mode: Saving is disabled in the demo.');
      return;
    }

    const currentValues = form.getValues();
    updateSweepstakesProcedure.run({ id, ...currentValues });
  }, [id, updateSweepstakesProcedure, action]);

  const handleCancelSubmission = async () => {
    setShowPublishModal(false);
  };

  const handleDiscardChanges = useCallback(async () => {
    if (action === 'demo') {
      window.history.back();
      return;
    }

    if (action === 'create') {
      deleteSweepstakes.run({ id });
    } else {
      returnToPage();
    }
  }, [deleteSweepstakes.run, action, id]);

  const handlePublish = useCallback(async () => {
    if (action === 'demo') {
      toast.info('Demo Mode: Publishing is disabled in the demo.');
      return;
    }

    const currentValues = form.getValues();
    publishSweepstakesProcedure.run({ id, ...currentValues });
  }, [id, publishSweepstakesProcedure, action]);

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
        <UnifiedFormLayoutContextProvider
          id={id}
          title={name}
          disabled={
            deleteSweepstakes.isLoading ||
            updateSweepstakesProcedure.isLoading ||
            publishSweepstakesProcedure.isLoading
          }
          showIssues={showIssues}
          defaultStep={step}
          setShowIssues={setShowIssues}
          onCancel={handleCancel}
          onSave={handleSaveChanges}
          form={<SweepstakeFormContent />}
          preview={<SweepstakesFormPreview />}
          integrations={integrations}
          previewFooter={<SweepstakesPreviewFooter />}
          type={'sweepstake'}
          action={action}
          stepOrder={SWEEPSTAKE_STEP_ORDER}
          stepsToFields={SWEEPSTAKE_STEP_TO_FIELD_MAP}
          fieldsToSteps={SWEEPSTAKE_FIELD_TO_STEP_MAP}
          stepLabels={SWEEPSTAKE_STEP_LABELS}
        />

        <CancelConfirmationModal
          onClose={() => setShowCancelModal(false)}
          open={showCancelModal}
          isLoading={
            deleteSweepstakes.isLoading || updateSweepstakesProcedure.isLoading
          }
          action={action}
          onDiscard={handleDiscardChanges}
          onSave={handleSaveChanges}
        />

        <PublishConfirmationModal
          open={showPublishModal}
          onClose={handleClosePublishModal}
          onContinueEditing={handleContinueEditing}
          onCancel={handleCancelSubmission}
          onSave={handleSaveChanges}
          onPublish={handlePublish}
          isPublishing={publishSweepstakesProcedure.isLoading}
          isSaving={updateSweepstakesProcedure.isLoading}
          action={action}
          name={name}
        />
      </form>
    </>
  );
};
