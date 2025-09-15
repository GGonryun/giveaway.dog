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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Mail,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  MailCheck
} from 'lucide-react';
import { useProcedure } from '@/lib/mrpc/hook';
import sendEmailVerification from '@/procedures/user/send-email-verification';
import updateEmail from '@/procedures/user/update-email';
import { toast } from 'sonner';
interface UserData {
  email?: string | null;
  emailVerified?: boolean | null;
  providers: string[];
}

interface EmailVerificationProps {
  title?: string;
  description?: string;
  showCard?: boolean;
  onEmailVerified?: () => void;
  user: UserData;
  redirectTo?: string;
}

export function EmailVerification({
  title = 'Email Verification',
  description = 'Manage your email address and verification status',
  showCard = true,
  onEmailVerified,
  user,
  redirectTo
}: EmailVerificationProps) {
  const [emailInput, setEmailInput] = useState(user.email || '');
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  const sendVerificationProcedure = useProcedure({
    action: sendEmailVerification,
    onSuccess() {
      toast.success('Verification email sent successfully');
      setEmailSent(true);
      setSentToEmail(emailInput || user.email || '');
      onEmailVerified?.();
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
    },
    onFailure(error: any) {
      toast.error(error.message || 'Failed to update email');
    }
  });

  const needsEmail = !user.email;
  const needsVerification = user.email && !user.emailVerified;
  const isLoading =
    sendVerificationProcedure.isLoading || updateEmailProcedure.isLoading;

  const handleSaveEmail = async () => {
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

  const handleSendVerification = async () => {
    if (user.email) {
      setSentToEmail(user.email);
      sendVerificationProcedure.run({ email: user.email, redirectTo });
    }
  };

  const handleTryDifferentEmail = () => {
    setEmailSent(false);
    setSentToEmail('');
    setEmailInput('');
  };

  // Show email sent confirmation
  if (emailSent) {
    const content = (
      <div className="space-y-4">
        <div className="text-center">
          <MailCheck className="h-12 w-12 mx-auto mb-4 text-green-500" />
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
    <div className="space-y-4">
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
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Verification'}
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
            Please add and verify an email address to participate in this
            giveaway.
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
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="pl-10 pr-10 truncate"
            placeholder="Enter your email address"
          />
          {user.emailVerified && (
            <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
          )}
        </div>
      </div>

      <Button
        onClick={handleSaveEmail}
        disabled={isLoading}
        className="w-full"
        variant="outline"
      >
        {isLoading ? 'Updating...' : 'Update Email'}
      </Button>
      <p className="text-xs text-muted-foreground">
        A verification email will be sent to your new email address.
      </p>
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
