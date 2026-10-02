'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SettingsCard } from '@/components/settings/settings-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import { X, Plus } from 'lucide-react';
import {
  SUPPORTED_SOCIAL_PLATFORMS,
  PLATFORM_LABELS,
  PLATFORM_PLACEHOLDERS,
  type SocialLink,
  socialLinksSchema
} from '@/schemas/social-links';
import { useProcedure } from '@/lib/mrpc/hook';
import updateTeamLinks from '@/procedures/teams/update-team-links';
import { toast } from 'sonner';

const formSchema = z.object({
  links: socialLinksSchema
});

type FormValues = z.infer<typeof formSchema>;

interface SocialLinksCardProps {
  slug: string;
  initialLinks: SocialLink[];
  onUpdate?: () => void;
}

export const SocialLinksCard: React.FC<SocialLinksCardProps> = ({
  slug,
  initialLinks,
  onUpdate
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      links: initialLinks
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'links'
  });

  const { isLoading, run: saveLinks } = useProcedure({
    action: updateTeamLinks,
    onSuccess() {
      toast.success('Social links updated successfully');
      form.reset(form.getValues());
      onUpdate?.();
    },
    onFailure(error) {
      toast.error(error.message || 'Failed to update social links');
    }
  });

  useEffect(() => {
    form.reset({ links: initialLinks });
  }, [initialLinks, form]);

  const handleAddLink = () => {
    const currentLinks = form.getValues('links');
    const availablePlatforms = SUPPORTED_SOCIAL_PLATFORMS.filter(
      (platform) => !currentLinks.some((link) => link.platform === platform)
    );

    if (availablePlatforms.length === 0) {
      toast.error('All platforms have been added');
      return;
    }

    append({ platform: availablePlatforms[0], url: '' });
  };

  const handleSave = form.handleSubmit(async (data) => {
    await saveLinks({ slug, links: data.links });
  });

  const getAvailablePlatformsForLink = (currentIndex: number) => {
    const currentLinks = form.getValues('links');
    return SUPPORTED_SOCIAL_PLATFORMS.filter(
      (platform) =>
        !currentLinks.some(
          (link, index) => index !== currentIndex && link.platform === platform
        )
    );
  };

  return (
    <SettingsCard
      title="Social Media Links"
      description="Add links to your social media profiles and website."
      footer="Links will be displayed on your sweepstakes pages."
      onSave={handleSave}
      isSaving={isLoading}
      hasChanges={form.formState.isDirty}
    >
      <Form {...form}>
        <form className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <FormField
                control={form.control}
                name={`links.${index}.platform`}
                render={({ field: platformField }) => (
                  <FormItem className="w-[180px]">
                    <Select
                      value={platformField.value}
                      onValueChange={platformField.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getAvailablePlatformsForLink(index).map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            {PLATFORM_LABELS[platform]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`links.${index}.url`}
                render={({ field: urlField }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="url"
                        placeholder={
                          PLATFORM_PLACEHOLDERS[
                            form.watch(`links.${index}.platform`)
                          ]
                        }
                        {...urlField}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => remove(index)}
                className="mt-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {fields.length < SUPPORTED_SOCIAL_PLATFORMS.length && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddLink}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Social Link
            </Button>
          )}

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No social links added yet. Click the button above to add one.
            </p>
          )}
        </form>
      </Form>
    </SettingsCard>
  );
};
