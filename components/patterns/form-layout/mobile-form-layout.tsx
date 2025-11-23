'use client';

import { SiteHeader } from '@/components/patterns/app-sidebar/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XIcon, SaveIcon, EyeIcon, EditIcon } from 'lucide-react';
import { useState } from 'react';
import { FormLayoutProps } from './types';
import { UnifiedFormFooter } from './unified-form-footer';
import { useUnifiedFormLayout } from './use-unified-form-layout';
import { DemoBanner } from './demo-banner';
import { NonNavigationalLink } from '../links';
import { cn } from '@/lib/utils';

const MobileTabTrigger: React.FC<{
  step: string;
  label: string;
  onStepChange: () => void;
  errors?: number;
}> = ({ step, label, errors = 0, onStepChange }) => {
  return (
    <TabsTrigger asChild value={step} className="text-xs">
      <NonNavigationalLink href={`?step=${step}`} onClick={onStepChange}>
        {label}
        {Boolean(errors) && (
          <Badge
            variant="destructive"
            className="text-xs h-4 w-4 p-0 m-0 leading-none"
          >
            {errors}
          </Badge>
        )}
      </NonNavigationalLink>
    </TabsTrigger>
  );
};

const MobileFormHeader: React.FC<{ hideTabs?: boolean }> = ({ hideTabs }) => {
  const {
    title,
    disabled,
    currentStep,
    setCurrentStep,
    onCancel,
    stepOrder,
    stepErrors,
    stepLabels
  } = useUnifiedFormLayout();
  return (
    <SiteHeader className={cn(hideTabs ? 'h-14' : 'h-22')}>
      <div className="flex flex-col w-full gap-1.5">
        <div className="flex items-center">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-medium truncate">{title}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              onClick={onCancel}
            >
              <XIcon />
            </Button>
            <Button type="submit" size="icon" disabled={disabled}>
              <SaveIcon />
            </Button>
          </div>
        </div>
        {hideTabs ? null : (
          <div className="w-full">
            <Tabs value={currentStep}>
              <TabsList className="w-full min-w-fit p-1 gap-1 h-8 shadow-none">
                {stepOrder.map((step) => (
                  <MobileTabTrigger
                    key={step}
                    step={step}
                    label={stepLabels[step]}
                    errors={stepErrors[step] || 0}
                    onStepChange={() => setCurrentStep(step)}
                  />
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>
    </SiteHeader>
  );
};

const MobileViewToggle: React.FC<{
  mobileView: 'form' | 'preview';
  onMobileViewChange: (view: 'form' | 'preview') => void;
}> = ({ mobileView, onMobileViewChange }) => {
  return (
    <div className="bg-background border-t p-2">
      <div className="flex bg-muted rounded-lg p-1 w-full gap-2">
        <Button
          type="button"
          variant={mobileView === 'form' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onMobileViewChange('form')}
          className="flex-1"
        >
          <EditIcon className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          type="button"
          variant={mobileView === 'preview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onMobileViewChange('preview')}
          className="flex-1"
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </div>
    </div>
  );
};

export const MobileFormLayout: React.FC<FormLayoutProps> = ({
  form,
  preview,
  previewFooter,
  hideTabs
}) => {
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form');

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileFormHeader hideTabs={hideTabs} />
        <DemoBanner />

        <div className="bg-background flex-1 min-h-0 overflow-hidden relative top-0 z-10 flex flex-col">
          {mobileView === 'form' ? (
            <>
              <div className="overflow-y-scroll flex-1">{form}</div>
              <UnifiedFormFooter />
            </>
          ) : (
            <>
              {preview}
              {previewFooter}
            </>
          )}
          <MobileViewToggle
            mobileView={mobileView}
            onMobileViewChange={setMobileView}
          />
        </div>
      </div>
    </div>
  );
};
