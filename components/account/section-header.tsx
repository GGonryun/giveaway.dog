import { CardDescription, CardHeader, CardTitle } from '../ui/card';

export const SectionHeader: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => {
  return (
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  );
};
