'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings2 } from 'lucide-react';
import { useMemo, useState, useCallback, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Typography } from '@/components/ui/typography';
import { widetype } from '@/lib/widetype';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

import { stringifyTerms } from '../terms';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { GiveawayFormSchema, GiveawayTerms } from '@/schemas/giveaway';
import { SweepstakesTermsType } from '@prisma/client';
import { toBrowsePageUrl } from '@/components/sweepstakes/util';
import { useSweepstakes } from '@/components/hooks/use-sweepstake-step';
import {
  DEFAULT_WINNER_SELECTION_METHOD,
  DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
  DEFAULT_CLAIM_DEADLINE_DAYS
} from '@/schemas/giveaway/defaults';

const OPTIONS: Record<SweepstakesTermsType, string> = {
  [SweepstakesTermsType.TEMPLATE]: 'Default',
  [SweepstakesTermsType.CUSTOM]: 'Custom'
};

export const TermsAndConditions = () => {
  const { id } = useSweepstakes();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Store initial form values to rollback to on discard
  const initialTermsValues = useRef<GiveawayTerms | null>(null);

  const form = useFormContext<GiveawayFormSchema>();

  const terms = useWatch({
    name: 'terms',
    control: form.control
  });

  // Watch for form state to determine if save should be disabled
  const { errors, dirtyFields } = form.formState;

  // Memoize error and dirty field checks to prevent unnecessary re-renders
  const termsErrors = useMemo(() => {
    return errors.terms ? Object.keys(errors.terms).length > 0 : false;
  }, [errors.terms]);

  const termsDirtyFields = useMemo(() => {
    return dirtyFields.terms
      ? Object.keys(dirtyFields.terms).length > 0
      : false;
  }, [dirtyFields.terms]);

  const canSave = useMemo(() => !termsErrors, [termsErrors]);
  const hasUnsavedChanges = useMemo(() => termsDirtyFields, [termsDirtyFields]);

  const livePreview = useMemo(() => {
    const data = form.getValues();
    if (terms.type === SweepstakesTermsType.TEMPLATE) {
      return stringifyTerms({
        prizes: data.prizes,
        sweepstakesName: data.setup.name,
        eligibilityRegions: 'Global',
        startDate: format(data.timing.startDate, 'MMMM d, yyyy'),
        endDate: format(data.timing.endDate, 'MMMM d, yyyy'),
        entryUrl: toBrowsePageUrl(id),
        ...terms
      });
    } else {
      return stringifyTerms();
    }
  }, [terms, form.getValues]);

  const handleSave = useCallback(async () => {
    // Trigger validation for terms fields to get current errors
    const isValid = await form.trigger('terms');

    // Check for any errors in terms fields
    const termsErrors = Object.keys(form.formState.errors.terms || {});
    const hasErrors = termsErrors.length > 0;

    // Prevent saving if there are validation errors
    if (!isValid || hasErrors) {
      return; // Don't close the sheet or save if there are issues
    }

    // parentForm.setValue('setup.terms', termsData);
    setIsSheetOpen(false);
  }, [form]);

  const handleCloseAttempt = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowDiscardDialog(true);
    } else {
      setIsSheetOpen(false);
    }
  }, [hasUnsavedChanges]);

  const handleDiscardChanges = useCallback(() => {
    // Restore the form to initial values when sheet was opened
    if (initialTermsValues.current) {
      // Get current form values
      const currentValues = form.getValues();

      // Create new form state with initial terms values restored
      const restoredValues = {
        ...currentValues,
        terms: initialTermsValues.current
      };

      // Reset the entire form with restored values to clear dirty state
      form.reset(restoredValues);
    }

    setShowDiscardDialog(false);
    setIsSheetOpen(false);
  }, [form]);

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleCloseAttempt();
      } else {
        setIsSheetOpen(true);
      }
    },
    [handleCloseAttempt]
  );

  // Memoize button handlers to prevent re-renders
  const handleOpenSheet = useCallback(() => {
    // Capture current terms values as initial state
    initialTermsValues.current = { ...form.getValues('terms') };
    setIsSheetOpen(true);
  }, [form]);

  const handleTermsTypeChange = useCallback(
    (key: SweepstakesTermsType) => {
      form.setValue('terms.type', key);
    },
    [form]
  );

  // Memoize button props to prevent re-renders
  const saveButtonProps = useMemo(
    () => ({
      onClick: handleSave,
      className: 'w-full',
      disabled: !canSave,
      title: !canSave
        ? termsErrors
          ? 'Please fix validation errors before saving'
          : 'Please save or discard your changes before closing'
        : undefined
    }),
    [handleSave, canSave, termsErrors]
  );

  return (
    <FormField
      control={form.control}
      name="terms"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Terms & Conditions</FormLabel>

          <FormControl>
            <div className="space-y-2">
              <div className="flex gap-2">
                {widetype.entries(OPTIONS).map(([key, label]) => (
                  <Button
                    type="button"
                    className="flex flex-col justify-start items-start text-left grow"
                    variant={key === terms.type ? 'default' : 'outline'}
                    key={key}
                    onClick={() => handleTermsTypeChange(key)}
                  >
                    <div className="flex justify-between items-center w-full">
                      <Typography.Paragraph weight="semibold">
                        {label}
                      </Typography.Paragraph>
                      <RadioIcon checked={terms.type === key} />
                    </div>
                  </Button>
                ))}
              </div>
              {field.value.type === SweepstakesTermsType.TEMPLATE ? (
                <ButtonTextarea
                  onOpenSheet={handleOpenSheet}
                  defaultValue={livePreview}
                />
              ) : (
                <Textarea
                  rows={12}
                  placeholder={stringifyTerms()}
                  value={field.value.text}
                  onChange={(e) => {
                    form.setValue('terms.text', e.currentTarget.value);
                  }}
                />
              )}
            </div>
          </FormControl>
          <FormMessage />

          <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
            <SheetContent
              side="left"
              className="w-full gap-0 sm:w-[95vw] lg:w-[90vw] xl:w-[85vw] sm:max-w-[1500px] overflow-hidden p-0 flex flex-col"
            >
              <SheetHeader className="border-b sticky top-0 bg-background z-10 flex-shrink-0">
                <SheetTitle>Customize Terms & Conditions</SheetTitle>
                <SheetDescription>
                  Configure the details that will be used to generate your terms
                  and conditions.
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col lg:flex-row lg:gap-8 flex-1 lg:overflow-hidden overflow-y-auto">
                <div className="flex-1 p-4 sm:p-6 lg:overflow-y-auto xl:max-w-[700px] lg:min-h-0">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="terms.sponsorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sponsor Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="terms.sponsorAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sponsor Address (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123 Main St, City, Country"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="terms.winnerSelectionMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Winner Selection Method</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={DEFAULT_WINNER_SELECTION_METHOD}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="terms.notificationTimeframeDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Winners will be contacted in (days)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="30"
                              placeholder={DEFAULT_NOTIFICATION_TIMEFRAME_DAYS.toString()}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 1)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="terms.claimDeadlineDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Winner must claim within (days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="90"
                              placeholder={DEFAULT_CLAIM_DEADLINE_DAYS.toString()}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 1)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="terms.governingLawCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Governing Law Country</FormLabel>
                          <FormControl>
                            <Input placeholder="USA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="terms.privacyPolicyUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Privacy Policy URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://yourcompany.com/privacy"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="terms.additionalTerms"
                      render={({ field }) => (
                        <FormItem className="xl:col-span-2">
                          <FormLabel>Additional Terms</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any additional terms and conditions..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex-none lg:flex-1 lg:h-auto lg:border-l lg:border-border bg-sidebar">
                  <div className="lg:h-full lg:overflow-y-auto p-4 border-t lg:border-t-0 sm:p-6">
                    <h3 className="text-sm font-medium mb-3">Live Preview</h3>
                    <div className="text-xs bg-background rounded-md p-4 border whitespace-pre-wrap font-mono leading-relaxed">
                      {livePreview}
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter className="border-t sticky bottom-0 bg-background z-10 flex-shrink-0">
                <Button {...saveButtonProps}>Save Terms & Conditions</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <DiscardChangesDialog
            open={showDiscardDialog}
            onOpenChange={setShowDiscardDialog}
            onDiscard={handleDiscardChanges}
          />
        </FormItem>
      )}
    />
  );
};

