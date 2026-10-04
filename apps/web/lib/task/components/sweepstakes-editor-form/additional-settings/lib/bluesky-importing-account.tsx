import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import { SwitchFormHeader } from '@/components/patterns/form-layout/switch-form-header';
import { useUnifiedFormLayout } from '@/components/patterns/form-layout/use-unified-form-layout';
import { SweepstakeStep } from '@/components/sweepstakes-editor/data/steps';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormControl } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { SocialBlueskyIcon } from '@/lib/integrations/components/icons/bluesky-icon';
import { hasFeature, type IntegrationSchema } from '@/lib/integrations/schemas';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFormContext } from 'react-hook-form';

function getBlueskyIntegrationsWithFullAccess(
  integrations: IntegrationSchema[] | undefined
): IntegrationSchema[] {
  return (
    integrations?.filter((i) => {
      if (i.provider !== 'BLUESKY' || i.status !== 'ACTIVE') return false;
      return hasFeature(i as typeof i & { provider: 'BLUESKY' }, 'FULL_ACCESS');
    }) || []
  );
}

function hasBlueskyWithoutFullAccess(
  integrations: IntegrationSchema[] | undefined
): boolean {
  return (
    integrations?.some((i) => {
      if (i.provider !== 'BLUESKY' || i.status !== 'ACTIVE') return false;
      return !hasFeature({ ...i, provider: 'BLUESKY' }, 'FULL_ACCESS');
    }) || false
  );
}

export const BlueskyImportingAccountField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  const params = useParams();

  const slug = params.slug as string;
  const { integrations } = useUnifiedFormLayout<SweepstakeStep>();

  const blueskyIntegrations =
    getBlueskyIntegrationsWithFullAccess(integrations);
  const hasBlueskyButNoPermission = hasBlueskyWithoutFullAccess(integrations);

  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.importingAccount`}
      render={({ field }) => (
        <FormItem>
          <SwitchFormHeader
            className="mb-1"
            label="Integration"
            help={{
              title: 'Help: Integration',
              content: (
                <p>
                  Specify the Bluesky account that will be used to import
                  entries. This account must own the post being validated.
                </p>
              )
            }}
          />
          {blueskyIntegrations.length === 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex flex-col gap-2">
                <p>
                  {hasBlueskyButNoPermission
                    ? 'Your Bluesky integration doesn\'t have import permissions. Please add the "Import Tasks" permission.'
                    : 'No Bluesky integrations found. You need to connect a Bluesky account to use import tasks.'}
                </p>
                <Button asChild variant="outline" size="sm" className="w-fit">
                  <Link href={`/app/${slug}/settings/integrations`}>
                    <SocialBlueskyIcon className="h-4 w-4 mr-2" />
                    {hasBlueskyButNoPermission
                      ? 'Add Permissions'
                      : 'Connect Bluesky'}
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <FormControl>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your account" />
                </SelectTrigger>
                <SelectContent>
                  {blueskyIntegrations.map((integration) => (
                    <SelectItem key={integration.id} value={integration.id}>
                      <div className="flex items-center gap-2">
                        <SocialBlueskyIcon className="h-4 w-4" />
                        {integration.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          )}
        </FormItem>
      )}
    />
  );
};
