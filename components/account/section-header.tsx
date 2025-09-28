import { CardDescription, CardHeader, CardTitle } from '../ui/card';

export const SectionHeader: React.FC<{
  title: string;
  description: string;
  loading?: boolean;
}> = ({ title, description, loading }) => {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {loading && <SavingText />}
      </div>
    </CardHeader>
  );
};
const SavingText = () => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
    Saving...
  </div>
);
