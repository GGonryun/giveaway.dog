'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Play, RotateCcw } from 'lucide-react';

interface NamePickerFormProps {
  onLoadNames: (names: string[]) => void;
  onSpin: () => void;
  onReset: () => void;
  loadedNames: string[];
  isSpinning: boolean;
  hasWinner: boolean;
}

const NAME_PICKER_NAMES_PLACEHOLDER = `Name 1
Name 2
Name 3
Name 4
...`;

export function NamePickerForm({
  onLoadNames,
  onSpin,
  onReset,
  loadedNames,
  isSpinning,
  hasWinner
}: NamePickerFormProps) {
  const [namesInput, setNamesInput] = useState('');

  const handleLoadNames = () => {
    const nameList = namesInput
      .split('\n')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (nameList.length < 2) {
      alert('Please enter at least 2 names');
      return;
    }

    onLoadNames(nameList);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter Names</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="names">Names (one per line)</Label>
          <Textarea
            id="names"
            placeholder={NAME_PICKER_NAMES_PLACEHOLDER}
            value={namesInput}
            onChange={(e) => setNamesInput(e.target.value)}
            rows={10}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Enter one name per line (minimum 2 names)
          </p>
        </div>

        <Button onClick={handleLoadNames} className="w-full" size="lg">
          Load Names
        </Button>

        {loadedNames.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">
              {loadedNames.length} names loaded
            </p>
            <div className="flex gap-2">
              <Button
                onClick={onSpin}
                disabled={isSpinning}
                className="flex-1"
                size="lg"
              >
                <Play className="mr-2 h-5 w-5" />
                {isSpinning ? 'Spinning...' : 'Spin the Wheel'}
              </Button>
              {hasWinner && (
                <Button onClick={onReset} variant="outline" size="lg">
                  <RotateCcw className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
