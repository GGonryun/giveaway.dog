'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProcedure } from '@/lib/mrpc/hook';
import inviteMembers from '@/procedures/teams/invite-members';
import { toast } from 'sonner';
import { Plus, Trash2, Link2, ExternalLink } from 'lucide-react';
import { InviteLinkModal } from './invite-link-modal';
import { TeamRole } from '@prisma/client';
import z from 'zod';
import Link from 'next/link';

const inviteFormSchema = z.object({
  invitations: z.array(
    z.object({
      email: z.string().email('Invalid email address'),
      role: z.nativeEnum(TeamRole)
    })
  )
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

interface InviteFormCardProps {
  slug: string;
  onInvitesSent: () => void;
}

export const InviteFormCard: React.FC<InviteFormCardProps> = ({
  slug,
  onInvitesSent
}) => {
  const [showInviteLink, setShowInviteLink] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      invitations: [{ email: '', role: TeamRole.MEMBER }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'invitations'
  });

  const { isLoading, run: sendInvites } = useProcedure({
    action: inviteMembers,
    onSuccess(data) {
      if (data.invited.length > 0) {
        toast.success(
          `Invited ${data.invited.length} member${data.invited.length > 1 ? 's' : ''} successfully`
        );
      }
      if (data.skipped.length > 0) {
        data.skipped.forEach((skip) => {
          toast.warning(`${skip.email}: ${skip.reason}`);
        });
      }
      form.reset();
      onInvitesSent();
    },
    onFailure(error) {
      toast.error(error.message);
    }
  });

  const onSubmit = (values: InviteFormValues) => {
    sendInvites({ slug, invitations: values.invitations });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Invite Team Members</CardTitle>
              <CardDescription>
                Invite people by email or share an invite link
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowInviteLink(true)}
              className="w-full sm:w-auto"
            >
              <Link2 className="mr-2 h-4 w-4" />
              Invite Link
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-start"
                >
                  <FormField
                    control={form.control}
                    name={`invitations.${index}.email`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="email@example.com"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`invitations.${index}.role`}
                    render={({ field }) => (
                      <FormItem className="w-full sm:w-32">
                        <FormLabel className="text-xs">Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={TeamRole.GUEST}>
                              Guest
                            </SelectItem>
                            <SelectItem value={TeamRole.MEMBER}>
                              Member
                            </SelectItem>
                            <SelectItem value={TeamRole.ADMIN}>
                              Admin
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="mt-auto mb-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ email: '', role: TeamRole.MEMBER })}
                  className="w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Member
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:ml-auto sm:w-auto"
                >
                  {isLoading ? 'Sending...' : 'Send Invitations'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="mt-2 border-t bg-muted/50 text-sm text-muted-foreground">
          <Link href="/support" className="flex items-center hover:underline">
            Learn more about Team Members
            <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </CardFooter>
      </Card>

      <InviteLinkModal open={showInviteLink} onOpenChange={setShowInviteLink} />
    </>
  );
};
