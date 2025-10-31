import { CardDescription, CardHeader, CardTitle } from '../ui/card';

export const AccountSectionHeader: React.FC<{
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
