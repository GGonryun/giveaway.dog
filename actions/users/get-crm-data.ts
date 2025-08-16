'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { simulateNetworkDelay } from '../shared/utils';

interface CRMIntegration {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  syncedRecords: number;
  totalRecords: number;
  fieldMappings: {
    source: string;
    target: string;
    required: boolean;
  }[];
}

interface CRMSyncData {
  availableIntegrations: CRMIntegration[];
  syncHistory: {
    id: string;
    timestamp: string;
    records: number;
    status: 'success' | 'failed' | 'partial';
    duration: string;
  }[];
  fieldMappingOptions: {
    sourceFields: string[];
    targetFields: string[];
  };
  syncSettings: {
    autoSync: boolean;
    syncInterval: string;
    conflictResolution: 'overwrite' | 'skip' | 'merge';
  };
}

const getCRMData = async (): Promise<CRMSyncData> => {
  'use cache';
  cacheTag('crm-data');

  await simulateNetworkDelay();

  const mockCRMData: CRMSyncData = {
    availableIntegrations: [
      {
        id: 'salesforce',
        name: 'Salesforce',
        status: 'connected',
        lastSync: '2025-01-15T10:30:00Z',
        syncedRecords: 125847,
        totalRecords: 127459,
        fieldMappings: [
          { source: 'email', target: 'Email__c', required: true },
          { source: 'name', target: 'Name', required: true },
          { source: 'region', target: 'Region__c', required: false },
          {
            source: 'qualityScore',
            target: 'Quality_Score__c',
            required: false
          }
        ]
      },
      {
        id: 'hubspot',
        name: 'HubSpot',
        status: 'disconnected',
        lastSync: '2025-01-10T14:20:00Z',
        syncedRecords: 0,
        totalRecords: 127459,
        fieldMappings: []
      },
      {
        id: 'mailchimp',
        name: 'Mailchimp',
        status: 'error',
        lastSync: '2025-01-14T16:45:00Z',
        syncedRecords: 89234,
        totalRecords: 127459,
        fieldMappings: [
          { source: 'email', target: 'EMAIL', required: true },
          { source: 'name', target: 'FNAME', required: false }
        ]
      }
    ],
    syncHistory: [
      {
        id: 'sync_001',
        timestamp: '2025-01-15T10:30:00Z',
        records: 1612,
        status: 'success',
        duration: '2m 34s'
      },
      {
        id: 'sync_002',
        timestamp: '2025-01-14T10:30:00Z',
        records: 2103,
        status: 'success',
        duration: '3m 12s'
      },
      {
        id: 'sync_003',
        timestamp: '2025-01-13T10:30:00Z',
        records: 892,
        status: 'partial',
        duration: '1m 45s'
      },
      {
        id: 'sync_004',
        timestamp: '2025-01-12T10:30:00Z',
        records: 0,
        status: 'failed',
        duration: '0m 15s'
      }
    ],
    fieldMappingOptions: {
      sourceFields: [
        'id',
        'name',
        'email',
        'region',
        'entries',
        'qualityScore',
        'engagement',
        'source',
        'lastEntryAt',
        'firstEntryAt',
        'tags'
      ],
      targetFields: [
        'Email__c',
        'Name',
        'Region__c',
        'Quality_Score__c',
        'Lead_Source__c',
        'Custom_Field_1__c',
        'Custom_Field_2__c',
        'Tags__c'
      ]
    },
    syncSettings: {
      autoSync: true,
      syncInterval: 'daily',
      conflictResolution: 'merge'
    }
  };

  return mockCRMData;
};

export default getCRMData;
