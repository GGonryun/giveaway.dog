'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Maximize2, Minimize2 } from 'lucide-react';
import { PrizeWheel } from '@/components/picker/prize-wheel';

interface NamePickerWheelProps {
  names: string[];
  isSpinning: boolean;
  onSpinComplete: (winner: string) => void;
  onSpin?: () => void;
  onReset?: () => void;
  hasWinner?: boolean;
}

export function NamePickerWheel({
  names,
  isSpinning,
  onSpinComplete,
  onSpin,
  onReset,
  hasWinner
}: NamePickerWheelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (isFullscreen && names.length > 0) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex justify-between items-center p-4">
          <div className="flex gap-2">
            {onSpin && (
              <Button
                onClick={onSpin}
                disabled={isSpinning || names.length < 2}
                size="lg"
              >
                {isSpinning ? 'Spinning...' : 'Spin the Wheel'}
              </Button>
            )}
            {onReset && hasWinner && (
              <Button variant="outline" onClick={onReset} size="lg">
                Reset
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(false)}
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Exit Fullscreen
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <PrizeWheel
            names={names}
            onSpinComplete={onSpinComplete}
            isSpinning={isSpinning}
            fullscreen={true}
          />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent>
        {names.length === 0 ? (
          <div className="flex items-center justify-center h-[500px] text-center p-8">
            <div>
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Enter names to see the wheel
              </p>
              <p className="text-sm text-muted-foreground">
                Add at least 2 names and click &quot;Load Names&quot;
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-0 right-0 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(true)}
                disabled={isSpinning}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Fullscreen
              </Button>
            </div>
            <PrizeWheel
              names={names}
              onSpinComplete={onSpinComplete}
              isSpinning={isSpinning}
              fullscreen={false}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
