'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';

const RollingDigit = ({ digit }: { digit: number }) => {
  return (
    <div
      className="relative inline-block w-[0.65em] overflow-hidden align-middle"
      style={{ height: '1em' }}
    >
      <div
        className="transition-transform duration-150"
        style={{
          transform: `translateY(-${digit}em)`,
          transitionTimingFunction: 'cubic-bezier(0.83, 0, 0.17, 1)'
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <div
            key={num}
            style={{ height: '1em', lineHeight: '1em' }}
            className="flex items-center justify-center"
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  );
};

const AnimatedNumber = ({ value }: { value: number }) => {
  const formattedValue = value.toLocaleString('en-US');
  const chars = formattedValue.split('');

  return (
    <div className="inline-flex items-center">
      {chars.map((char, index) => {
        if (char === ',') {
          return (
            <span key={`comma-${index}`} className="opacity-60 mx-[0.1em]">
              ,
            </span>
          );
        }
        return <RollingDigit key={index} digit={parseInt(char)} />;
      })}
    </div>
  );
};

const TickingCounter = ({
  startValue,
  interval
}: {
  startValue: number;
  interval?: number;
}) => {
  const [count, setCount] = useState(startValue);

  useEffect(() => {
    if (!interval) {
      // Random interval between 300-3000ms (original behavior)
      let timeout: NodeJS.Timeout;

      const tick = () => {
        setCount((prev) => prev + 1);
        const randomDelay = Math.random() * (3000 - 300) + 300;
        timeout = setTimeout(tick, randomDelay);
      };

      const initialDelay = Math.random() * (3000 - 300) + 300;
      timeout = setTimeout(tick, initialDelay);

      return () => clearTimeout(timeout);
    } else {
      // Fixed interval
      const intervalId = setInterval(() => {
        setCount((prev) => prev + 1);
      }, interval);

      return () => clearInterval(intervalId);
    }
  }, [interval]);

  return <AnimatedNumber value={count} />;
};

export const UsageSection = () => {
  return (
    <section>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Unique Participants - updates every 30 seconds */}
          <Card className="bg-background border-2">
            <CardContent className="p-8 text-center">
              <div className="text-5xl font-bold mb-3 text-foreground tabular-nums">
                <TickingCounter startValue={12719} interval={30000} />
              </div>
              <div className="text-sm uppercase tracking-wide text-muted-foreground font-medium">
                Unique participants
              </div>
            </CardContent>
          </Card>

          {/* Tasks Completed - random interval 300-3000ms */}
          <Card className="bg-background border-2">
            <CardContent className="p-8 text-center">
              <div className="text-5xl font-bold mb-3 text-foreground tabular-nums">
                <TickingCounter startValue={931828} />
              </div>
              <div className="text-sm uppercase tracking-wide text-muted-foreground font-medium">
                Tasks completed
              </div>
            </CardContent>
          </Card>

          {/* Prizes Given - updates every 60 seconds */}
          <Card className="bg-background border-2">
            <CardContent className="p-8 text-center">
              <div className="text-5xl font-bold mb-3 text-foreground tabular-nums">
                <TickingCounter startValue={571} interval={60000} />
              </div>
              <div className="text-sm uppercase tracking-wide text-muted-foreground font-medium">
                Prizes given away
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
