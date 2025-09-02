'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const ParticipationPageCTAs = () => {
  return (
    <Card className="w-full bg-gradient-to-r from-blue-50 to-purple-50">
      <CardContent className="p-6 text-center space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Discover More Opportunities
          </h3>
          <p className="text-gray-600 text-sm">
            Don't miss out on other amazing giveaways and opportunities
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="flex-1 sm:flex-none">
            <Link href="/browse">🎯 Browse More</Link>
          </Button>

          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link href="/signup?userType=host">🚀 Create Your Own</Link>
          </Button>

          <Button asChild variant="secondary" className="flex-1 sm:flex-none">
            <Link href="/newsletter">📧 Get Updates</Link>
          </Button>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Join thousands of users discovering amazing prizes daily
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
