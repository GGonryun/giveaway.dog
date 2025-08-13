'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Shield,
  Clock,
  Globe,
  Mail,
  Bell,
  Save,
  AlertTriangle,
  Eye,
  EyeOff,
  Calendar
} from 'lucide-react';
import { useState } from 'react';
import { SweepstakesRulesEditor } from './sweepstakes-rules-editor';

interface SweepstakesDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  endsAt?: string;
  landingPageUrl?: string;
}

interface SweepstakesSettingsProps {
  sweepstakes: SweepstakesDetails;
}

export const SweepstakesSettings = ({ sweepstakes }: SweepstakesSettingsProps) => {
  const [isPublic, setIsPublic] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoEnd, setAutoEnd] = useState(true);
  const [requireVerification, setRequireVerification] = useState(true);
  const [allowMultipleEntries, setAllowMultipleEntries] = useState(false);
  const [isModified, setIsModified] = useState(false);

  const handleSave = () => {
    // Simulate save
    setIsModified(false);
    console.log('Settings saved');
  };

  const handleSettingChange = (setter: (value: boolean) => void, value: boolean) => {
    setter(value);
    setIsModified(true);
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>General Settings</span>
          </CardTitle>
          <CardDescription>
            Basic configuration for your sweepstakes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="title">Sweepstakes Title</Label>
              <Input
                id="title"
                defaultValue={sweepstakes.title}
                onChange={() => setIsModified(true)}
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={sweepstakes.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              defaultValue={sweepstakes.description}
              rows={3}
              onChange={() => setIsModified(true)}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="end-date">End Date & Time</Label>
              <Input
                id="end-date"
                type="datetime-local"
                defaultValue={sweepstakes.endsAt ? new Date(sweepstakes.endsAt).toISOString().slice(0, 16) : ''}
                onChange={() => setIsModified(true)}
              />
            </div>
            
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select defaultValue="UTC">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Privacy & Access</span>
          </CardTitle>
          <CardDescription>
            Control who can see and participate in your sweepstakes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Public Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Make this sweepstakes visible in public listings
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={(checked) => handleSettingChange(setIsPublic, checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Require Email Verification</Label>
              <p className="text-sm text-muted-foreground">
                Users must verify their email before entering
              </p>
            </div>
            <Switch
              checked={requireVerification}
              onCheckedChange={(checked) => handleSettingChange(setRequireVerification, checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Allow Multiple Entries</Label>
              <p className="text-sm text-muted-foreground">
                Let users enter multiple times (increases engagement)
              </p>
            </div>
            <Switch
              checked={allowMultipleEntries}
              onCheckedChange={(checked) => handleSettingChange(setAllowMultipleEntries, checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
          </CardTitle>
          <CardDescription>
            Configure email alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about new entries and milestones
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={(checked) => handleSettingChange(setEmailNotifications, checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Auto-end When Date Reached</Label>
              <p className="text-sm text-muted-foreground">
                Automatically end the sweepstakes at the specified date
              </p>
            </div>
            <Switch
              checked={autoEnd}
              onCheckedChange={(checked) => handleSettingChange(setAutoEnd, checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Anti-fraud Rules */}
      <SweepstakesRulesEditor />

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription>
            Irreversible actions that permanently affect your sweepstakes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div>
              <p className="font-medium">Delete Sweepstakes</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this sweepstakes and all associated data
              </p>
            </div>
            <Button variant="destructive">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Actions */}
      {isModified && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700">
                  You have unsaved changes
                </span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setIsModified(false)}>
                  Discard
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
