'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { Check, Mail } from 'lucide-react';
import { useProcedure } from '@/lib/mrpc/hook';
import subscribeEmail from '@/procedures/marketing/subscribe-email';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  emailSubscriptionSchema,
  type EmailSubscriptionInput
} from '@/schemas/email-subscription';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';

export function SubscriptionCTA() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const form = useForm<EmailSubscriptionInput>({
    resolver: zodResolver(emailSubscriptionSchema),
    mode: 'onChange',
    defaultValues: {
      email: ''
    }
  });

  const procedure = useProcedure({
    action: subscribeEmail,
    onSuccess() {
      setIsSubscribed(true);
      form.reset();
      toast.success('Successfully subscribed!');
    },
    onFailure(data) {
      toast.error(data.message);
    }
  });

  if (isSubscribed) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3 text-center flex-col">
            <div className="flex items-center justify-center w-12 h-12 bg-green-200/50 rounded-full mx-auto">
              <Check className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
            <Typography.Header
              level={3}
              className="text-lg font-semibold text-green-900"
            >
              You're all set!
            </Typography.Header>
            <Typography.Paragraph className="text-green-700">
              We'll notify you about the latest giveaways.
            </Typography.Paragraph>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <Typography.Header
              level={3}
              className="text-2xl md:text-3xl font-semibold"
            >
              Never miss a giveaway!
            </Typography.Header>
            <Typography.Paragraph className="text-muted-foreground">
              Get notified when new exciting giveaways go live. Join thousands
              of winners!
            </Typography.Paragraph>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(procedure.run)}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={procedure.isLoading || !form.formState.isValid}
                className="whitespace-nowrap"
              >
                {procedure.isLoading ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </Form>

          <Typography.Paragraph className="text-xs text-muted-foreground">
            No spam, unsubscribe anytime. We respect your privacy.
          </Typography.Paragraph>
        </div>
      </CardContent>
    </Card>
  );
}
