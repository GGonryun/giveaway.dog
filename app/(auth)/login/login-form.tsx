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
import { connect } from './actions';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircleIcon, CheckCircle2Icon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const parseError = (error: string | null) => {
  if (!error) return 'An unknown error occurred. Please try again.';

  switch (error) {
    case 'OAuthCallbackError':
      return 'There was an error connecting to your account. Please try again.';
    case 'OAuthAccountNotLinked':
      return 'Another account already exists with the same e-mail address. Please use a different login method or contact support.';
    default:
      return error;
  }
};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const error = searchParams.get('error');
  const verify = searchParams.get('verify');
  const redirectTo = callbackUrl ?? '/';
  const [errorMessage, formAction, isPending] = useActionState(
    connect,
    undefined
  );

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center mb-4">
          <CardTitle className="text-xl">Connect with us</CardTitle>
          <CardDescription>
            Login or sign up with your social account
          </CardDescription>
        </CardHeader>
        {isPending ? (
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
              <form action={formAction}>
                <input type="hidden" name="redirectTo" value={redirectTo} />
                <div className="grid gap-6">
                  <div className="flex flex-col gap-4">
                    <Button
                      variant="outline"
                      name="login"
                      value="twitter"
                      formNoValidate
                      className="w-full"
                    >
                      <svg
                        width="1200"
                        height="1227"
                        viewBox="0 0 1200 1227"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"
                          fill="currentColor"
                        />
                      </svg>
                      Login with X
                    </Button>
                    <Button
                      variant="outline"
                      name="login"
                      value="google"
                      formNoValidate
                      className="w-full"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      Login with Google
                    </Button>
                    <Button
                      variant="outline"
                      name="login"
                      value="discord"
                      formNoValidate
                      className="w-full"
                    >
                      <svg
                        id="Discord-Logo"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 126.644 96"
                      >
                        <path
                          id="Discord-Symbol-Black"
                          d="M81.15,0c-1.2376,2.1973-2.3489,4.4704-3.3591,6.794-9.5975-1.4396-19.3718-1.4396-28.9945,0-.985-2.3236-2.1216-4.5967-3.3591-6.794-9.0166,1.5407-17.8059,4.2431-26.1405,8.0568C2.779,32.5304-1.6914,56.3725.5312,79.8863c9.6732,7.1476,20.5083,12.603,32.0505,16.0884,2.6014-3.4854,4.8998-7.1981,6.8698-11.0623-3.738-1.3891-7.3497-3.1318-10.8098-5.1523.9092-.6567,1.7932-1.3386,2.6519-1.9953,20.281,9.547,43.7696,9.547,64.0758,0,.8587.7072,1.7427,1.3891,2.6519,1.9953-3.4601,2.0457-7.0718,3.7632-10.835,5.1776,1.97,3.8642,4.2683,7.5769,6.8698,11.0623,11.5419-3.4854,22.3769-8.9156,32.0509-16.0631,2.626-27.2771-4.496-50.9172-18.817-71.8548C98.9811,4.2684,90.1918,1.5659,81.1752.0505l-.0252-.0505ZM42.2802,65.4144c-6.2383,0-11.4159-5.6575-11.4159-12.6535s4.9755-12.6788,11.3907-12.6788,11.5169,5.708,11.4159,12.6788c-.101,6.9708-5.026,12.6535-11.3907,12.6535ZM84.3576,65.4144c-6.2637,0-11.3907-5.6575-11.3907-12.6535s4.9755-12.6788,11.3907-12.6788,11.4917,5.708,11.3906,12.6788c-.101,6.9708-5.026,12.6535-11.3906,12.6535Z"
                        />
                      </svg>
                      Login with Discord
                    </Button>
                  </div>
                  <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                      Or continue with
                    </span>
                  </div>
                  <div className="grid gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        name="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                      />
                      <p className="text-xs text-muted-foreground -mt-1">
                        We'll email you a link to sign in. No password needed.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      name="login"
                      value="email"
                      className="w-full"
                    >
                      Login with Email
                    </Button>
                  </div>
                </div>
              </form>
            )}
            {(errorMessage || error) && (
              <div
                className="flex items-start gap-2 mt-4"
                aria-live="polite"
                aria-atomic="true"
              >
                <AlertCircleIcon className="min-h-5 min-w-5 h-5 w-5 text-red-500" />
                <p className="text-sm text-red-500">
                  {parseError(errorMessage || error)}
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our{' '}
        <a href="/terms">Terms of Service</a> and{' '}
        <a href="/privacy">Privacy Policy</a>.
      </div>
    </div>
  );
}
