'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Gem } from 'lucide-react';
interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature: 'multiple-posts' | 'schedule';
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  onClose,
  feature
}) => {
  const content = {
    'multiple-posts': {
      title: 'Unlock Multiple Posts',
      description:
        'Upgrade to PRO to pick winners across multiple X posts at once. Perfect for running giveaways with multiple entry methods or combining multiple posts into one drawing.'
    },
    schedule: {
      title: 'Schedule Your Picker',
      description:
        'Create an account and upgrade to PRO to unlock the ability to schedule your picker for later. Set a specific date and time for your drawing to run automatically.'
    },
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-primary" />
            {content[feature].title}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {content[feature].description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button asChild>
            <Link href="/pricing">Upgrade to PRO</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
