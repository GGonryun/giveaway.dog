import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowRightIcon } from 'lucide-react';

export const MarketingHeader: React.FC<{
  title: MarketingTitleProps;
  subtitle: MarketingSubtitleProps;
  actions: MarketingActionProps['actions'];
}> = ({ title, subtitle, actions }) => {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <MarketingTitle {...title} />
      <div />
      <MarketingSubtitle {...subtitle} />
      <div className="mt-3 sm:mt-4 md:mt-5 lg:mt-6 mb-0 sm:mb-1 md:mb-2">
        <MarketingActions actions={actions} />
      </div>
    </div>
  );
};

export const GlowingPill: React.FC<{ text?: string }> = ({
  text = 'Unified Sweepstakes Platform'
}) => {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      {text}
    </div>
  );
};

type MarketingTitleProps = {
  text?: string;
  highlight?: string;
};

export const MarketingTitle: React.FC<MarketingTitleProps> = ({
  text = 'How creators build bigger communities',
  highlight = 'bigger communities'
}) => {
  return (
    <h1 className="max-w-2xl font-semibold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter text-foreground text-balance">
      {text.split(highlight)[0]}
      <span className="text-primary">{highlight}</span>
      {text.split(highlight)[1]}
    </h1>
  );
};

type MarketingSubtitleProps = {
  text?: string;
};

export const MarketingSubtitle: React.FC<MarketingSubtitleProps> = ({
  text = 'Host verified giveaways in under 60 seconds that grow your community without bots or spam.'
}) => {
  return (
    <p className="text-muted-foreground text-base sm:text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto text-pretty">
      {text}
    </p>
  );
};

type MarketingAction = {
  label: React.ReactNode;
  href: string;
  variant?: 'outline' | 'default';
};
export type MarketingActionProps = {
  actions: MarketingAction[];
};
export const MarketingActions: React.FC<MarketingActionProps> = ({
  actions
}) => {
  return (
    <div className="flex w-full flex-col justify-center gap-2 sm:flex-row">
      {actions.map((action, index) => (
        <Button
          key={index}
          size="xxl"
          asChild
          variant={action.variant || 'default'}
          className="w-full sm:w-auto"
        >
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ))}
    </div>
  );
};
