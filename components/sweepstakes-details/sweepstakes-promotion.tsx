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
import { Textarea } from '@/components/ui/textarea';
import {
  Facebook,
  Twitter,
  Instagram,
  Share2,
  Copy,
  ExternalLink,
  QrCode,
  Mail,
  Link,
  CheckCircle,
  SearchIcon
} from 'lucide-react';
import { useState } from 'react';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/schemas/giveaway/defaults';
import { toast } from 'sonner';
import { QRCodeModal } from '@/components/patterns/qr-code-modal';
import { ParticipantSweepstakeSchema } from '@/schemas/giveaway/schemas';
import { useBrowseSweepstakesPage } from '../sweepstakes/use-browse-sweepstakes-page';

export const SweepstakesPromotion: React.FC<ParticipantSweepstakeSchema> = ({
  sweepstakes
}) => {
  const browse = useBrowseSweepstakesPage();
  const liveUrl = browse.url({ sweepstakesId: sweepstakes.id });

  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const buildUtmUrl = () => {
    const url = new URL(liveUrl);
    if (utmSource) url.searchParams.set('utm_source', utmSource);
    if (utmMedium) url.searchParams.set('utm_medium', utmMedium);
    if (utmCampaign) url.searchParams.set('utm_campaign', utmCampaign);
    return url.toString();
  };

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedUrl(type);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast.success('Copied to clipboard');
  };

  const socialPlatforms = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(liveUrl)}`
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'text-sky-500',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(liveUrl)}&text=${encodeURIComponent(`Check out this giveaway: ${sweepstakes?.setup.name ?? DEFAULT_SWEEPSTAKES_NAME}`)}`
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: 'text-pink-500',
      url: `https://www.instagram.com`
    }
  ];

  const quickUrls = [
    { name: 'Email Newsletter', source: 'email', medium: 'newsletter' },
    { name: 'Social Media', source: 'social', medium: 'organic' },
    { name: 'Paid Ads', source: 'ads', medium: 'cpc' },
    { name: 'Influencer', source: 'influencer', medium: 'sponsored' }
  ];

  if (!sweepstakes) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Social Sharing</CardTitle>
          <CardDescription>
            Share your sweepstakes across social media platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {socialPlatforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <Button
                  key={platform.name}
                  variant="outline"
                  asChild
                  className="justify-start"
                >
                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon className={`h-4 w-4 mr-2 ${platform.color}`} />
                    Share on {platform.name}
                  </a>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>UTM Link Builder</CardTitle>
          <CardDescription>
            Create trackable links with UTM parameters for campaign analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="utm-source">Source</Label>
              <Input
                id="utm-source"
                placeholder="e.g., facebook, newsletter"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="utm-medium">Medium</Label>
              <Input
                id="utm-medium"
                placeholder="e.g., social, email, cpc"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="utm-campaign">Campaign</Label>
              <Input
                id="utm-campaign"
                placeholder="e.g., spring-2024"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
              />
            </div>
          </div>

          {/* Quick UTM Templates */}
          <div>
            <Label className="text-sm font-medium">Quick Templates</Label>
            <div className="grid gap-2 mt-2 md:grid-cols-2 lg:grid-cols-4">
              {quickUrls.map((template) => (
                <Button
                  key={template.name}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUtmSource(template.source);
                    setUtmMedium(template.medium);
                    setUtmCampaign(
                      sweepstakes.setup.name.toLowerCase().replace(/\s+/g, '-')
                    );
                  }}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Generated URL */}
          {(utmSource || utmMedium || utmCampaign) && (
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Generated URL</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input value={buildUtmUrl()} readOnly className="text-sm" />
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(buildUtmUrl(), 'utm')}
                >
                  {copiedUrl === 'utm' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Direct Links</CardTitle>
          <CardDescription>
            Copy and share direct links to your sweepstakes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <Label className="text-sm font-medium">Landing Page URL</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input value={liveUrl} readOnly className="text-sm" />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(liveUrl, 'landing')}
              >
                {copiedUrl === 'landing' ? <CheckCircle /> : <Copy />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Template</CardTitle>
          <CardDescription>
            Ready-to-use email template for your campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            readOnly
            rows={8}
            className="text-sm"
            value={`Subject: 🎉 Enter to Win: ${sweepstakes.setup.name}

Hi there!

We're excited to announce our latest giveaway! You have a chance to win ${sweepstakes.setup.name}.
🎁 How to Enter:
1. Click the link below
2. Fill out the simple entry form
3. That's it! You're entered to win

👉 Enter Now: ${liveUrl}

Good luck!

Best regards,
Your Team`}
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                copyToClipboard(
                  `Subject: 🎉 Enter to Win: ${sweepstakes.setup.name}\n\nHi there!\n\nWe're excited to announce our latest giveaway! You have a chance to win ${sweepstakes.setup.name}.\n\n🎁 How to Enter:\n1. Click the link below\n2. Fill out the simple entry form\n3. That's it! You're entered to win\n\n👉 Enter Now: ${liveUrl}\n\nGood luck!\n\nBest regards,\nYour Team`,
                  'email'
                );
              }}
            >
              {copiedUrl === 'email' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Template
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QR Code</CardTitle>
          <CardDescription>
            Generate QR codes for offline promotion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="w-32 h-32 mx-auto bg-muted rounded-lg flex items-center justify-center">
              <QrCode className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Button onClick={() => setIsQRModalOpen(true)}>
                <SearchIcon />
                View QR Code
              </Button>
              <p className="text-xs text-muted-foreground">
                High-resolution PNG format suitable for print
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        value={liveUrl}
        title="Share Sweepstakes QR Code"
        size={256}
      />
    </>
  );
};
