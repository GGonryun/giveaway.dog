import { Typography } from '@giveaway/ui-primitives/typography';

export const MarketingPageHeader: React.FC<{
  title: React.ReactNode;
  description: string;
  component?: React.ElementType;
}> = ({ title, description, component: Component = 'h1' }) => {
  return (
    <div className="text-center space-y-1">
      <Component className="text-4xl font-semibold font-outfit tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance mb-4">
        {title}
      </Component>
      <Typography.Paragraph className="text-lg text-muted-foreground max-w-2xl mx-auto">
        {description}
      </Typography.Paragraph>
    </div>
  );
};
