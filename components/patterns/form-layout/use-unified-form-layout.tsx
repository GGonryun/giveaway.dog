'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useIsTablet } from '@/components/hooks/use-tablet';
import { UnifiedFormLayout } from './unified-form-layout';
import {
  FieldKey,
  FormLayoutProps,
  UnifiedFormAction,
  UniformFormType
} from './types';
import { TeamFeatureFlagKeySchema } from '@/schemas/feature-flags';
import { useFormErrors } from './use-form-issues';
import { browser } from '@/lib/browser';
import { useFormContext } from 'react-hook-form';
import { toast } from 'sonner';

export type UnifiedFormLayoutState<TSteps extends string> = {
  id: string;
  teamFeatureFlags: TeamFeatureFlagKeySchema[];
  title: string;
  type: UniformFormType;
  disabled: boolean;
  currentStep: TSteps;
  action: UnifiedFormAction;
  stepOrder: TSteps[];
  stepsToFields: Record<TSteps, FieldKey[]>;
  fieldsToSteps: Record<FieldKey, TSteps>;
  stepLabels: Record<TSteps, string>;
  onCancel: () => void;
  onSave: () => void;
  // error related data
  showIssues: boolean;
  setShowIssues: (show: boolean) => void;
};

export type UnifiedFormLayoutDerivedState<TSteps extends string> = {
  isLoadingLayout: boolean;
  mobile: boolean;
  stepErrors: Record<TSteps, number>;
  hasErrors: boolean;
  formErrors: { path: string; message: string }[];
  setCurrentStep: (step: TSteps) => void;
  onJumpToField: (fieldPath: string) => void;
};

export type UnifiedFormLayoutContext<TSteps extends string> =
  UnifiedFormLayoutState<TSteps> & UnifiedFormLayoutDerivedState<TSteps>;

export const UnifiedFormLayoutContext = React.createContext<
  UnifiedFormLayoutContext<string>
>({
  title: '',
  type: 'sweepstake',
  id: '',
  disabled: false,
  teamFeatureFlags: [],
  currentStep: '',
  isLoadingLayout: false,
  mobile: false,
  setCurrentStep: () => {},
  setShowIssues: () => {},
  onCancel: () => {},
  onJumpToField: () => {},
  onSave: () => {},
  showIssues: false,
  action: 'create',
  stepErrors: {},
  formErrors: [],
  stepLabels: {},
  stepOrder: [],
  stepsToFields: {},
  fieldsToSteps: {},
  hasErrors: false
});

export const useUnifiedFormLayout = <TSteps extends string>() => {
  const context = React.useContext(UnifiedFormLayoutContext);
  if (context == null) {
    throw new Error(
      'useUnifiedFormLayout must be used within a UnifiedFormLayoutContext.Provider'
    );
  }
  return context as unknown as UnifiedFormLayoutContext<TSteps>;
};

export type UnifiedFormLayoutContextProps<TSteps extends string> =
  FormLayoutProps &
    Omit<UnifiedFormLayoutState<TSteps>, 'currentStep'> & {
      defaultStep: TSteps;
      hideTabs?: boolean;
    };

export const UnifiedFormLayoutContextProvider = <T extends string>({
  id,
  teamFeatureFlags,
  defaultStep,
  title,
  stepLabels,
  action,
  stepsToFields,
  fieldsToSteps,
  stepOrder,
  type,
  disabled,
  onCancel,
  onSave,
  setShowIssues,
  showIssues,
  ...props
}: UnifiedFormLayoutContextProps<T>) => {
  const { trigger } = useFormContext();
  const formErrors = useFormErrors();

  const { isTablet: mobile, isLoading: isLoadingLayout } = useIsTablet();
  const [currentStep, setCurrentStepDispatch] = useState(defaultStep);

  const setCurrentStep = useCallback((step: T) => {
    trigger(stepsToFields[currentStep]);
    browser.changeParams({ step });
    setCurrentStepDispatch(step);
  }, []);

  const stepErrors = useMemo(() => {
    const errorMap: Record<string, number> = {};
    stepOrder.forEach((key) => {
      errorMap[key] = 0;
    });

    for (const error of formErrors) {
      const fieldStep = error.path.split('.')[0];
      const step = fieldsToSteps[fieldStep];
      if (step) {
        errorMap[step] = (errorMap[step] || 0) + 1;
      }
    }

    return errorMap;
  }, [formErrors]);

  // Field jumping handler with validation
  // TODO: scroll to the field.
  const onJumpToField = async (fieldPath: string) => {
    const fieldStep = fieldPath.split('.')[0];
    const step = fieldsToSteps[fieldStep];
    if (step) {
      await trigger(fieldPath);
      setCurrentStep(step);
      setShowIssues(false);
    } else {
      toast.error('Invalid field path');
    }
  };

  const hasErrors = stepErrors
    ? Object.values(stepErrors).some((count) => count > 0)
    : false;

  return (
    <UnifiedFormLayoutContext.Provider
      value={{
        id,
        teamFeatureFlags,
        type,
        title,
        disabled,
        mobile,
        isLoadingLayout,
        stepLabels,
        currentStep,
        showIssues,
        formErrors,
        onCancel,
        onSave,
        setShowIssues,
        setCurrentStep: setCurrentStep as (step: string) => void,
        onJumpToField,
        hasErrors,
        stepErrors,
        stepOrder,
        action,
        stepsToFields,
        fieldsToSteps
      }}
    >
      <UnifiedFormLayout {...props} />
    </UnifiedFormLayoutContext.Provider>
  );
};
