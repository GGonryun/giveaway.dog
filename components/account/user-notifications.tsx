'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Mail,
  Smartphone,
  Trophy,
  Gift,
  Calendar,
  Trash2
} from 'lucide-react';

export function UserNotifications() {
  const [notificationSettings, setNotificationSettings] = useState({
    emailGiveawayUpdates: true,
    emailWinnerAnnouncements: true,
    emailNewGiveaways: false,
    pushGiveawayReminders: true,
    pushWinnerAnnouncements: true,
    pushNewGiveaways: false
  });

  const [isLoading, setIsLoading] = useState(false);

  const mockNotifications = [
    {
      id: 1,
      type: 'winner',
      title: 'Congratulations! You won!',
      message: 'You won the Travel Voucher Sweepstakes by WanderLust Travel',
      timestamp: '2024-01-20T10:30:00Z',
      read: false
    },
    {
      id: 2,
      type: 'giveaway_end',
      title: 'Giveaway ended',
      message:
        'The iPhone 15 Pro Giveaway has ended. Winners will be announced soon.',
      timestamp: '2024-01-19T15:45:00Z',
      read: true
    },
    {
      id: 3,
      type: 'reminder',
      title: 'Giveaway ending soon',
      message: "The Gaming Setup Contest ends in 24 hours. Don't miss out!",
      timestamp: '2024-01-18T12:00:00Z',
      read: true
    },
    {
      id: 4,
      type: 'new_giveaway',
      title: 'New giveaway available',
      message: 'TechReviews Co. just launched a new MacBook Pro giveaway',
      timestamp: '2024-01-17T09:15:00Z',
      read: true
    }
  ];

  const handleSettingChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'winner':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'giveaway_end':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'reminder':
        return <Bell className="h-4 w-4 text-orange-500" />;
      case 'new_giveaway':
        return <Gift className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to be notified about giveaways and updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="email-updates" className="font-medium">
                  Email Notifications
                </Label>
              </div>
            </div>

            <div className="ml-6 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-giveaway-updates" className="text-sm">
                  Giveaway updates and reminders
                </Label>
                <Switch
                  id="email-giveaway-updates"
                  checked={notificationSettings.emailGiveawayUpdates}
                  onCheckedChange={() =>
                    handleSettingChange('emailGiveawayUpdates')
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="email-winner-announcements" className="text-sm">
                  Winner announcements
                </Label>
                <Switch
                  id="email-winner-announcements"
                  checked={notificationSettings.emailWinnerAnnouncements}
                  onCheckedChange={() =>
                    handleSettingChange('emailWinnerAnnouncements')
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="email-new-giveaways" className="text-sm">
                  New giveaway alerts
                </Label>
                <Switch
                  id="email-new-giveaways"
                  checked={notificationSettings.emailNewGiveaways}
                  onCheckedChange={() =>
                    handleSettingChange('emailNewGiveaways')
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="push-notifications" className="font-medium">
                  Push Notifications
                </Label>
              </div>
            </div>

            <div className="ml-6 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="push-giveaway-reminders" className="text-sm">
                  Giveaway reminders
                </Label>
                <Switch
                  id="push-giveaway-reminders"
                  checked={notificationSettings.pushGiveawayReminders}
                  onCheckedChange={() =>
                    handleSettingChange('pushGiveawayReminders')
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="push-winner-announcements" className="text-sm">
                  Winner announcements
                </Label>
                <Switch
                  id="push-winner-announcements"
                  checked={notificationSettings.pushWinnerAnnouncements}
                  onCheckedChange={() =>
                    handleSettingChange('pushWinnerAnnouncements')
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="push-new-giveaways" className="text-sm">
                  New giveaway alerts
                </Label>
                <Switch
                  id="push-new-giveaways"
                  checked={notificationSettings.pushNewGiveaways}
                  onCheckedChange={() =>
                    handleSettingChange('pushNewGiveaways')
                  }
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              Your latest notifications and updates
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  !notification.read ? 'bg-muted/50' : ''
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">
                      {notification.title}
                    </h4>
                    {!notification.read && (
                      <Badge variant="default" className="h-5 text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(notification.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
