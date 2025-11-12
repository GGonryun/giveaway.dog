import { LucideIcon } from 'lucide-react';
import { Typography } from '../ui/typography';

export const MarketingPageHeader: React.FC<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = ({ title, description, icon: Icon }) => {
  return (
    <div className="text-center space-y-1">
      <div className="flex items-center justify-center gap-2">
        <Icon className="h-12 w-12 text-primary" />
        <Typography.Header level={1} className="text-4xl font-bold lg:text-6xl">
          {title}
        </Typography.Header>
      </div>
      <Typography className="text-muted-foreground text-base md:text-lg">
        {description}
      </Typography>
    </div>
  );
};
