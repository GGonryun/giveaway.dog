import { Typography } from '../ui/typography';

export const MarketingPageHeader: React.FC<{
  title: React.ReactNode;
  description: string;
}> = ({ title, description }) => {
  return (
    <div className="text-center space-y-1">
      <h1 className="text-4xl font-semibold font-outfit tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance mb-4">
        {title}
      </h1>
      <Typography.Paragraph className="text-lg text-muted-foreground max-w-2xl mx-auto">
        {description}
      </Typography.Paragraph>
    </div>
  );
};
