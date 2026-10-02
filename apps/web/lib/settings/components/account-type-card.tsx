'use client';

import { SettingsCard } from '@/components/settings/settings-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ACCOUNT_TYPE_OPTIONS } from '@/schemas/onboarding';
import { UserAccountType } from '@prisma/client';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useProcedure } from '@/lib/mrpc/hook';
import updateAccountType from '@/procedures/user/update-account-type';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export const AccountTypeCard: React.FC = () => {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const currentAccountType =
    session?.user?.accountType || UserAccountType.PARTICIPANT;

  const procedure = useProcedure({
    action: updateAccountType,
    onSuccess: async (data) => {
      toast.success('Account type updated successfully');
      // Pass data to trigger JWT refresh
      await update({
        accountType: data.accountType
      });
      setOpen(false);
      router.refresh();
    },
    onFailure(error) {
      toast.error(error.message);
    }
  });

  const handleUpdateAccountType = () => {
    procedure.run({ accountType: UserAccountType.HOST });
  };

  const config = ACCOUNT_TYPE_OPTIONS[currentAccountType];
  const isParticipant = currentAccountType === UserAccountType.PARTICIPANT;

  return (
    <SettingsCard
      title="Account Type"
      description="Manage how you use Giveaway.dog"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-3xl">{config.emoji}</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{config.title}</h3>
                <Badge variant="outline">{currentAccountType}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>
          </div>
        </div>

        {isParticipant && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Want to host your own giveaways? Upgrade your account to a Host
              account to create and manage giveaways for your community.
            </AlertDescription>
          </Alert>
        )}

        {isParticipant && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                Upgrade to Host Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upgrade to Host Account</DialogTitle>
                <DialogDescription>
                  Switching to a Host account will allow you to create and
                  manage giveaways for your community, brand, or organization.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">What you'll get:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                    <li>Create unlimited giveaways</li>
                    <li>Manage teams and collaborators</li>
                    <li>Access advanced analytics</li>
                    <li>Customize giveaway designs</li>
                    <li>Integration with social platforms</li>
                  </ul>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You can always participate in giveaways as a Host account.
                    This change can be made at any time.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateAccountType}
                  disabled={procedure.isLoading}
                >
                  {procedure.isLoading ? 'Upgrading...' : 'Upgrade Account'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </SettingsCard>
  );
};
