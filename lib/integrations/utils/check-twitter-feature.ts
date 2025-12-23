import { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import type { Tx } from '@/lib/prisma';
import type { TwitterFeatureSchema } from '../scopes';
import { hasFeature, type IntegrationSchema } from '../schemas';

export interface CheckTwitterFeatureResult {
  hasFeature: boolean;
  integration: IntegrationSchema | null;
  needsPermission: boolean;
  message?: string;
}

export async function checkTwitterFeature(
  tx: Tx,
  teamId: string,
  feature: TwitterFeatureSchema
): Promise<CheckTwitterFeatureResult> {
  const integration = await tx.integration.findFirst({
    where: {
      teamId,
      provider: IntegrationProvider.TWITTER,
      status: IntegrationStatus.ACTIVE
    },
    select: {
      id: true,
      label: true,
      provider: true,
      status: true,
      scope: true,
      account_id: true
    }
  });

  if (!integration) {
    return {
      hasFeature: false,
      integration: null,
      needsPermission: true,
      message:
        'No Twitter integration found. Please connect your Twitter account.'
    };
  }

  const scopes = integration.scope?.split(' ') || [];
  const integrationSchema: IntegrationSchema = {
    id: integration.id,
    label: integration.label || 'Twitter',
    url: `https://twitter.com/intent/user?user_id=${integration.account_id}`,
    provider: integration.provider,
    status: integration.status,
    scopes
  };

  const hasRequiredFeature = hasFeature(integrationSchema, feature);

  if (!hasRequiredFeature) {
    return {
      hasFeature: false,
      integration: integrationSchema,
      needsPermission: true,
      message: `Your Twitter integration doesn't have permission for ${feature === 'IMPORT_TASKS' ? 'importing tasks' : 'posting tweets'}.`
    };
  }

  return {
    hasFeature: true,
    integration: integrationSchema,
    needsPermission: false
  };
}
