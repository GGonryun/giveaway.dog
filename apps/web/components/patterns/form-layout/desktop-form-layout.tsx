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
import React, { useRef, useEffect } from 'react';
import { FormLayoutProps } from './types';
import { UnifiedFormFooter } from './unified-form-footer';
import { DemoBanner } from './demo-banner';
import { useUnifiedFormLayout } from './use-unified-form-layout';
import { NonNavigationalLink } from '../links';
import { capitalize } from 'lodash';

const DesktopTabTrigger: React.FC<{
  step: string;
  label: string;
  errors?: number;
  onStepChange: () => void;
}> = ({ step, label, errors = 0, onStepChange }) => {
  return (
    <TabsTrigger asChild value={step}>
      <NonNavigationalLink
        href={`?step=${step}`}
        className="flex gap-1"
        onClick={onStepChange}
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
      </NonNavigationalLink>
    </TabsTrigger>
  );
};

const DesktopTabs: React.FC = () => {
  const { stepOrder, stepLabels, stepErrors, currentStep, setCurrentStep } =
    useUnifiedFormLayout();
  return (
    <div className="flex-1 flex justify-center">
      <Tabs value={currentStep}>
        <TabsList>
          {stepOrder.map((step) => (
            <DesktopTabTrigger
              key={step}
              step={step}
              label={stepLabels[step]}
              errors={stepErrors[step]}
              onStepChange={() => setCurrentStep(step)}
            />
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};

const DesktopTitle: React.FC = () => {
  const { title, type } = useUnifiedFormLayout();
  return (
    <h1 className="text-lg sm:text-xl font-medium text-ellipsis whitespace-nowrap overflow-hidden">
      {title || `Untitled ${capitalize(type)}`}
    </h1>
  );
};

const DesktopActions: React.FC = () => {
  const { action, hasErrors, onCancel } = useUnifiedFormLayout();
  const { disabled } = useUnifiedFormLayout();
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
          action === 'create'
            ? 'default'
            : hasErrors
              ? 'destructive'
              : 'default'
        }
        size="default"
        disabled={disabled}
      >
        {action === 'create' ? (
          <SaveIcon />
        ) : hasErrors ? (
          <AlertCircleIcon />
        ) : (
          <SaveIcon />
        )}
        {action === 'create' ? 'Publish' : 'Save Changes'}
      </Button>
    </div>
  );
};

const DesktopFormHeader: React.FC<{ hideTabs?: boolean }> = ({ hideTabs }) => {
  return (
    <SiteHeader container={false}>
      <div className="grid grid-cols-3 w-full items-center gap-4">
        <DesktopTitle />
        {hideTabs ? <div /> : <DesktopTabs />}
        <DesktopActions />
      </div>
    </SiteHeader>
  );
};

export const DesktopFormLayout: React.FC<FormLayoutProps> = ({
  form,
  preview,
  previewFooter,
  hideTabs
}) => {
  const { currentStep } = useUnifiedFormLayout();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <DesktopFormHeader hideTabs={hideTabs} />
        <DemoBanner />

        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          <ResizablePanel
            defaultSize={30}
            className="min-w-[450px] xl:max-w-[800px] flex flex-col"
          >
            <div ref={scrollContainerRef} className="overflow-y-scroll flex-1">
              {form}
            </div>
            <UnifiedFormFooter />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize={60}
            className="min-w-[500px] xl:min-w-[800px] flex flex-col"
          >
            {preview}
            {previewFooter}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};
