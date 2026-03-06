import { Spinner } from '@/components/ui/spinner';

interface LoadingStateProps {
  text?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  text = 'Loading...'
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
};
