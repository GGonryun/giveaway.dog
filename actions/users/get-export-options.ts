'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { simulateNetworkDelay } from '../shared/utils';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  fields: string[];
  estimatedSize: string;
  estimatedTime: string;
}

interface ExportOptionsData {
  availableFormats: ExportOption[];
  recentExports: {
    id: string;
    name: string;
    createdAt: string;
    status: 'completed' | 'processing' | 'failed';
    downloadUrl?: string;
  }[];
  exportLimits: {
    maxRecords: number;
    maxFileSize: string;
    retentionDays: number;
  };
}

const getExportOptions = async (): Promise<ExportOptionsData> => {
  'use cache';
  cacheTag('export-options');

  await simulateNetworkDelay();

  const mockExportOptions: ExportOptionsData = {
    availableFormats: [
      {
        id: 'users-basic-csv',
        name: 'Basic User Export (CSV)',
        description: 'Essential user information in CSV format',
        format: 'csv',
        fields: ['id', 'name', 'email', 'region', 'entries', 'qualityScore'],
        estimatedSize: '2.3 MB',
        estimatedTime: '30 seconds'
      },
      {
        id: 'users-detailed-xlsx',
        name: 'Detailed User Export (Excel)',
        description: 'Complete user data with analytics in Excel format',
        format: 'xlsx',
        fields: [
          'id',
          'name',
          'email',
          'region',
          'entries',
          'qualityScore',
          'engagement',
          'source',
          'tags',
          'lastEntryAt'
        ],
        estimatedSize: '5.7 MB',
        estimatedTime: '2 minutes'
      },
      {
        id: 'users-analytics-json',
        name: 'User Analytics (JSON)',
        description: 'Raw user data with metadata for API integration',
        format: 'json',
        fields: ['all'],
        estimatedSize: '12.1 MB',
        estimatedTime: '5 minutes'
      }
    ],
    recentExports: [
      {
        id: 'export_123',
        name: 'User Export - Basic CSV',
        createdAt: '2025-01-15T10:30:00Z',
        status: 'completed',
        downloadUrl: '/exports/user-export-basic-20250115.csv'
      },
      {
        id: 'export_124',
        name: 'User Export - Detailed Excel',
        createdAt: '2025-01-14T15:45:00Z',
        status: 'processing'
      },
      {
        id: 'export_125',
        name: 'User Analytics JSON',
        createdAt: '2025-01-13T09:20:00Z',
        status: 'failed'
      }
    ],
    exportLimits: {
      maxRecords: 100000,
      maxFileSize: '50 MB',
      retentionDays: 30
    }
  };

  return mockExportOptions;
};

export default getExportOptions;