const RadioIcon: React.FC<{ checked: boolean }> = ({ checked }) => {
  return (
    <div
      className={cn(
        'w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center',
        checked && 'border-primary-foreground '
      )}
    >
      {checked && (
        <div className="w-2.5 h-2.5 bg-primary-foreground rounded-full" />
      )}
    </div>
  );
};

type ButtonTextareaProps = {
  onOpenSheet: () => void;
  defaultValue: string;
};

const ButtonTextarea: React.FC<ButtonTextareaProps> = ({
  onOpenSheet,
  defaultValue
}) => {
  return (
    <div className="relative w-full">
      <Textarea rows={12} defaultValue={defaultValue} />

      <div
        className="absolute border inset-0 bg-white/60 backdrop-blur-[1px] opacity-100 lg:opacity-0 hover:opacity-100 transition-opacity rounded-md flex items-center justify-center cursor-pointer"
        onClick={onOpenSheet}
      >
        <Button type="button">
          <Settings2 />
          Modify
        </Button>
      </div>
    </div>
  );
};

type DiscardChangesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
};

const DiscardChangesDialog: React.FC<DiscardChangesDialogProps> = ({
  open,
  onOpenChange,
  onDiscard
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard all changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes to your terms and conditions. If you close
            now, you will lose all your changes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDiscard}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Discard changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
