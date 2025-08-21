import { Outline } from '@/components/app/outline';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Outline title="Templates" className="space-y-4">
      {children}
    </Outline>
  );
}
