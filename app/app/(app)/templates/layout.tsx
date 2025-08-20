import React from 'react';
import { Outline } from '../../outline';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Outline title="Templates" className="space-y-4">
      {children}
    </Outline>
  );
}
