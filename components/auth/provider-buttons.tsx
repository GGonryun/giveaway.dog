import { Button } from '@/components/ui/button';
import { ProviderIcon } from '@/components/ui/patterns/provider-icon';

interface ProviderButtonsProps {
  mode: 'login' | 'signup';
  onSubmit?: (provider: string) => void;
}

export function ProviderButtons({ mode, onSubmit }: ProviderButtonsProps) {
  const actionText = mode === 'login' ? 'Login' : 'Sign up';

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="submit"
        variant="outline"
        name="provider"
        value="twitter"
        formNoValidate
        className="w-full justify-start"
        onClick={() => onSubmit?.('twitter')}
      >
        <ProviderIcon type="twitter" className="mr-2 h-4 w-4" />
        {actionText} with X
      </Button>
      <Button
        type="submit"
        variant="outline"
        name="provider"
        value="google"
        formNoValidate
        className="w-full justify-start"
        onClick={() => onSubmit?.('google')}
      >
        <ProviderIcon type="google" className="mr-2 h-4 w-4" />
        {actionText} with Google
      </Button>
      <Button
        type="submit"
        variant="outline"
        name="provider"
        value="discord"
        formNoValidate
        className="w-full justify-start"
        onClick={() => onSubmit?.('discord')}
      >
        <ProviderIcon type="discord" className="mr-2 h-4 w-4" />
        {actionText} with Discord
      </Button>
    </div>
  );
}
