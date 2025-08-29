'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const LogoutScreen: React.FC<{ onDone: () => Promise<void> }> = ({
  onDone
}) => {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [quip, setQuip] = useState('');

  const quips = [
    'Destroying all traces...',
    'Shredding your digital mail...',
    'Erasing footprints...',
    'Clearing your session...',
    'Powering down your account...',
    'Securing the exits...',
    'Locking the digital doors...'
  ];

  useEffect(() => {
    // Select a random quip
    const randomQuip = quips[Math.floor(Math.random() * quips.length)];
    setQuip(randomQuip);

    // Handle progress bar and redirection
    const startTime = Date.now();
    const duration = 5000; // 5 seconds

    const interval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (elapsed >= duration) {
        clearInterval(interval);
        onDone();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Logging you out
          </h1>
          <p className="text-muted-foreground">{quip}</p>
        </div>

        <div className="w-full space-y-2">
          <Progress value={progress} className="h-2 w-full" />
          <p className="text-xs text-muted-foreground text-right">
            Redirecting in {Math.ceil((3000 - (progress / 100) * 3000) / 1000)}s
          </p>
        </div>
      </div>
    </div>
  );
};
