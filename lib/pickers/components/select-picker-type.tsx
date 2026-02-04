'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { createPicker } from '../procedures/create-picker';
import { useProcedure } from '@/lib/mrpc/hook';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { GemIcon, type LucideIcon } from 'lucide-react';
import { createTwitterPicker } from '@/lib/pickers-v2/twitter-v2/procedures/create-twitter-v2-picker';
import { useActiveTeam } from '@/components/team/use-active-team-page';
import { TeamTier } from '@prisma/client';
import { hasMinimumTeamTier, TEAM_TIER_LABEL } from '@/lib/team/util';
import { cn } from '@/lib/utils';

interface SelectPickerTypeProps {
  slug: string;
}

type PickerTypeId = 'legacy' | 'twitter-v2';

interface PickerTypeConfig {
  id: PickerTypeId;
  title: string;
  description: string;
  features: string[];
  buttonText: string;
  action: typeof createPicker | typeof createTwitterPicker;
  minimumTier: TeamTier;
}

const PICKER_TYPES: PickerTypeConfig[] = [
  {
    id: 'legacy',
    title: '(Legacy) X Picker',
    description:
      'Traditional X (Twitter) picker with full integration support. Requires X API integration.',
    features: [
      'Full X API integration',
      'Advanced filtering options',
      'Multiple action types',
      'Follower verification'
    ],
    minimumTier: TeamTier.FREE,
    buttonText: 'Create Legacy Picker',
    action: createPicker
  },
  {
    id: 'twitter-v2',
    title: 'X Picker',
    description:
      'Modern Twitter picker powered by Twitter 2.0 API. No integration required.',
    features: [
      'No API integration needed',
      'Repost action only',
      'User filtering',
      'Simplified setup'
    ],
    buttonText: 'Create New Picker',
    action: createTwitterPicker,
    minimumTier: TeamTier.PRO
  }
];

export const SelectPickerType: React.FC<SelectPickerTypeProps> = ({ slug }) => {
  const team = useActiveTeam();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<PickerTypeId | null>(null);

  const procedures = {
    legacy: useProcedure({
      action: createPicker,
      onSuccess: (data) => {
        router.push(`/app/${slug}/pickers/twitter/${data.id}/create`);
      }
    }),
    'twitter-v2': useProcedure({
      action: createTwitterPicker,
      onSuccess: (data) => {
        router.push(`/app/${slug}/pickers/x/${data.id}/create`);
      }
    })
  };

  const handleCreate = (type: PickerTypeId) => {
    setSelectedType(type);
    procedures[type].run({ slug });
  };

  const isLoading = Object.values(procedures).some((p) => p.isLoading);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 my-8 sm:my-16">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create a Picker</h1>
          <p className="text-muted-foreground">
            Choose which type of picker you want to create
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {PICKER_TYPES.map((pickerType) => {
            const procedure = procedures[pickerType.id];
            const isCreating =
              selectedType === pickerType.id && procedure.isLoading;
            const hasTier = hasMinimumTeamTier({
              tier: pickerType.minimumTier,
              team
            });

            return (
              <Card
                key={pickerType.id}
                className={cn(
                  'p-6 hover:border-primary transition-colors relative',
                  !hasTier ? 'border border-primary' : ''
                )}
              >
                {!hasTier && (
                  <Badge
                    className="absolute top-4 right-4 flex items-center"
                    variant="default"
                  >
                    <GemIcon />
                    {TEAM_TIER_LABEL[pickerType.minimumTier]}
                  </Badge>
                )}
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                      <SocialXIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">
                      {pickerType.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {pickerType.description}
                    </p>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      {pickerType.features.map((feature) => (
                        <li key={feature}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    className="mt-auto"
                    onClick={() => handleCreate(pickerType.id)}
                    variant={hasTier ? 'outline' : 'default'}
                    disabled={isLoading || !hasTier}
                  >
                    {isCreating ? (
                      <>
                        <Spinner />
                        Creating...
                      </>
                    ) : hasTier ? (
                      pickerType.buttonText
                    ) : (
                      <>
                        <GemIcon />
                        Upgrade to Pro
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => router.push(`/app/${slug}/pickers`)}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
