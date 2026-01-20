import { useArrayContext } from '@/components/hooks/use-array-context';
import { SwitchFormHeader } from '@/components/patterns/form-layout/switch-form-header';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormField,
  FormItem,
  FormMessage,
  FormLabel
} from '@/components/ui/form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { getDiscordRoles } from '@/lib/discord/procedures/get-discord-roles';

interface Role {
  id: string;
  name: string;
  color: number;
  position: number;
}

export const DiscordRolesField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  const params = useParams();

  const slug = params.slug as string;

  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const importingAccount = useWatch({
    control: form.control,
    name: `tasks.${index}.importingAccount`
  });

  const selectedRoles = useWatch({
    control: form.control,
    name: `tasks.${index}.roles`
  }) || [];

  useEffect(() => {
    async function loadRoles() {
      if (!importingAccount) {
        setRoles([]);
        return;
      }

      setLoadingRoles(true);
      try {
        const result = await getDiscordRoles({
          slug,
          integrationId: importingAccount
        });
        if (result.ok) {
          setRoles(result.data.roles);
        } else {
          console.error('Failed to load Discord roles:', result.data);
          setRoles([]);
        }
      } catch (error) {
        console.error('Failed to load Discord roles:', error);
        setRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    }

    loadRoles();
  }, [importingAccount, slug]);

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    const currentRoles = form.getValues(`tasks.${index}.roles`) || [];
    const newRoles = checked
      ? [...currentRoles, roleId]
      : currentRoles.filter((id) => id !== roleId);
    form.setValue(`tasks.${index}.roles`, newRoles);
  };

  if (!importingAccount) {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.roles`}
      render={() => (
        <FormItem>
          <SwitchFormHeader
            className="mb-1"
            label="Required Roles (Optional)"
            help={{
              title: 'Help: Required Roles',
              content: (
                <p>
                  Select roles that users must have to complete this task. If no
                  roles are selected, all server members can participate.
                </p>
              )
            }}
          />
          {loadingRoles ? (
            <div className="text-sm text-muted-foreground">Loading roles...</div>
          ) : roles.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No roles available for this server.
            </div>
          ) : (
            <div className="space-y-2 border rounded-md p-3 max-h-64 overflow-y-auto">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selectedRoles.includes(role.id)}
                    onCheckedChange={(checked) =>
                      handleRoleToggle(role.id, checked === true)
                    }
                  />
                  <FormLabel
                    htmlFor={`role-${role.id}`}
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    {role.color !== 0 && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: `#${role.color.toString(16).padStart(6, '0')}`
                        }}
                      />
                    )}
                    {role.name}
                  </FormLabel>
                </div>
              ))}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
