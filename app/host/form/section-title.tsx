import { Typography } from '@/components/ui/typography';

export const SectionTitle: React.FC<{ label: string; description: string }> = ({
  label,
  description
}) => {
  return (
    <div className="space-y-0">
      <Typography.H2>{label}</Typography.H2>
      <Typography.Paragraph color="muted">{description}</Typography.Paragraph>
    </div>
  );
};
