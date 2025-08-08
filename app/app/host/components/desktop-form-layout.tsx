import { SiteHeader } from '@/components/patterns/app-sidebar/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XIcon, SaveIcon } from 'lucide-react';
import Link from 'next/link';
import { UnifiedFormFooter } from './unified-form-footer';
import React, { useCallback, useMemo } from 'react';
import { SWEEPSTAKE_STEPS, SweepstakeStep } from '@/components/data/form-steps';
import { useFormIssues } from '@/components/hooks/use-form-issues';
import { useSweepstakesStep } from '@/components/hooks/use-sweepstake-step';

interface DesktopFormLayoutProps {
  title: string;
  onSubmit: () => void;
  disabled: boolean;
  left: React.ReactNode;
  right: React.ReactNode;
}

export const DesktopTabTrigger: React.FC<{
  step: SweepstakeStep;
  label: string;
}> = ({ step, label }) => {
  const { formErrors, trigger } = useFormIssues({ step });
  const errors = useMemo(() => formErrors.length, [formErrors]);
  const currentStep = useSweepstakesStep();

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
  const step = useSweepstakesStep();

  return (
    <div className="flex-1 flex justify-center">
      <Tabs value={step}>
        <TabsList size="lg">
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
    <div className="flex-1">
      <h1 className="text-lg sm:text-xl font-medium">{title}</h1>
    </div>
  );
};

const DesktopActions: React.FC<{ disabled: boolean }> = ({ disabled }) => {
  return (
    <div className="flex-1 flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="default"
        disabled={disabled}
      >
        <XIcon />
        Cancel
      </Button>
      <Button type="submit" size="default" disabled={disabled}>
        <SaveIcon />
        Publish
      </Button>
    </div>
  );
};

const DesktopFormHeader: React.FC<{
  title: string;
  disabled: boolean;
}> = ({ title, disabled }) => {
  return (
    <SiteHeader>
      <div className="flex items-center w-full">
        <DesktopTitle title={title} />
        <DesktopTabs />
        <DesktopActions disabled={disabled} />
      </div>
    </SiteHeader>
  );
};

const PreviewFooter: React.FC = () => {
  return (
    <div className="bg-background border-t p-3">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">Preview Mode</div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm">
            Share Preview
          </Button>
          <Button type="button" variant="outline" size="sm">
            Test Giveaway
          </Button>
        </div>
      </div>
    </div>
  );
};

export const DesktopFormLayout: React.FC<DesktopFormLayoutProps> = ({
  title,
  onSubmit,
  disabled,
  left,
  right
}) => {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <form
        onSubmit={onSubmit}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <DesktopFormHeader title={title} disabled={disabled} />

        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          <ResizablePanel
            defaultSize={30}
            className="min-w-[350px] xl:max-w-[800px] flex flex-col"
          >
            <div className="space-y-2 overflow-y-scroll flex-1">{left}</div>
            <UnifiedFormFooter mobile={false} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize={60}
            className="min-w-[500px] xl:min-w-[800px] flex flex-col"
          >
            <div className="overflow-hidden w-full flex-1 flex items-center justify-center bg-tertiary-10">
              {right}
            </div>
            <PreviewFooter />
          </ResizablePanel>
        </ResizablePanelGroup>
      </form>
    </div>
  );
};
