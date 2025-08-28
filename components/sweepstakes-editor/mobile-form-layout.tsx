import { SiteHeader } from '@/components/patterns/app-sidebar/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XIcon, SaveIcon, EyeIcon, EditIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useCallback, useMemo, useState } from 'react';
import { UnifiedFormFooter } from './unified-form-footer';
import { useSweepstakes } from '@/components/hooks/use-sweepstake-step';
import { SWEEPSTAKE_STEPS } from '@/components/data/form-steps';
import { useFormIssues } from '@/components/hooks/use-form-issues';
import { useRouter } from 'next/navigation';
import { usePreviewState } from './contexts/preview-state-context';
import { getStateDisplayLabel } from '@/schemas/giveaway';
import { FormHeaderProps, FormLayoutProps } from './form-layout';

const MobileTabTrigger: React.FC<{
  step: string;
  label: string;
  mobileView: 'form' | 'preview';
}> = ({ step, label, mobileView }) => {
  const { formErrors, trigger } = useFormIssues({ step });
  const errors = useMemo(() => formErrors.length, [formErrors]);
  const { step: currentStep } = useSweepstakes();

  const handleJumpToField = useCallback(() => {
    setTimeout(() => {
      trigger(currentStep);
    }, 100);
  }, [currentStep]);

  return (
    <TabsTrigger asChild value={step} className="flex-1">
      <Link
        href={`?step=${step}`}
        onClick={handleJumpToField}
        className={cn(
          'flex gap-1 w-full data-[state=active]:border-l data-[state=active]:border-t data-[state=active]:border-r h-7 mt-1',
          mobileView === 'preview' && 'data-[state=active]:bg-tertiary-10'
        )}
      >
        {label}
        {Boolean(errors) && (
          <Badge
            variant="destructive"
            className="text-xs h-4 w-4 p-0 m-0 leading-none"
          >
            {errors}
          </Badge>
        )}
      </Link>
    </TabsTrigger>
  );
};

const MobileFormHeader: React.FC<
  {
    mobileView: 'form' | 'preview';
  } & FormHeaderProps
> = ({ title, disabled, mobileView, onCancel }) => {
  const { step } = useSweepstakes();

  return (
    <SiteHeader className="h-20">
      <div className="flex flex-col w-full gap-1.5 pt-1.5">
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
        <div className="w-full">
          <Tabs value={step}>
            <TabsList size="sm" className="w-full px-1 gap-1 m-0 mt-[1px]  h-8">
              {SWEEPSTAKE_STEPS.map((step) => (
                <MobileTabTrigger
                  key={step.key}
                  step={step.key}
                  label={step.label}
                  mobileView={mobileView}
                />
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
    </SiteHeader>
  );
};

const PreviewFooter: React.FC = () => {
  const { previewState } = usePreviewState();

  return (
    <div className="bg-background border-t p-3">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Preview Mode - {getStateDisplayLabel(previewState)}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm">
            Share
          </Button>
        </div>
      </div>
    </div>
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
  title,
  onCancel,
  disabled,
  left,
  right
}) => {
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form');

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileFormHeader
          title={title}
          disabled={disabled}
          onCancel={onCancel}
          mobileView={mobileView}
        />

        <div className="bg-background flex-1 min-h-0 overflow-hidden relative top-0 z-10 flex flex-col">
          {mobileView === 'form' ? (
            <>
              <div className="overflow-y-scroll flex-1">{left}</div>
              <UnifiedFormFooter mobile={true} />
            </>
          ) : (
            <>
              <div className="overflow-auto w-full flex-1 bg-tertiary-10 p-4 flex">
                <div className="mx-auto my-auto w-full max-w-2xl min-w-fit">
                  {right}
                </div>
              </div>
              <PreviewFooter />
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
