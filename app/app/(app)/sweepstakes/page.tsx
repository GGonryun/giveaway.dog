'use client';

import { SweepstakesOverviewKPIs } from './components/sweepstakes-overview-kpis';
import { SweepstakesMobileKPIs } from './components/sweepstakes-mobile-kpis';
import { SweepstakesFilterBar } from './components/sweepstakes-simple-filter-bar';
import { SweepstakesTable } from './components/sweepstakes-table';
import { useState } from 'react';

// Mock data for sweepstakes overview
const mockOverviewKPIs = {
  totalSweepstakes: 8,
  totalSweepstakesChange: 14.3,
  activeSweepstakes: 5,
  activeSweepstakesChange: 25.0,
  totalEntries: 15420,
  totalEntriesChange: 18.7,
  avgConversionRate: 7.8,
  avgConversionRateChange: -2.1
};

// Mock data for sweepstakes table

const mockSweepstakesData = [
  {
    id: '1',
    title: 'iPhone 15 Pro Max Giveaway',
    status: 'active' as const,
    entries: 5432,
    uniqueEntrants: 4789,
    conversionRate: 7.8,
    botRate: 8.2,
    timeLeft: '5 days 12 hours',
    createdAt: '2025-01-01',
    topSource: 'Instagram',
    prize: '$1,200 iPhone 15 Pro Max'
  },
  {
    id: '2',
    title: 'Gaming Setup Bundle Contest',
    status: 'ending-soon' as const,
    entries: 2890,
    uniqueEntrants: 2456,
    conversionRate: 6.4,
    botRate: 15.3,
    timeLeft: '2 hours 45 minutes',
    createdAt: '2025-01-15',
    topSource: 'Twitter/X',
    prize: '$2,500 Gaming Setup'
  },
  {
    id: '3',
    title: '$500 Amazon Gift Card Sweepstakes',
    status: 'active' as const,
    entries: 1234,
    uniqueEntrants: 1089,
    conversionRate: 9.1,
    botRate: 4.7,
    timeLeft: '12 days 6 hours',
    createdAt: '2025-01-20',
    topSource: 'Direct',
    prize: '$500 Amazon Gift Card'
  },
  {
    id: '4',
    title: 'Tesla Model Y Sweepstakes',
    status: 'draft' as const,
    entries: 0,
    uniqueEntrants: 0,
    conversionRate: 0,
    botRate: 0,
    timeLeft: 'Not started',
    createdAt: '2025-01-25',
    topSource: 'None',
    prize: '$60,000 Tesla Model Y'
  },
  {
    id: '5',
    title: 'MacBook Pro Giveaway',
    status: 'completed' as const,
    entries: 8765,
    uniqueEntrants: 7234,
    conversionRate: 8.9,
    botRate: 6.1,
    timeLeft: 'Ended',
    createdAt: '2024-12-01',
    topSource: 'Instagram',
    prize: '$2,500 MacBook Pro'
  }
];

export default function SweepstakesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter and paginate data
  const filteredData = mockSweepstakesData.filter((sweepstakes) => {
    const matchesSearch =
      sweepstakes.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sweepstakes.prize.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || sweepstakes.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Desktop Analytics */}
      <div className="hidden md:block">
        <SweepstakesOverviewKPIs data={mockOverviewKPIs} />
      </div>

      {/* Mobile Analytics */}
      <div className="md:hidden">
        <SweepstakesMobileKPIs data={mockOverviewKPIs} />
      </div>

      {/* Filter Bar */}
      <SweepstakesFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        totalResults={filteredData.length}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Sweepstakes Table */}
      <SweepstakesTable sweepstakes={paginatedData} />
    </div>
  );
}
