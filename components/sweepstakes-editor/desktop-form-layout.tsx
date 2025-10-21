import { SiteHeader } from '@/components/patterns/app-sidebar/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XIcon, SaveIcon, AlertCircleIcon } from 'lucide-react';
import Link from 'next/link';
import { UnifiedFormFooter } from './unified-form-footer';
import React, { useCallback, useMemo } from 'react';
import { useFormIssues } from '@/components/sweepstakes-editor/hooks/use-form-issues';
import { useSweepstakes } from '@/components/sweepstakes-editor/hooks/use-sweepstake-context';
import { FormHeaderProps, FormLayoutProps } from './form-layout';
import { SWEEPSTAKE_STEPS, SweepstakeStep } from './data/steps';
import { useFormErrors } from '../hooks/use-form-errors';
import { PreviewStateDropdown } from './preview-state-dropdown';
import { DemoBanner } from './demo-banner';

export const DesktopTabTrigger: React.FC<{
  step: SweepstakeStep;
  label: string;
}> = ({ step, label }) => {
  const { formErrors, trigger } = useFormIssues(step);
  const errors = useMemo(() => formErrors.length, [formErrors]);
  const { step: currentStep } = useSweepstakes();

  const handleJumpToField = useCallback(() => {
    setTimeout(() => {
      trigger(currentStep);
    }, 100);
  }, [currentStep]);

  return (
    <TabsTrigger asChild value={step}>
      <Link
        href={`?step=${step}`}
        className="flex gap-1"
        onClick={handleJumpToField}
      >
        {label}
        {errors > 0 && (
          <Badge
            variant="destructive"
            className="flex items-center justify-center size-4 p-0 m-0 overflow-hidden leading-none"
          >
            {errors}
          </Badge>
        )}
      </Link>
    </TabsTrigger>
  );
};

const DesktopTabs: React.FC = () => {
  const { step } = useSweepstakes();

  return (
    <div className="flex-1 flex justify-center">
      <Tabs value={step}>
        <TabsList>
          {SWEEPSTAKE_STEPS.map((step) => (
            <DesktopTabTrigger
              key={step.key}
              step={step.key}
              label={step.label}
            />
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};

const DesktopTitle: React.FC<{ title: React.ReactNode }> = ({ title }) => {
  return (
    <h1 className="text-lg sm:text-xl font-medium text-ellipsis whitespace-nowrap overflow-hidden">
      {title}
    </h1>
  );
};

const DesktopActions: React.FC<Omit<FormHeaderProps, 'title'>> = ({
  disabled,
  onCancel
}) => {
  const { status } = useSweepstakes();
  const formErrors = useFormErrors(); // check's all errors.
  const hasErrors = formErrors.length > 0;
  return (
    <div className="flex-1 flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="default"
        disabled={disabled}
        onClick={onCancel}
      >
        <XIcon />
        Cancel
      </Button>
      <Button
        type="submit"
        variant={
          status === 'DRAFT' ? 'default' : hasErrors ? 'destructive' : 'default'
        }
        size="default"
        disabled={disabled}
      >
        {status === 'DRAFT' ? (
          <SaveIcon />
        ) : hasErrors ? (
          <AlertCircleIcon />
        ) : (
          <SaveIcon />
        )}
        {status === 'DRAFT'
          ? 'Publish'
          : hasErrors
            ? 'Save Changes'
            : 'Save Changes'}
      </Button>
    </div>
  );
};

const DesktopFormHeader: React.FC<FormHeaderProps> = ({
  title,
  disabled,
  onCancel
}) => {
  return (
    <SiteHeader container={false}>
      <div className="grid grid-cols-3 w-full items-center gap-4">
        <DesktopTitle title={title} />
        <DesktopTabs />
        <DesktopActions disabled={disabled} onCancel={onCancel} />
      </div>
    </SiteHeader>
  );
};

const PreviewFooter: React.FC = () => {
  return (
    <div className="bg-background border-t p-3">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">Preview Mode</div>
        <PreviewStateDropdown />
      </div>
    </div>
  );
};

export const DesktopFormLayout: React.FC<FormLayoutProps> = ({
  title,
  onCancel,
  disabled,
  left,
  right
}) => {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <DesktopFormHeader
          title={title}
          disabled={disabled}
          onCancel={onCancel}
        />
        <DemoBanner />

        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          <ResizablePanel
            defaultSize={30}
            className="min-w-[450px] xl:max-w-[800px] flex flex-col"
          >
            <div className="space-y-2 overflow-y-scroll flex-1">{left}</div>
            <UnifiedFormFooter />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize={60}
            className="min-w-[500px] xl:min-w-[800px] flex flex-col"
          >
            {right}
            <PreviewFooter />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};
