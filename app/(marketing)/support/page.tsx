import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageCircle, CheckCircle, Activity } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="container py-8 md:py-16">
      {/* Status Badge */}
      <div className="flex justify-center mb-6">
        <Link href="/status">
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20"
          >
            <CheckCircle className="h-3 w-3 mr-2" />
            All Systems Operational
          </Badge>
        </Link>
      </div>

      <div className="text-center mb-8 md:mb-12">
        <Typography.Header
          level={1}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
        >
          Support & Help
        </Typography.Header>
        <Typography.Paragraph className="text-lg text-muted-foreground">
          We're here to help! Get support through Discord or email.
        </Typography.Paragraph>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
                  href="https://discord.gg/giveawaydog"
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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Typography.Header
              level={3}
              className="text-xl font-semibold text-center mb-3"
            >
              System Status
            </Typography.Header>
            <Typography.Paragraph className="text-center text-muted-foreground mb-4">
              Check real-time status of all services and infrastructure.
            </Typography.Paragraph>
            <div className="text-center">
              <Button variant="outline" asChild>
                <Link href="/status">View Status</Link>
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
          Before reaching out, you might find answers to common questions in our
          Discord community or by checking our other help resources.
        </Typography.Paragraph>
      </div>
    </div>
  );
}
