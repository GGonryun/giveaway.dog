'use client';

import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  PickerFilterSettings,
  PickerActions
} from '@/lib/pickers/schemas/models';

interface PickerFilterSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PickerFilterSettings;
  actions: PickerActions;
  onSave: (filters: PickerFilterSettings, actions: PickerActions) => void;
}

export const PickerFilterSettingsDialog: React.FC<
  PickerFilterSettingsDialogProps
> = ({ open, onOpenChange, filters, actions, onSave }) => {
  const [minimumPostCount, setMinimumPostCount] = useState(
    filters.minimumPostCount?.toString() ?? ''
  );
  const [minimumAccountAgeDays, setMinimumAccountAgeDays] = useState(
    filters.minimumAccountAgeDays?.toString() ?? ''
  );
  const [minimumFollowing, setMinimumFollowing] = useState(
    filters.minimumFollowing?.toString() ?? ''
  );
  const [minimumFollowers, setMinimumFollowers] = useState(
    filters.minimumFollowers?.toString() ?? ''
  );
  const [hasProfileImage, setHasProfileImage] = useState(
    filters.hasProfileImage
  );
  const [hasBanner, setHasBanner] = useState(filters.hasBanner);
  const [hasLocation, setHasLocation] = useState(filters.hasLocation);
  const [hasDescription, setHasDescription] = useState(filters.hasDescription);

  const [like, setLike] = useState(actions.like);
  const [retweet, setRetweet] = useState(actions.retweet);
  const [quote, setQuote] = useState(actions.quote);
  const [reply, setReply] = useState(actions.reply);

  const handleSave = () => {
    onSave(
      {
        pickerId: filters.pickerId,
        minimumPostCount: minimumPostCount ? parseInt(minimumPostCount) : null,
        minimumAccountAgeDays: minimumAccountAgeDays
          ? parseInt(minimumAccountAgeDays)
          : null,
        minimumFollowing: minimumFollowing ? parseInt(minimumFollowing) : null,
        minimumFollowers: minimumFollowers ? parseInt(minimumFollowers) : null,
        hasProfileImage,
        hasBanner,
        hasLocation,
        hasDescription
      },
      {
        pickerId: actions.pickerId,
        like,
        retweet,
        quote,
        reply
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Settings & Requirements</DialogTitle>
          <DialogDescription>
            Configure filters and requirements for valid entries. Leave numeric
            fields blank to disable them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Required Actions</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="like"
                  checked={like}
                  onCheckedChange={(checked) => setLike(checked as boolean)}
                />
                <Label htmlFor="like" className="cursor-pointer">
                  ❤️ Like
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="retweet"
                  checked={retweet}
                  onCheckedChange={(checked) => setRetweet(checked as boolean)}
                />
                <Label htmlFor="retweet" className="cursor-pointer">
                  🔁 Retweet
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="quote"
                  checked={quote}
                  onCheckedChange={(checked) => setQuote(checked as boolean)}
                />
                <Label htmlFor="quote" className="cursor-pointer">
                  💬 Quote
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reply"
                  checked={reply}
                  onCheckedChange={(checked) => setReply(checked as boolean)}
                />
                <Label htmlFor="reply" className="cursor-pointer">
                  💭 Reply
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Profile Requirements</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasProfileImage"
                  checked={hasProfileImage}
                  onCheckedChange={(checked) =>
                    setHasProfileImage(checked as boolean)
                  }
                />
                <Label htmlFor="hasProfileImage" className="cursor-pointer">
                  Has Profile Image
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasBanner"
                  checked={hasBanner}
                  onCheckedChange={(checked) =>
                    setHasBanner(checked as boolean)
                  }
                />
                <Label htmlFor="hasBanner" className="cursor-pointer">
                  Has Banner
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasLocation"
                  checked={hasLocation}
                  onCheckedChange={(checked) =>
                    setHasLocation(checked as boolean)
                  }
                />
                <Label htmlFor="hasLocation" className="cursor-pointer">
                  Has Location
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasDescription"
                  checked={hasDescription}
                  onCheckedChange={(checked) =>
                    setHasDescription(checked as boolean)
                  }
                />
                <Label htmlFor="hasDescription" className="cursor-pointer">
                  Has Bio/Description
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Account Filters</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="minimumPostCount">Minimum Post Count</Label>
                <Input
                  id="minimumPostCount"
                  type="number"
                  min="0"
                  placeholder="e.g., 10"
                  value={minimumPostCount}
                  onChange={(e) => setMinimumPostCount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  User must have at least this many total posts/tweets
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumAccountAgeDays">
                  Minimum Account Age (days)
                </Label>
                <Input
                  id="minimumAccountAgeDays"
                  type="number"
                  min="0"
                  placeholder="e.g., 30"
                  value={minimumAccountAgeDays}
                  onChange={(e) => setMinimumAccountAgeDays(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Account must be at least this many days old
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumFollowing">Minimum Following</Label>
                <Input
                  id="minimumFollowing"
                  type="number"
                  min="0"
                  placeholder="e.g., 10"
                  value={minimumFollowing}
                  onChange={(e) => setMinimumFollowing(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  User must be following at least this many accounts
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumFollowers">Minimum Followers</Label>
                <Input
                  id="minimumFollowers"
                  type="number"
                  min="0"
                  placeholder="e.g., 100"
                  value={minimumFollowers}
                  onChange={(e) => setMinimumFollowers(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  User must have at least this many followers
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
