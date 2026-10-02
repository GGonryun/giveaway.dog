'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Check, Loader2, Plug } from 'lucide-react';
import { IDENTITY_PROVIDER_LABEL } from '../schemas/providers';
import { IntegrationFeatureConfig } from '../scopes';
import { useForm } from 'react-hook-form';
import {
  blueskyProfileRefineUrl,
  blueskyProfileRefineError
} from '../schemas/bluesky-helpers';

interface BlueskyConnectDialogProps<T extends string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (features: T[], handle: string) => void;
  features: IntegrationFeatureConfig[];
  existingFeatures?: T[];
}

interface FormData {
  handle: string;
}

export function BlueskyConnectDialog<T extends string>({
  open,
  onOpenChange,
  onConfirm,
  features,
  existingFeatures = []
}: BlueskyConnectDialogProps<T>) {
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(
    new Set(features.map((f) => f.id))
  );
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormData>({
    mode: 'onSubmit',
    defaultValues: {
      handle: ''
    }
  });

  useEffect(() => {
    if (open) {
      reset();
      setSelectedFeatures(new Set(features.map((f) => f.id)));
      setIsRedirecting(false);
    }
  }, [open, features, reset]);

  const toggleFeature = (featureId: string) => {
    const newFeatures = new Set(selectedFeatures);
    if (newFeatures.has(featureId)) {
      newFeatures.delete(featureId);
    } else {
      newFeatures.add(featureId);
    }
    setSelectedFeatures(newFeatures);
  };

  const onSubmit = (data: FormData) => {
    setIsRedirecting(true);
    const featureList = Array.from(selectedFeatures) as T[];
    onConfirm(featureList, data.handle.trim());
  };

  const providerName = IDENTITY_PROVIDER_LABEL.BLUESKY;
  const hasSelection = selectedFeatures.size > 0;

  return (
    <Dialog open={open} onOpenChange={isRedirecting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Connect {providerName}</DialogTitle>
            <DialogDescription>
              {isRedirecting
                ? `Redirecting to ${providerName}...`
                : `Enter your ${providerName} handle and choose which features you'd like to enable`}
            </DialogDescription>
          </DialogHeader>

          {isRedirecting ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Redirecting to {providerName} for authentication...
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="handle">{providerName} Handle</Label>
                  <Input
                    id="handle"
                    placeholder="username.bsky.social"
                    autoFocus
                    {...register('handle', {
                      required: 'Handle is required',
                      validate: (value) =>
                        blueskyProfileRefineUrl(value) ||
                        blueskyProfileRefineError
                    })}
                  />
                  {errors.handle && (
                    <p className="text-xs text-destructive">
                      {errors.handle.message}
                    </p>
                  )}
                  {!errors.handle && (
                    <p className="text-xs text-muted-foreground">
                      Enter your Bluesky handle (e.g., username.bsky.social)
                    </p>
                  )}
                </div>

                {features.map((feature) => {
                  const isChecked = selectedFeatures.has(feature.id);
                  const isDisabled =
                    feature.required ||
                    existingFeatures.includes(feature.id as T);

                  return (
                    <div
                      key={feature.id}
                      className="flex items-center space-x-3"
                    >
                      <Checkbox
                        id={feature.id}
                        checked={isChecked}
                        disabled={isDisabled}
                        onCheckedChange={() =>
                          !isDisabled && toggleFeature(feature.id)
                        }
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1">
                          <Label
                            htmlFor={feature.id}
                            className={
                              isDisabled
                                ? 'font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                                : 'cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                            }
                          >
                            {feature.label}
                          </Label>
                          {feature.required && (
                            <Shield
                              className="h-3 w-3 text-blue-600"
                              strokeWidth={3}
                            />
                          )}
                          {feature.alreadyGranted && (
                            <Check
                              className="h-3 w-3 text-green-600"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  type="button"
                  disabled={isRedirecting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!hasSelection || isRedirecting}>
                  <Plug className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
