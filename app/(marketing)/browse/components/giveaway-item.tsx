import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Trophy, Users, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface GiveawayItemProps {
  id: string;
  name: string;
  description: string;
  banner?: string;
  endDate: Date;
  prizesCount: number;
  participantsCount: number;
  region?: string;
  status: 'active' | 'ending-soon' | 'new';
  featured?: boolean;
}

const getStatusBadge = (status: GiveawayItemProps['status'], endDate: Date) => {
  const daysLeft = Math.ceil(
    (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 2) {
    return <Badge variant="destructive">Ending Soon</Badge>;
  } else if (status === 'new') {
    return <Badge variant="secondary">New</Badge>;
  } else {
    return <Badge variant="default">{daysLeft} days left</Badge>;
  }
};

export function GiveawayItem({
  name,
  description,
  banner,
  endDate,
  prizesCount,
  participantsCount,
  region,
  status,
  featured = false
}: GiveawayItemProps) {
  return (
    <Card className="overflow-hidden pt-0 flex flex-col h-full">
      <div className="relative overflow-hidden rounded-t-lg">
        {banner && (
          <img
            src={banner}
            alt={name}
            className="w-full h-48 object-cover transition-transform duration-300"
          />
        )}
        <div className="absolute top-3 left-3">
          {getStatusBadge(status, endDate)}
        </div>
        {featured && (
          <Badge className="absolute top-3 right-3 bg-primary">Featured</Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3 flex-1">
        <div>
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{name}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {description}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                Ends {formatDistanceToNow(endDate, { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span>
                {prizesCount} prize
                {prizesCount > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{participantsCount.toLocaleString()}</span>
            </div>
          </div>

          {region && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{region}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button className="w-full" variant="default">
          Join Giveaway
        </Button>
      </CardFooter>
    </Card>
  );
}
