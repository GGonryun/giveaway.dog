'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { simulateNetworkDelay } from '@/lib/simulate';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  dataType: 'entries' | 'analytics' | 'winners' | 'complete';
  fields: string[];
  estimatedSize: string;
  estimatedTime: string;
}

interface ExportData {
  availableExports: ExportOption[];
  recentExports: {
    id: string;
    name: string;
    format: string;
    createdAt: string;
    status: 'completed' | 'processing' | 'failed';
    fileSize?: string;
    downloadUrl?: string;
    expiresAt: string;
  }[];
  exportSettings: {
    includePersonalData: boolean;
    anonymizeEmails: boolean;
    includeRiskScores: boolean;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

const getSweepstakesExport = async (
  sweepstakesId: string
): Promise<ExportData> => {
  'use cache';
  cacheTag('sweepstakes-export');

  await simulateNetworkDelay();

  // Mock export data for sweepstakes export functionality
  const mockExportData: ExportData = {
    availableExports: [
      {
        id: 'entries-basic-csv',
        name: 'Basic Entries Export (CSV)',
        description: 'Essential entry information in CSV format',
        format: 'csv',
        dataType: 'entries',
        fields: [
          'id',
          'userName',
          'userEmail',
          'entryDate',
          'entryMethod',
          'status'
        ],
        estimatedSize: '850 KB',
        estimatedTime: '15 seconds'
      },
      {
        id: 'entries-detailed-xlsx',
        name: 'Detailed Entries Export (Excel)',
        description: 'Complete entry data with analytics in Excel format',
        format: 'xlsx',
        dataType: 'entries',
        fields: [
          'id',
          'userName',
          'userEmail',
          'entryDate',
          'entryMethod',
          'status',
          'location',
          'qualityScore',
          'riskFactors'
        ],
        estimatedSize: '2.1 MB',
        estimatedTime: '45 seconds'
      },
      {
        id: 'analytics-summary-pdf',
        name: 'Analytics Summary Report (PDF)',
        description: 'Comprehensive analytics report in PDF format',
        format: 'pdf',
        dataType: 'analytics',
        fields: ['overview', 'demographics', 'sources', 'conversion', 'fraud'],
        estimatedSize: '1.5 MB',
        estimatedTime: '30 seconds'
      },
      {
        id: 'winners-complete-xlsx',
        name: 'Winners & Verification (Excel)',
        description: 'Winner information with verification details',
        format: 'xlsx',
        dataType: 'winners',
        fields: [
          'userName',
          'userEmail',
          'selectedAt',
          'prize',
          'status',
          'verificationStatus',
          'shippingInfo'
        ],
        estimatedSize: '125 KB',
        estimatedTime: '10 seconds'
      },
      {
        id: 'complete-data-json',
        name: 'Complete Dataset (JSON)',
        description: 'All sweepstakes data in JSON format for API integration',
        format: 'json',
        dataType: 'complete',
        fields: ['all'],
        estimatedSize: '5.7 MB',
        estimatedTime: '2 minutes'
      }
    ],
    recentExports: [
      {
        id: 'export_sw_001',
        name: 'Basic Entries Export - iPhone Giveaway',
        format: 'CSV',
        createdAt: '2025-01-15T14:30:00Z',
        status: 'completed',
        fileSize: '847 KB',
        downloadUrl: '/exports/sweepstakes-entries-basic-20250115.csv',
        expiresAt: '2025-01-22T14:30:00Z'
      },
      {
        id: 'export_sw_002',
        name: 'Analytics Summary Report',
        format: 'PDF',
        createdAt: '2025-01-14T10:15:00Z',
        status: 'completed',
        fileSize: '1.4 MB',
        downloadUrl: '/exports/sweepstakes-analytics-20250114.pdf',
        expiresAt: '2025-01-21T10:15:00Z'
      },
      {
        id: 'export_sw_003',
        name: 'Detailed Entries Export',
        format: 'Excel',
        createdAt: '2025-01-13T16:45:00Z',
        status: 'processing',
        expiresAt: '2025-01-20T16:45:00Z'
      },
      {
        id: 'export_sw_004',
        name: 'Complete Dataset JSON',
        format: 'JSON',
        createdAt: '2025-01-12T09:20:00Z',
        status: 'failed',
        expiresAt: '2025-01-19T09:20:00Z'
      }
    ],
    exportSettings: {
      includePersonalData: true,
      anonymizeEmails: false,
      includeRiskScores: true,
      dateRange: {
        start: '2025-01-01T00:00:00Z',
        end: '2025-01-15T23:59:59Z'
      }
    }
  };

  return mockExportData;
};

export default getSweepstakesExport;
