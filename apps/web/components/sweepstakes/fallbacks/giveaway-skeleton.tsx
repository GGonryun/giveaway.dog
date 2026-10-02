'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

export const GiveawayHeaderSkeleton: React.FC = () => {
  return (
    <Card>
      <div className="relative">
        {/* Banner Skeleton */}
        <div className="h-48 sm:h-64 bg-gray-200 rounded-t-lg flex items-center justify-center">
          <div className="text-gray-400 text-sm">Preview Banner</div>
        </div>

        {/* Time Badge */}
        <div className="absolute top-4 right-4">
          <Badge variant="default" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Preview Mode
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Title Skeleton */}
        <Skeleton className="h-8 w-3/4 mb-2" />

        {/* Host Info Skeleton */}
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Stats Skeleton */}
        <div className="flex flex-wrap gap-4 mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
        </div>

        {/* Description Skeleton */}
        <div className="border-t pt-4">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
};

export const TaskListSkeleton: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-2 w-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export const PrizeListSkeleton: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export const GiveawayParticipationSkeleton: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <GiveawayHeaderSkeleton />
      <TaskListSkeleton />
      <PrizeListSkeleton />
    </div>
  );
};
