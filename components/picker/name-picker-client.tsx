'use client';

import { useState, useCallback } from 'react';
import { NamePickerForm } from './name-picker-form';
import { NamePickerWheel } from './name-picker-wheel';
import { NamePickerWinnerModal } from './name-picker-winner-modal';
import confetti from 'canvas-confetti';

interface NamePickerClientProps {
  isAuthenticated: boolean;
}

export function NamePickerClient({ isAuthenticated }: NamePickerClientProps) {
  const [names, setNames] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const handleLoadNames = (nameList: string[]) => {
    setNames(nameList);
    setWinner(null);
  };

  const handleSpin = () => {
    if (names.length < 2) {
      alert('Please load at least 2 names first');
      return;
    }

    setIsSpinning(true);
    setWinner(null);
  };

  const handleSpinComplete = useCallback((winningName: string) => {
    setIsSpinning(false);
    setWinner(winningName);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
    }, 250);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 400);

    setTimeout(() => {
      setShowWinnerModal(true);
    }, 500);
  }, []);

  const handleReset = () => {
    setWinner(null);
    setShowWinnerModal(false);
  };

  const handleSpinAgain = () => {
    setShowWinnerModal(false);
    setWinner(null);
  };

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div className="space-y-6">
          <NamePickerForm
            onLoadNames={handleLoadNames}
            onSpin={handleSpin}
            onReset={handleReset}
            loadedNames={names}
            isSpinning={isSpinning}
            hasWinner={!!winner}
          />
        </div>

        <div>
          <NamePickerWheel
            names={names}
            isSpinning={isSpinning}
            onSpinComplete={handleSpinComplete}
            onSpin={handleSpin}
            onReset={handleReset}
            hasWinner={!!winner}
          />
        </div>
      </div>

      {showWinnerModal && winner && (
        <NamePickerWinnerModal
          winner={winner}
          isAuthenticated={isAuthenticated}
          onClose={() => setShowWinnerModal(false)}
          onSpinAgain={handleSpinAgain}
        />
      )}
    </>
  );
}
