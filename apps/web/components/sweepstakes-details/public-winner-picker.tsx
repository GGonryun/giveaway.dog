'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicWinnerPickerProps {
  totalParticipants: number;
  numberOfWinners: number;
  onClose: () => void;
  onComplete: () => void;
}

interface CardData {
  id: number;
  isWinner: boolean;
  revealed: boolean;
}

export const PublicWinnerPicker: React.FC<PublicWinnerPickerProps> = ({
  totalParticipants,
  numberOfWinners,
  onClose,
  onComplete
}) => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  // Initialize cards
  useEffect(() => {
    // Use at least the number of winners, or total participants if higher
    const cardCount = Math.max(totalParticipants, numberOfWinners, 8);
    const initialCards: CardData[] = Array.from(
      { length: cardCount },
      (_, i) => ({
        id: i,
        isWinner: i < numberOfWinners,
        revealed: false
      })
    );
    setCards(initialCards);
  }, [totalParticipants, numberOfWinners]);

  const shuffleCards = () => {
    setIsShuffling(true);

    // Shuffle animation
    const shuffleInterval = setInterval(() => {
      setCards((prev) => {
        const newCards = [...prev];
        for (let i = newCards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
        }
        return newCards;
      });
    }, 100);

    // Stop shuffling after 3 seconds
    setTimeout(() => {
      clearInterval(shuffleInterval);
      setIsShuffling(false);
    }, 3000);
  };

  const revealWinners = async () => {
    setIsRevealing(true);

    // Reveal winners one by one from the top
    for (let i = 0; i < numberOfWinners; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));

      setCards((prev) =>
        prev.map((card, index) =>
          index === i ? { ...card, revealed: true } : card
        )
      );

      setRevealedCount(i + 1);

      // Small confetti burst for each winner
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }

    // Final celebration
    setTimeout(() => {
      setShowCelebration(true);
      // Big confetti burst
      const duration = 3000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();

      // Call onComplete after celebration
      setTimeout(() => {
        onComplete();
      }, duration);
    }, 1000);
  };

  const handleStart = () => {
    shuffleCards();
    setTimeout(() => {
      revealWinners();
    }, 3200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-12 right-0 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="bg-background rounded-lg p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Winner Selection</h2>
            <p className="text-muted-foreground">
              {showCelebration
                ? `Congratulations to all ${numberOfWinners} ${numberOfWinners === 1 ? 'winner' : 'winners'}!`
                : isRevealing
                  ? `Revealing winner ${revealedCount} of ${numberOfWinners}...`
                  : isShuffling
                    ? 'Shuffling participants...'
                    : `Ready to pick ${numberOfWinners} ${numberOfWinners === 1 ? 'winner' : 'winners'} from ${totalParticipants} ${totalParticipants === 1 ? 'participant' : 'participants'}`}
            </p>
          </div>

          {/* Cards Grid */}
          <div className="min-h-[400px] flex items-center justify-center">
            {cards.length === 0 ? (
              <div className="text-center text-muted-foreground">
                Preparing cards...
              </div>
            ) : (
              <div className="relative w-full max-w-4xl">
                <div className="grid grid-cols-8 gap-2 perspective-1000">
                  {cards.slice(0, 32).map((card, index) => (
                    <motion.div
                      key={card.id}
                      className="relative aspect-[2/3]"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        scale:
                          index < numberOfWinners && card.revealed ? 1.1 : 1,
                        rotateY: isShuffling ? [0, 360] : 0,
                        z: index < numberOfWinners && card.revealed ? 50 : 0
                      }}
                      transition={{
                        duration: isShuffling ? 0.1 : 0.5,
                        rotateY: {
                          repeat: isShuffling ? Infinity : 0,
                          duration: 0.3
                        }
                      }}
                    >
                      <Card
                        className={cn(
                          'w-full h-full flex items-center justify-center transition-all duration-300',
                          'border-2',
                          index < numberOfWinners && card.revealed
                            ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 border-yellow-300 shadow-2xl shadow-yellow-500/50'
                            : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400'
                        )}
                      >
                        {index < numberOfWinners && card.revealed ? (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              type: 'spring',
                              stiffness: 260,
                              damping: 20
                            }}
                          >
                            <Trophy className="h-8 w-8 text-white drop-shadow-lg" />
                          </motion.div>
                        ) : (
                          <div className="text-2xl font-bold text-white opacity-50">
                            ?
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Show count if more participants than displayed cards */}
                {cards.length > 32 && (
                  <div className="text-center mt-4 text-sm text-muted-foreground">
                    Showing {Math.min(32, cards.length)} of {cards.length} cards
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            {!isShuffling && !isRevealing && !showCelebration && (
              <>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleStart}
                  size="lg"
                  disabled={cards.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Trophy className="h-5 w-5 mr-2" />
                  Start Draw
                </Button>
              </>
            )}

            {showCelebration && (
              <Button onClick={onClose} size="lg">
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
