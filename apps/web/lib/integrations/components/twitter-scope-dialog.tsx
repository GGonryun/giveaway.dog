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
import type { TwitterFeatureSchema } from '../scopes';
import { TwitterScopeCheckbox } from './twitter-scope-checkbox';

interface TwitterScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (features: TwitterFeatureSchema[]) => void;
  existingFeatures?: TwitterFeatureSchema[];
}

export function TwitterScopeDialog({
  open,
  onOpenChange,
  onConfirm,
  existingFeatures = []
}: TwitterScopeDialogProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<
    Set<TwitterFeatureSchema>
  >(new Set(existingFeatures));

  useEffect(() => {
    if (open) {
      setSelectedFeatures(new Set(existingFeatures));
    }
  }, [open, existingFeatures]);

  const toggleFeature = (feature: TwitterFeatureSchema) => {
    const newFeatures = new Set(selectedFeatures);
    if (newFeatures.has(feature)) {
      newFeatures.delete(feature);
    } else {
      newFeatures.add(feature);
    }
    setSelectedFeatures(newFeatures);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedFeatures));
    onOpenChange(false);
  };

  const isImportTasksSelected = selectedFeatures.has('IMPORT_TASKS');
  const isPostTweetsSelected = selectedFeatures.has('POST_TWEETS');
  const hasSelection = selectedFeatures.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Twitter</DialogTitle>
          <DialogDescription>
            Choose which features you'd like to enable for your Twitter
            integration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <TwitterScopeCheckbox
            id="get-profile"
            checked={true}
            disabled={true}
            label="Basic profile access"
            description="Read your profile information and basic tweet data"
            required={true}
          />

          <TwitterScopeCheckbox
            id="import-tasks"
            checked={isImportTasksSelected}
            disabled={existingFeatures.includes('IMPORT_TASKS')}
            label="Import tasks from Twitter"
            description="Track follows, retweets, and likes from your audience"
            alreadyGranted={existingFeatures.includes('IMPORT_TASKS')}
            onCheckedChange={() => toggleFeature('IMPORT_TASKS')}
          />

          <TwitterScopeCheckbox
            id="post-tweets"
            checked={isPostTweetsSelected}
            disabled={existingFeatures.includes('POST_TWEETS')}
            label="Post to Twitter on my behalf"
            description="Auto-post sweepstakes announcements to your Twitter account"
            alreadyGranted={existingFeatures.includes('POST_TWEETS')}
            onCheckedChange={() => toggleFeature('POST_TWEETS')}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!hasSelection}
            type="button"
          >
            Connect Twitter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
