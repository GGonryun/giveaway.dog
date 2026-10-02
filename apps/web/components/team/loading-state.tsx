import { Spinner } from '../ui/spinner';

export const LoadingState: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Spinner size="xl" className="mb-4" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
};
