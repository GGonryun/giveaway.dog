import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@giveaway/ui-primitives/card';
import { Button } from '@giveaway/ui-primitives/button';
import { ShieldCheck, Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function UserVerifyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <MarketingPageHeader
        title="User Verification & Global Ban List"
        description="Learn about our verification process and how we maintain fair giveaways"
      />

      <div className="space-y-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              What is User Verification?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              User verification helps ensure fair and transparent giveaways by
              identifying legitimate participants and filtering out suspicious
              accounts.
            </p>
            <p className="text-muted-foreground">
              When you upgrade to PRO, you unlock advanced verification features
              that give you full visibility into participant details and
              history.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Global Ban List
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our global ban list automatically filters out users who:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Have been flagged for fraudulent activity</li>
              <li>Use automated bot accounts</li>
              <li>Violate platform terms of service</li>
              <li>Engage in spam or manipulation tactics</li>
            </ul>
            <p className="text-muted-foreground">
              This helps maintain the integrity of giveaways and protects hosts
              from bad actors.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Why Can't I See Participant Details?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Free pickers have limited visibility to keep the service
              accessible while encouraging hosts to upgrade for professional
              features.
            </p>
            <p className="text-muted-foreground">Upgrade to PRO to unlock:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Full participant history and details</li>
              <li>Advanced filtering and criteria options</li>
              <li>Multiple posts per giveaway</li>
              <li>Scheduled draws</li>
              <li>Priority support</li>
            </ul>
            <div className="pt-4">
              <Button asChild size="lg">
                <Link href="/pricing">Upgrade to PRO</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>
            Questions?{' '}
            <Link href="/contact" className="underline">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
