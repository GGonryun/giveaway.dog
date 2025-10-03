import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';
import { useState, useEffect } from 'react';

export const DiceIcon = ({ isRolling }: { isRolling: boolean }) => {
  const [currentDice, setCurrentDice] = useState(0);
  const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setCurrentDice((prev) => (prev + 1) % 6);
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isRolling]);

  const CurrentDiceIcon = diceIcons[currentDice];

  return (
    <CurrentDiceIcon
      className={`h-8 w-8 ${isRolling ? 'animate-spin' : ''} ${isRolling ? 'text-blue-500' : 'text-gray-400'}`}
    />
  );
};
