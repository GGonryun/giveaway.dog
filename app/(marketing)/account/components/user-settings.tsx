'use client';

import { useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EmojiPickerComponent } from '@/components/patterns/emoji-picker';
import {
  User,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  LogOut
} from 'lucide-react';
import { useUser } from '@/components/context/user-provider';
import logout from '@/actions/auth/logout';

export function UserSettings() {
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    emoji: '🐶',
    region: 'US',
    age: '25'
  });

  const user = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  // TODO: don't rely on the first provider.
  const provider = useMemo(() => user.providers[0], [user.providers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmojiSelect = (emoji: string) => {
    setFormData((prev) => ({ ...prev, emoji }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleSaveEmail = async () => {
    setIsEmailLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsEmailLoading(false);
  };

  const handleSendVerification = async () => {
    setIsEmailLoading(true);
    // Simulate sending verification email
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsEmailLoading(false);
  };

  const handleDeleteAccount = async () => {
    // Handle account deletion
    console.log('Account deletion requested');
  };

  const handleLogout = async () => {
    await logout();
  };

  const canChangeEmail = provider === 'twitter' || provider === 'magic-link';
  const needsEmail = provider === 'twitter' && !user.email;
  const needsVerification = user.email && !user.emailVerified;

  const regions = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'JP', label: 'Japan' },
    { value: 'BR', label: 'Brazil' },
    { value: 'IN', label: 'India' },
    { value: 'MX', label: 'Mexico' }
  ];

  return (
    <div className="space-y-6">
      {/* Profile Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information, avatar, and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Emoji Avatar Picker */}
          <div>
            <Label className="text-sm font-medium">Avatar</Label>
            <div className="mt-2">
              <EmojiPickerComponent
                value={formData.emoji}
                onEmojiSelect={handleEmojiSelect}
                title="Choose your avatar emoji"
                description="This emoji will represent you in the app"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="Enter your display name"
                />
              </div>
            </div>

            {/* Region Selection */}
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={formData.region}
                  onValueChange={(value) => handleSelectChange('region', value)}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select your region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="13"
                  max="120"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="Enter your age"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Email Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Email Management</CardTitle>
          <CardDescription>
            Manage your email address and verification status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Verification Warning */}
          {needsVerification && (
            <Alert variant="error">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Email Verification Required</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>
                  Please verify your email address to access all features.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendVerification}
                  disabled={isEmailLoading}
                >
                  {isEmailLoading ? 'Sending...' : 'Send Verification'}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Twitter No Email Warning */}
          {needsEmail && (
            <Alert variant="error">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Email Required</AlertTitle>
              <AlertDescription>
                Please add and verify an email address for advanced
                functionality and security.
              </AlertDescription>
            </Alert>
          )}

          {/* Email Address Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="pl-10"
                placeholder="Enter your email address"
                disabled={!canChangeEmail}
              />
              {user.emailVerified && (
                <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
              )}
            </div>
            {!canChangeEmail && (
              <p className="text-xs text-muted-foreground">
                <AlertTriangle className="inline h-3 w-3 mr-1" />
                This email cannot be changed as it's linked to your {
                  provider
                }{' '}
                account.
              </p>
            )}
          </div>

          {canChangeEmail && (
            <>
              <Button
                onClick={handleSaveEmail}
                disabled={isEmailLoading}
                className="w-full"
                variant="outline"
              >
                {isEmailLoading ? 'Updating...' : 'Update Email'}
              </Button>
              <p className="text-xs text-muted-foreground">
                A verification email will be sent to your new email address.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Account Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>
            Manage your account settings and deletion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you sure you want to delete your account?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    This action cannot be undone. Your account will be
                    permanently deleted.
                  </p>
                  <p className="font-medium text-amber-600">
                    ⚠️ Your account deletion will be fully processed after any
                    giveaways you've entered have completed.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <p className="text-xs text-muted-foreground">
            Account deletion is permanent and cannot be reversed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
