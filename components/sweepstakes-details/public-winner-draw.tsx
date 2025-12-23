'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useProcedure } from '@/lib/mrpc/hook';
import {
  SweepstakesPrizeSchema,
  SweepstakesWinnerCriteriaSchema
} from '@/schemas/giveaway/schemas';
import { SweepstakesParticipantSchema } from '@/lib/participant/schemas';
import { PrizeDrawResult } from '@prisma/client';
import { NavigationHeader } from '@/components/patterns/navigation-header';
import Link from 'next/link';
import { rollPrizes } from '@/lib/winners/procedures/roll-prizes';

interface PublicWinnerDrawProps {
  sweepstakesName: string;
  prizes: SweepstakesPrizeSchema[];
  participants: SweepstakesParticipantSchema[];
  sweepstakesId: string;
  slug: string;
  criteria: SweepstakesWinnerCriteriaSchema;
}

interface PrizeCard {
  prizeId: string;
  prizeName: string;
  slotIndex: number;
  drawId: string | null;
  winnerName: string | null;
  winnerImage: string | null;
  revealed: boolean;
  needsRoll: boolean;
  isLoading: boolean;
}

export const PublicWinnerDraw: React.FC<PublicWinnerDrawProps> = ({
  sweepstakesName,
  prizes,
  participants,
  sweepstakesId,
  slug,
  criteria
}) => {
  const router = useRouter();
  const [prizeCards, setPrizeCards] = useState<PrizeCard[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealingIndices, setRevealingIndices] = useState<Set<number>>(
    new Set()
  );
  const [drawingPrizes, setDrawingPrizes] = useState<Set<string>>(new Set());
  const [shakeButton, setShakeButton] = useState(false);

  const rollPrizesProcedure = useProcedure({
    action: rollPrizes,
    onSuccess: async () => {
      router.refresh();
    }
  });

  // Calculate eligible participants
  const getEligibleParticipants = () => {
    const confirmedWinnerIds = !criteria.allowMultipleWins
      ? prizes
          .flatMap((p) => p.draws)
          .filter((d) => d.result === PrizeDrawResult.WINNER)
          .map((d) => d.participant.id)
      : [];

    return participants.filter((p) => {
      if (p.user.qualityScore < criteria.minQualityScore) return false;
      if (p.completions.length < criteria.minTasksCompleted) return false;
      if (!criteria.allowMultipleWins && confirmedWinnerIds.includes(p.id))
        return false;
      return true;
    });
  };

  const eligibleParticipants = getEligibleParticipants();

  // Initialize prize cards from existing draws
  useEffect(() => {
    const cards: PrizeCard[] = [];
    const newWinners: Array<{
      card: PrizeCard;
      index: number;
    }> = [];

    prizes.forEach((prize) => {
      const winnerDraws = prize.draws.filter(
        (d) => d.result === PrizeDrawResult.WINNER
      );

      const previousWinnerCount = prizeCards.filter(
        (c) => c.prizeId === prize.id && c.revealed
      ).length;

      const previousCard = prizeCards.find(
        (c) => c.prizeId === prize.id && c.isLoading
      );

      // Show already drawn winners
      winnerDraws.forEach((draw, index) => {
        const isNewlyRevealed = index >= previousWinnerCount;

        const card: PrizeCard = {
          prizeId: prize.id,
          prizeName: prize.name,
          slotIndex: index,
          drawId: draw.id,
          winnerName: draw.participant.name,
          winnerImage: draw.participant.image,
          revealed: !isNewlyRevealed, // Don't reveal new winners yet
          needsRoll: false,
          isLoading: isNewlyRevealed && previousCard?.isLoading ? true : false
        };

        cards.push(card);

        if (isNewlyRevealed) {
          newWinners.push({ card, index: cards.length - 1 });
        }
      });

      // Add cards for slots that need winners
      const needsMoreWinners = winnerDraws.length < prize.quota;
      if (needsMoreWinners) {
        const winnersNeeded = prize.quota - winnerDraws.length;
        for (let i = 0; i < winnersNeeded; i++) {
          // Preserve loading state if card was loading
          const wasLoading =
            previousCard?.isLoading &&
            previousCard.slotIndex === winnerDraws.length + i;

          cards.push({
            prizeId: prize.id,
            prizeName: prize.name,
            slotIndex: winnerDraws.length + i,
            drawId: null,
            winnerName: null,
            winnerImage: null,
            revealed: false,
            needsRoll: true,
            isLoading: wasLoading || false
          });
        }
      }
    });

    setPrizeCards(cards);

    // If we have new winners, trigger sequential reveal
    if (newWinners.length > 0 && !isRevealing) {
      revealNewCardsSequentially(newWinners);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prizes]);

  const revealNewCardsSequentially = async (
    newWinners: Array<{ card: PrizeCard; index: number }>
  ) => {
    setIsRevealing(true);

    // Start all card flips with 100ms offset between each
    newWinners.forEach(({ card, index }, i) => {
      setTimeout(() => {
        setRevealingIndices((prev) => new Set(prev).add(index));

        // After the flip animation completes (700ms), reveal the card
        setTimeout(() => {
          setPrizeCards((prev) =>
            prev.map((c, idx) =>
              idx === index ? { ...c, revealed: true, isLoading: false } : c
            )
          );

          // Remove this prize from the drawing set
          setDrawingPrizes((prev) => {
            const next = new Set(prev);
            next.delete(card.prizeId);
            return next;
          });

          // Remove from revealing indices
          setRevealingIndices((prev) => {
            const next = new Set(prev);
            next.delete(index);
            return next;
          });

          // Confetti burst for this winner
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 }
          });
        }, 700);
      }, i * 100);
    });

    // Wait for all animations to complete
    const totalDuration = newWinners.length * 100 + 700 + 150;
    await new Promise((resolve) => setTimeout(resolve, totalDuration));

    setIsRevealing(false);

    // Check if all prizes are revealed and show final confetti
    setPrizeCards((prev) => {
      const allRevealed = prev.every((c) => c.revealed || !c.needsRoll);
      if (allRevealed) {
        // Final confetti celebration for 4 seconds
        const duration = 4000;
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
      }
      return prev;
    });
  };

  const totalPrizesToReveal = prizeCards.filter((c) => c.needsRoll).length;
  const allWinnersDrawn = prizeCards.every((c) => c.revealed || !c.needsRoll);

  const handleDrawAllWinners = () => {
    rollPrizesProcedure.run({
      sweepstakesId,
      slug
    });
  };

  const handleCardClick = (card: PrizeCard) => {
    if (card.revealed || card.isLoading) return;

    // Trigger shake animation on the button to indicate the correct action
    setShakeButton(true);
    setTimeout(() => setShakeButton(false), 500);
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Navigation Header */}
      <NavigationHeader>
        <Link
          href={`/app/${slug}/sweepstakes/${sweepstakesId}/winners`}
          className="flex items-center gap-2"
        >
          <span className="text-lg font-semibold">Random Name Picker</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            router.push(`/app/${slug}/sweepstakes/${sweepstakesId}/winners`)
          }
        >
          <X className="h-5 w-5" />
        </Button>
      </NavigationHeader>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-8 pb-[6rem] sm:pb-[8rem]">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Sweepstakes Info */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {sweepstakesName}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {eligibleParticipants.length} eligible{' '}
              {eligibleParticipants.length === 1
                ? 'participant'
                : 'participants'}
            </p>
          </div>

          {/* Prize Cards Grid */}
          {prizeCards.length === 0 ? (
            <div className="text-center text-muted-foreground text-lg py-12">
              No prizes to reveal...
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {prizeCards.map((prizeCard, index) => (
                <motion.div
                  key={`${prizeCard.prizeId}-${prizeCard.slotIndex}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    scale: revealingIndices.has(index) ? 1.1 : 1,
                    rotateY: revealingIndices.has(index) ? [0, 180, 360] : 0
                  }}
                  transition={{
                    duration: revealingIndices.has(index) ? 0.7 : 0.3,
                    delay: revealingIndices.has(index) ? 0 : index * 0.05,
                    scale: {
                      duration: 0.3
                    },
                    rotateY: {
                      duration: 0.7,
                      ease: 'easeInOut'
                    }
                  }}
                >
                  <Card
                    className={cn(
                      'h-full transition-all duration-300 border-2',
                      prizeCard.revealed
                        ? 'bg-warning text-warning-foreground border-warning shadow-xl'
                        : prizeCard.isLoading ||
                            drawingPrizes.has(prizeCard.prizeId)
                          ? 'bg-info text-info-foreground border-info opacity-75'
                          : 'bg-info text-info-foreground border-info cursor-pointer',
                      revealingIndices.has(index) &&
                        'ring-4 ring-primary ring-offset-2'
                    )}
                    onClick={() => handleCardClick(prizeCard)}
                  >
                    <CardContent className="p-3 sm:p-4 lg:p-6 flex flex-col items-center justify-center min-h-[180px] sm:min-h-[200px] lg:min-h-[240px] space-y-2 sm:space-y-3">
                      {prizeCard.revealed ? (
                        <>
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              type: 'spring',
                              stiffness: 260,
                              damping: 20
                            }}
                          >
                            <Trophy className="h-12 w-12 sm:h-16 sm:w-16 drop-shadow-lg" />
                          </motion.div>

                          <div className="text-center space-y-0.5 sm:space-y-1">
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold line-clamp-1">
                              {prizeCard.winnerName}
                            </h3>
                            <p className="text-xs sm:text-sm opacity-90 font-medium">
                              wins
                            </p>
                            <p className="text-sm sm:text-base lg:text-lg font-semibold line-clamp-2">
                              {prizeCard.prizeName}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-4xl sm:text-5xl lg:text-6xl font-bold opacity-50">
                            ?
                          </div>
                          <p className="text-sm sm:text-base lg:text-lg font-medium opacity-80 text-center line-clamp-2">
                            {prizeCard.prizeName}
                          </p>
                          <p className="text-xs sm:text-sm opacity-60">
                            Winner #{prizeCard.slotIndex + 1}
                          </p>
                          {(prizeCard.isLoading ||
                            drawingPrizes.has(prizeCard.prizeId)) && (
                            <p className="text-xs opacity-50 mt-2 min-h-[16px]">
                              Drawing...
                            </p>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer Button */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-sm p-3 sm:p-4">
        <div className="max-w-6xl mx-auto">
          {!allWinnersDrawn && totalPrizesToReveal > 0 ? (
            <motion.div
              animate={
                shakeButton
                  ? {
                      rotate: [0, -3, 3, -3, 3, 0],
                      scale: [1, 1.05, 1.05, 1.05, 1.05, 1]
                    }
                  : {}
              }
              transition={{ duration: 0.5 }}
            >
              <Button
                onClick={handleDrawAllWinners}
                size="lg"
                disabled={rollPrizesProcedure.isLoading || isRevealing}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 sm:py-6 text-base sm:text-lg font-semibold"
              >
                {rollPrizesProcedure.isLoading || isRevealing ? (
                  'Drawing winners...'
                ) : (
                  <>
                    <Trophy className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                    Draw All Winners
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                router.push(`/app/${slug}/sweepstakes/${sweepstakesId}/winners`)
              }
              className="w-full py-4 sm:py-6 text-base sm:text-lg font-semibold"
            >
              Return to Sweepstakes
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
