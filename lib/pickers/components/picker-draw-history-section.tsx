import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { PickerDrawSchema } from '../schemas/draws';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import pluralize from 'pluralize';
import { cn } from '@/lib/utils';
import { PickerDrawHistory } from './picker-draw-history';

export const DrawHistorySection: React.FC<{
  draws: PickerDrawSchema[];
}> = ({ draws }) => {
  const [isOpen, setIsOpen] = useState(false);
  const winners = draws.filter((draw) => draw.result === 'WINNER');
  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 hover:bg-transparent"
            >
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Draw History
                <Badge variant="secondary" className="ml-2">
                  {winners.length} {pluralize('winners', winners.length)}
                </Badge>
              </CardTitle>
              <ChevronDown
                className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 mt-2">
            <PickerDrawHistory draws={draws} showCard={false} />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
