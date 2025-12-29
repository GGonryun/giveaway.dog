'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Check, Plug } from 'lucide-react';
import { IDENTITY_PROVIDER_LABEL } from '../schemas/providers';
import { IntegrationFeatureConfig } from '../scopes';

interface TwitterConnectDialogProps<T extends string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (features: T[]) => void;
  isLoading?: boolean;
  features: IntegrationFeatureConfig[];
  existingFeatures?: T[];
}

export function TwitterConnectDialog<T extends string>({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  features,
  existingFeatures = []
}: TwitterConnectDialogProps<T>) {
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(
    new Set(features.map((f) => f.id))
  );

  useEffect(() => {
    if (open) {
      setSelectedFeatures(new Set(features.map((f) => f.id)));
    }
  }, [open, features]);

  const toggleFeature = (featureId: string) => {
    const newFeatures = new Set(selectedFeatures);
    if (newFeatures.has(featureId)) {
      newFeatures.delete(featureId);
    } else {
      newFeatures.add(featureId);
    }
    setSelectedFeatures(newFeatures);
  };

  const handleConfirm = () => {
    const featureList = Array.from(selectedFeatures) as T[];
    onConfirm(featureList);
  };

  const providerName = IDENTITY_PROVIDER_LABEL.TWITTER;
  const hasSelection = selectedFeatures.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect {providerName}</DialogTitle>
          <DialogDescription>
            Choose which features you'd like to enable for your {providerName}{' '}
            integration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {features.map((feature) => {
            const isChecked = selectedFeatures.has(feature.id);
            const isDisabled =
              feature.required || existingFeatures.includes(feature.id as T);

            return (
              <div key={feature.id} className="flex items-center space-x-3">
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
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!hasSelection || isLoading}
            type="button"
          >
            {!isLoading && <Plug className="h-4 w-4 mr-2" />}
            {isLoading ? 'Connecting...' : `Connect`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
