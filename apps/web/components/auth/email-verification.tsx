'use client';

import { useState } from 'react';
import { Card, CardContent } from '@giveaway/ui-primitives/card';
import { Button } from '@giveaway/ui-primitives/button';
import { Input } from '@giveaway/ui-primitives/input';
import { Label } from '@giveaway/ui-primitives/label';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';
import {
  Mail,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  MailCheck,
  PlusIcon,
  SaveIcon,
  XIcon,
  UnlinkIcon
} from 'lucide-react';
import { useProcedure } from '@giveaway/rpc-client/hook';
import sendEmailVerification from '@/procedures/user/send-email-verification';
import updateEmail from '@/procedures/user/update-email';
import { toast } from 'sonner';
import { Spinner } from '@giveaway/ui-primitives/spinner';
import { UserProfileSchema } from '@giveaway/user-model/user';
import { useRouter } from 'next/navigation';
import { SettingsCard } from '@giveaway/ui-layouts/settings-card';

interface EmailVerificationProps {
  title?: string;
  description?: string;
  showCard?: boolean;
  user: UserProfileSchema;
  redirectTo?: string;
  verificationText?: string;
  verifyEmail: boolean;
}

export function EmailVerification({
  title = 'Email Verification',
  description = 'Manage your email address and verification status',
  verificationText = 'Please add and verify an email address to participate in this giveaway.',
  showCard = true,
  user,
  redirectTo,
  verifyEmail
}: EmailVerificationProps) {
  const router = useRouter();

  const [emailInput, setEmailInput] = useState(user.email || '');
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const sendVerificationProcedure = useProcedure({
    action: sendEmailVerification,
    onSuccess() {
      toast.success('Verification email sent successfully');
      setEmailSent(true);
      setSentToEmail(emailInput || user.email || '');
      router.refresh();
    },
    onFailure(error: any) {
      toast.error(error.message || 'Failed to send verification email');
    }
  });

  const updateEmailProcedure = useProcedure({
    action: updateEmail,
    onSuccess() {
      toast.success('Email updated successfully');
      // Now send verification email to the new address
      if (emailInput) {
        sendVerificationProcedure.run({ email: emailInput, redirectTo });
      }
      router.refresh();
    },
    onFailure(error: any) {
      toast.error(error.message || 'Failed to update email');
    }
  });

  const needsEmail = !user.email;
  const needsVerification = user.email && !user.emailVerified;
  const isLoading =
    sendVerificationProcedure.isLoading || updateEmailProcedure.isLoading;

  const handleSendVerification = async () => {
    if (user.email) {
      setSentToEmail(user.email);
      sendVerificationProcedure.run({ email: user.email, redirectTo });
    }
  };

  const handleVerifyEmail = async () => {
    if (!verifyEmail) {
      toast.error('Email verification is not required at this time.');
      return;
    }

    if (!emailInput) {
      toast.error('Please enter an email address');
      return;
    }

    // If email is different from current, update it first
    if (emailInput !== user.email) {
      updateEmailProcedure.run({ email: emailInput });
    } else {
      // Same email, just send verification
      sendVerificationProcedure.run({ email: emailInput, redirectTo });
    }
  };

  const handleTryDifferentEmail = () => {
    setEmailSent(false);
    setSentToEmail('');
    setEmailInput('');
    setIsChangingEmail(true);
  };

  const handleChangeEmail = () => {
    setIsChangingEmail(true);
    setEmailInput(user.email || '');
  };

  const handleCancelChangeEmail = () => {
    setIsChangingEmail(false);
    setEmailInput(user.email || '');
  };

  // Show email sent confirmation
  if (emailSent) {
    const content = (
      <div className="space-y-4">
        <div className="text-center">
          <MailCheck className="h-12 w-12 min-w-12 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-semibold mb-2">Check Your Email</h3>
          <p className="text-muted-foreground mb-4">
            We've sent a verification email to:
          </p>
          <p className="font-medium text-foreground mb-4">{sentToEmail}</p>
          <p className="text-sm text-muted-foreground mb-6">
            Click the verification link in the email to complete your email
            verification. The link will expire in 15 minutes.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={handleSendVerification}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Resend Email'}
            </Button>
            <Button
              variant="ghost"
              onClick={handleTryDifferentEmail}
              className="w-full text-sm"
            >
              Use a different email
            </Button>
          </div>
        </div>
      </div>
    );

    if (!showCard) {
      return content;
    }

    return (
      <Card>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  const content = (
    <div className="space-y-2">
      {/* Email Verification Warning */}
      {needsVerification && !isChangingEmail && (
        <Alert variant="destructive">
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
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Verification'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Twitter No Email Warning */}
      {needsEmail && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Email Required</AlertTitle>
          <AlertDescription>{verificationText}</AlertDescription>
        </Alert>
      )}

      {/* Current Email Status - Show when email is verified and not changing */}
      {user.emailVerified && user.email && !isChangingEmail && (
        <div className="w-full flex flex-col sm:flex-row gap-4 sm:gap-2 items-center justify-between p-2 border rounded-lg">
          {/* LEFT: icon + text (this area must be allowed to shrink) */}
          <div className="flex items-center gap-3 min-w-0 w-full sm:flex-1">
            <div className="w-12 h-12 flex-shrink-0 bg-background flex items-center justify-center">
              <Mail className="w-8 h-8 text-foreground" />
            </div>

            {/* text column: must have min-w-0 + flex-1 so it can shrink */}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="font-medium truncate">Email</div>

              <div className="text-sm text-muted-foreground truncate w-full overflow-hidden whitespace-nowrap">
                <span className="hidden sm:inline">Connected • </span>
                <span>{user.email}</span>
              </div>
            </div>
          </div>

          <Button
            variant="destructive"
            size="sm"
            className="w-full sm:w-[125px] flex-shrink-0"
            onClick={handleChangeEmail}
          >
            <UnlinkIcon />
            Change
          </Button>
        </div>
      )}

      {/* Email Address Field - Show when changing email or no email/unverified */}
      {(isChangingEmail || needsEmail || needsVerification) && (
        <div className="space-y-2">
          {!showCard && <Label htmlFor="email">Email Address</Label>}
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="pl-10 pr-10 truncate"
              placeholder="Enter your email address"
            />
            {user.emailVerified && !isChangingEmail && (
              <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(isChangingEmail || needsEmail || needsVerification) && (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              onClick={handleVerifyEmail}
              disabled={isLoading}
              variant="default"
              type="button"
              className="w-full sm:w-fit"
            >
              {isLoading ? (
                <Spinner size="xs" />
              ) : needsEmail ? (
                <PlusIcon />
              ) : (
                <SaveIcon />
              )}

              {isLoading
                ? 'Updating...'
                : needsEmail
                  ? 'Add Email'
                  : 'Update Email'}
            </Button>
            {isChangingEmail && (
              <Button
                onClick={handleCancelChangeEmail}
                variant="outline"
                className="w-full sm:w-fit"
                type="button"
              >
                <XIcon />
                Cancel
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            A verification email will be sent to your new email address.
          </p>
        </div>
      )}
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <SettingsCard title={title} description={description}>
      {content}
    </SettingsCard>
  );
}
