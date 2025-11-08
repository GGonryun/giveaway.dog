'use client';

import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useCallback, useState } from 'react';

import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { TeamFeatureFlagKeySchema } from '@/schemas/feature-flags';

import { MobileSuspense } from '@/components/ui/mobile-suspense';
import { UnifiedFormAction } from '@/components/patterns/form-layout/types';
import {
  UnifiedFormLayoutContextProvider,
  useUnifiedFormLayout
} from '@/components/patterns/form-layout/use-unified-form-layout';
import {
  isPickerStepKey,
  PickerStep,
  PICKER_STEP_LABELS,
  PICKER_STEP_ORDER,
  PICKER_STEP_TO_FIELD_MAP,
  PICKER_FIELD_TO_STEP_MAP
} from '../data/steps';
import { usePickersPage } from '../hooks/use-pickers-page';
import { PickerCancelConfirmationModal } from './picker-cancel-confirmation-modal';
import { PickerPublishConfirmationModal } from './picker-publish-confirmation-modal';
import { ActionsSection } from './sections/actions-section';
import { FiltersSection } from './sections/filters-section';
import { RequirementsSection } from './sections/requirements-section';
import { SetupSection } from './sections/setup-section';
import { deletePicker } from '../procedures/delete-picker';
import { updatePicker } from '../procedures/update-picker-config';
import { useProcedure } from '@/lib/mrpc/hook';
import { DEFAULT_PICKER_FORM, DEFAULT_PICKER_NAME } from '../data/defaults';
import {
  PickerFormSchema,
  pickerFormSchema,
  PickerUnvalidatedFormSchema
} from '../schemas/form';
import { PickerTwitterPreview } from './picker-twitter-preview';
import { publishPicker } from '../procedures/publish-picker';
import { IntegrationsSchema } from '@/lib/integrations/schemas';

export interface PickerFormProps {
  picker: Omit<PickerUnvalidatedFormSchema, 'id'>;
  teamFeatureFlags: TeamFeatureFlagKeySchema[];
  integrations?: IntegrationsSchema;
  isDemo?: boolean;
}

export const PickerForm: React.FC<PickerFormProps> = ({
  picker,
  teamFeatureFlags,
  integrations,
  isDemo = false
}) => {
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();

  const pickerId = params.pickerId as string;
  const action = isDemo
    ? 'demo'
    : pathname.includes('/edit')
      ? 'edit'
      : 'create';
  const step = searchParams?.get('step');

  const form = useForm<PickerFormSchema>({
    resolver: zodResolver(pickerFormSchema),
    defaultValues: picker || DEFAULT_PICKER_FORM,
    mode: 'onChange'
  });

  return (
    <MobileSuspense>
      <FormProvider {...form}>
        <FormContent
          step={isPickerStepKey(step) ? step : 'setup'}
          pickerId={pickerId}
          action={action}
          teamFeatureFlags={teamFeatureFlags}
          integrations={integrations}
        />
      </FormProvider>
    </MobileSuspense>
  );
};

interface FormContentProps {
  step: PickerStep;
  pickerId: string;
  action: UnifiedFormAction;
  teamFeatureFlags: TeamFeatureFlagKeySchema[];
  integrations?: IntegrationsSchema;
}

const FormContent: React.FC<FormContentProps> = ({
  pickerId,
  step,
  action,
  teamFeatureFlags,
  integrations
}) => {
  const page = usePickersPage();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showIssues, setShowIssues] = useState(false);

  const form = useFormContext<PickerFormSchema>();

  const deleteProcedure = useProcedure({
    action: deletePicker,
    onSuccess: () => {
      toast.success('Picker deleted successfully!');
      page.navigateTo({ path: 'list' });
    }
  });

  const updateProcedure = useProcedure({
    action: updatePicker,
    onSuccess: () => {
      toast.success('Picker updated successfully!');
      page.navigateTo({ path: 'list' });
    }
  });

  const publishProcedure = useProcedure({
    action: publishPicker,
    onSuccess: () => {
      toast.success('Picker published successfully!');
      page.navigateTo({ path: 'list' });
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
      page.navigateTo({ path: 'list' });
    }
  }, [form.formState.isDirty, page.navigateTo, action]);

  const handleSaveChanges = useCallback(async () => {
    if (action === 'demo') {
      toast.info('Demo Mode: Saving is disabled in the demo.');
      return;
    }

    const currentValues = form.getValues();
    updateProcedure.run({ pickerId, form: currentValues });
  }, [pickerId, updateProcedure, action]);

  const handleCancelSubmission = async () => {
    setShowPublishModal(false);
  };

  const handleDiscardChanges = useCallback(async () => {
    if (action === 'demo') {
      window.history.back();
      return;
    }

    if (action === 'create') {
      deleteProcedure.run({ pickerId });
    } else {
      page.navigateTo({ path: 'list' });
    }
  }, [deleteProcedure.run, action, pickerId]);

  const handlePublish = useCallback(async () => {
    if (action === 'demo') {
      toast.info('Demo Mode: Publishing is disabled in the demo.');
      return;
    }

    const currentValues = form.getValues();
    publishProcedure.run({
      pickerId,
      form: currentValues
    });
  }, [pickerId, publishProcedure, action]);

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

  const isLoading = deleteProcedure.isLoading || updateProcedure.isLoading;

  return (
    <>
      <form
        onSubmit={form.handleSubmit(handleSubmitValid, handleSubmitInvalid)}
      >
        <UnifiedFormLayoutContextProvider
          title={name || DEFAULT_PICKER_NAME}
          disabled={isLoading}
          onCancel={handleCancel}
          onSave={handleSaveChanges}
          stepLabels={PICKER_STEP_LABELS}
          defaultStep={step}
          form={<PickerFormContent integrations={integrations} />}
          preview={<PickerPreview />}
          previewFooter={undefined}
          type={'picker'}
          action={action}
          id={pickerId}
          teamFeatureFlags={teamFeatureFlags}
          stepOrder={PICKER_STEP_ORDER}
          stepsToFields={PICKER_STEP_TO_FIELD_MAP}
          fieldsToSteps={PICKER_FIELD_TO_STEP_MAP}
          showIssues={showIssues}
          setShowIssues={setShowIssues}
        />
      </form>

      <PickerCancelConfirmationModal
        onClose={() => setShowCancelModal(false)}
        open={showCancelModal}
        isLoading={isLoading}
        action={action}
        onDiscard={handleDiscardChanges}
        onSave={handleSaveChanges}
      />

      <PickerPublishConfirmationModal
        open={showPublishModal}
        onClose={handleClosePublishModal}
        onContinueEditing={handleContinueEditing}
        onCancel={handleCancelSubmission}
        onSave={handleSaveChanges}
        onPublish={handlePublish}
        isUpdating={updateProcedure.isLoading}
        isPublishing={publishProcedure.isLoading}
        action={action}
      />
    </>
  );
};

interface PickerFormContentProps {
  integrations?: IntegrationsSchema;
}

export const PickerFormContent: React.FC<PickerFormContentProps> = ({
  integrations
}) => {
  const { currentStep } = useUnifiedFormLayout<PickerStep>();
  switch (currentStep) {
    case 'setup':
      return <SetupSection integrations={integrations} />;
    case 'actions':
      return <ActionsSection />;
    case 'filters':
      return <FiltersSection />;
    case 'requirements':
      return <RequirementsSection />;
    default:
      return <SetupSection integrations={integrations} />;
  }
};

export const PickerPreview: React.FC = () => {
  return <PickerTwitterPreview />;
};
