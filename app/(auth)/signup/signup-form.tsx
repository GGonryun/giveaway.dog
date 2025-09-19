'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle2Icon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AuthError } from '@/components/auth/auth-error';
import { AuthFooter } from '@/components/auth/auth-footer';
import { EmojiPickerComponent } from '@/components/patterns/emoji-picker';
import { Stepper } from '@/components/ui/stepper';
import { ProviderIcon } from '@/components/ui/patterns/provider-icon';
import login from '@/procedures/auth/login';
import { useProcedure } from '@/lib/mrpc/hook';
import { toast } from 'sonner';

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const verify = searchParams.get('verify');
  const redirectTo = searchParams.get('redirectTo') ?? '';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loginProcedure = useProcedure({
    action: login,
    onSuccess() {
      toast.success('Successfully logged in! Redirecting...');
    },
    onFailure(error) {
      setErrorMessage(error.message);
    }
  });
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    emoji: '🐶',
    userTypes: [] as string[],
    provider: ''
  });

  const handleFormAction = async (data: FormData) => {
    const provider = data.get('provider')?.toString();
    const email = data.get('email')?.toString();
    const redirectTo = data.get('redirectTo')?.toString();
    const signup = data.get('signup')?.toString();
    const name = data.get('name')?.toString();
    const emoji = data.get('emoji')?.toString();
    const userType = data.get('userType')?.toString();

    loginProcedure.run({
      provider,
      email,
      redirectTo,
      signup,
      name,
      emoji,
      userType
    });
  };

  const handleNext = () => {
    if (step === 1 && formData.name.trim()) {
      setStep(2);
    } else if (step === 2 && formData.userTypes.length > 0) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleUserType = (userType: string) => {
    setFormData((prev) => ({
      ...prev,
      userTypes: prev.userTypes.includes(userType)
        ? prev.userTypes.filter((type) => type !== userType)
        : [...prev.userTypes, userType]
    }));
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center mb-4">
          <CardTitle className="text-xl">Join Giveaway Dog</CardTitle>
          <CardDescription>
            Create your account to start hosting or participating in giveaways
          </CardDescription>
          <div className="mt-4">
            <Stepper currentStep={step} totalSteps={3} />
          </div>
        </CardHeader>
        {loginProcedure.isLoading ? (
          <Spinner size="xl" className="mx-auto my-16" />
        ) : (
          <CardContent>
            {verify ? (
              <Alert>
                <CheckCircle2Icon />
                <AlertTitle>Check your email!</AlertTitle>
                <AlertDescription>
                  A verification email has been sent to your email address.
                </AlertDescription>
              </Alert>
            ) : (
              <form action={handleFormAction}>
                <input type="hidden" name="signup" value="true" />
                <input type="hidden" name="redirectTo" value={redirectTo} />
                <input type="hidden" name="name" value={formData.name} />
                <input type="hidden" name="emoji" value={formData.emoji} />
                <input
                  type="hidden"
                  name="userType"
                  value={formData.userTypes.join(',')}
                />

                <div className="grid gap-6">
                  {step === 1 && (
                    <div className="grid gap-4">
                      <div className="grid gap-3">
                        <Label htmlFor="display-name">
                          What should we call you?
                        </Label>
                        <Input
                          id="display-name"
                          type="text"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) =>
                            updateFormData('name', e.target.value)
                          }
                          required
                        />
                        <p className="text-xs text-muted-foreground -mt-1">
                          This won't be public but helps us personalize your
                          experience.
                        </p>
                      </div>

                      <div className="grid gap-3">
                        <EmojiPickerComponent
                          value={formData.emoji}
                          onEmojiSelect={(emoji) =>
                            updateFormData('emoji', emoji)
                          }
                          title="Pick your avatar"
                          description="This will be used as your avatar in the app"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={!formData.name.trim()}
                        className="w-full"
                      >
                        Continue
                      </Button>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="grid gap-4">
                      <div className="grid gap-3">
                        <Label>What would you like to do?</Label>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="host"
                              checked={formData.userTypes.includes('HOST')}
                              onCheckedChange={() => toggleUserType('HOST')}
                            />
                            <Label htmlFor="host" className="cursor-pointer">
                              Host giveaways
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="participate"
                              checked={formData.userTypes.includes(
                                'PARTICIPATE'
                              )}
                              onCheckedChange={() =>
                                toggleUserType('PARTICIPATE')
                              }
                            />
                            <Label
                              htmlFor="participate"
                              className="cursor-pointer"
                            >
                              Participate in giveaways
                            </Label>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Button
                          type="button"
                          onClick={handleNext}
                          disabled={formData.userTypes.length === 0}
                          className="w-full"
                        >
                          Continue
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleBack}
                          className="w-full hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                        >
                          Back
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="grid gap-4">
                      <div className="grid gap-3">
                        <Label>Choose your preferred sign-in method</Label>
                        <div className="flex flex-col gap-3">
                          <Button
                            type="submit"
                            variant="outline"
                            name="provider"
                            value="twitter"
                            className="w-full justify-start"
                          >
                            <ProviderIcon
                              type="twitter"
                              className="mr-2 h-4 w-4"
                            />
                            Sign up with X
                          </Button>
                          <Button
                            type="submit"
                            variant="outline"
                            name="provider"
                            value="google"
                            className="w-full justify-start"
                          >
                            <ProviderIcon
                              type="google"
                              className="mr-2 h-4 w-4"
                            />
                            Sign up with Google
                          </Button>
                          <Button
                            type="submit"
                            variant="outline"
                            name="provider"
                            value="discord"
                            className="w-full justify-start"
                          >
                            <ProviderIcon
                              type="discord"
                              className="mr-2 h-4 w-4"
                            />
                            Sign up with Discord
                          </Button>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        className="w-full hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                      >
                        Back
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            )}
            <AuthError error={errorMessage || error} />
          </CardContent>
        )}
      </Card>
      <AuthFooter />
    </div>
  );
}
