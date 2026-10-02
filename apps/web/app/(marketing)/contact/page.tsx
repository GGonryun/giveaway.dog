import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { DISCORD_INVITE_LINK } from '@/lib/settings';
import type { Metadata } from 'next';
import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';

export const metadata: Metadata = {
  title: 'Support & Help Center | Giveaway.dog',
  description:
    'Get help with Giveaway.dog. Join our Discord community for real-time support or contact us via email. We are here to assist you with any questions.',
  openGraph: {
    title: 'Support & Help Center | Giveaway.dog',
    description:
      'Get help with Giveaway.dog. Join our Discord community for real-time support or contact us via email. We are here to assist you with any questions.',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Support & Help Center | Giveaway.dog',
    description:
      'Get help with Giveaway.dog. Join our Discord community for real-time support or contact us via email. We are here to assist you with any questions.'
  }
};

export default function SupportPage() {
  return (
    <div className="container py-8 md:py-16 flex flex-col items-center justify-center">
      <div className="text-center mb-8 md:mb-12">
        <MarketingPageHeader
          title="Support & Help"
          description="Get assistance with your account and technical issues"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Typography.Header
              level={3}
              className="text-xl font-semibold text-center mb-3"
            >
              Discord Community
            </Typography.Header>
            <Typography.Paragraph className="text-center text-muted-foreground mb-4">
              Join our Discord server for real-time support from admins and
              connect with other users.
            </Typography.Paragraph>
            <div className="text-center">
              <Button asChild>
                <a
                  href={DISCORD_INVITE_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join Discord
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Mail className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <Typography.Header
              level={3}
              className="text-xl font-semibold text-center mb-3"
            >
              Email Support
            </Typography.Header>
            <Typography.Paragraph className="text-center text-muted-foreground mb-4">
              Send us an email and we'll try to respond within 48 hours.
            </Typography.Paragraph>
            <div className="text-center">
              <Button variant="outline" asChild>
                <a href="mailto:support@giveaway.dog">Send Email</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <Typography.Header level={2} className="text-2xl font-semibold mb-4">
          Common Questions
        </Typography.Header>
        <Typography.Paragraph className="text-muted-foreground mb-6">
          Before reaching out, you might find answers to common questions in our{' '}
          <Link href={DISCORD_INVITE_LINK} className="text-primary underline">
            Discord community
          </Link>{' '}
          or by checking our other help resources.
        </Typography.Paragraph>
      </div>
    </div>
  );
}
