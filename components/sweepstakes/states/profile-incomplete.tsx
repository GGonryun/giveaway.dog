'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountrySelector } from '@/components/ui/country-selector';
import { Calendar } from 'lucide-react';
import { useProcedure } from '@/lib/mrpc/hook';
import updateProfile from '@/procedures/user/update-profile';
import { UpdateUserProfile } from '@/schemas/user';
import { toast } from 'sonner';
import { useGiveawayParticipation } from '../giveaway-participation-context';
import { cn } from '@/lib/utils';

export const ProfileIncomplete = () => {
  const { userProfile, sweepstakes } = useGiveawayParticipation();

  const updateProfileProcedure = useProcedure({
    action: updateProfile,
    onSuccess() {
      toast.success('Profile updated successfully');
      // Refresh the page to re-evaluate the state
      window.location.reload();
    }
  });

  const [formData, setFormData] = useState<
    Pick<UpdateUserProfile, 'id' | 'age' | 'region'>
  >({
    id: userProfile?.id ?? '',
    age: userProfile?.age?.toString() ?? '',
    region: userProfile?.region ?? ''
  });

  // Determine which fields are required based on sweepstakes restrictions
  const requiresAge = sweepstakes.audience.minimumAgeRestriction;
  const requiresRegion = sweepstakes.audience.regionalRestriction;

  // Validation
  const isAgeValid =
    !requiresAge ||
    (formData.age && parseInt(formData.age) >= (requiresAge.value || 13));
  const isRegionValid = !requiresRegion || !!formData.region;
  const isFormValid = isAgeValid && isRegionValid;

  // Determine which fields actually need to be displayed
  const shouldShowAge = requiresAge && !userProfile?.age;
  const shouldShowRegion = requiresRegion && !userProfile?.region;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (countryCode: string) => {
    setFormData((prev) => ({ ...prev, region: countryCode }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Only submit the required fields that have changed
    const updateData: UpdateUserProfile = {
      id: userProfile?.id ?? '',
      name: userProfile?.name ?? '',
      emoji: userProfile?.emoji ?? '',
      type: null, // Not updating type here
      age: requiresAge ? formData.age : userProfile?.age?.toString() || null,
      region: requiresRegion ? formData.region : userProfile?.region || null
    };

    updateProfileProcedure.run(updateData);
  };

  return (
    <div className="space-y-4 my-4 mb-6">
      <div>
        <h3 className="text-lg font-semibold">Complete Your Profile</h3>
        <p className="text-sm text-muted-foreground">
          Please provide the required information to participate in this
          giveaway
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {shouldShowAge && (
          <div className="space-y-2">
            <Label htmlFor="age" className={cn(!isAgeValid && 'text-red-600')}>
              Age *
              {requiresAge && (
                <span className="text-sm text-muted-foreground ml-1">
                  (minimum {requiresAge.value})
                </span>
              )}
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="age"
                name="age"
                type="number"
                min={requiresAge?.value || 13}
                max="120"
                value={formData.age || ''}
                onChange={handleInputChange}
                className={cn(
                  'pl-10',
                  !isAgeValid &&
                    'border-red-500 focus:border-red-500 focus:ring-red-500'
                )}
                placeholder="Enter your age"
                required
              />
            </div>
            {!isAgeValid && formData.age && (
              <p className="text-sm text-red-600">
                You must be at least {requiresAge?.value} years old to
                participate
              </p>
            )}
          </div>
        )}

        {shouldShowRegion && (
          <div className="space-y-2">
            <Label className={cn(!isRegionValid && 'text-red-600')}>
              Country/Region *
            </Label>
            <CountrySelector
              hideLabel
              value={formData.region || ''}
              onValueChange={handleCountryChange}
            />
            {!isRegionValid && (
              <p className="text-sm text-red-600">
                Please select your country/region
              </p>
            )}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={!isFormValid || updateProfileProcedure.isLoading}
        >
          {updateProfileProcedure.isLoading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Updating Profile...
            </>
          ) : (
            'Complete Profile & Continue'
          )}
        </Button>

        {!isFormValid && (
          <p className="text-sm text-red-600 text-center">
            Please fill in all required fields to continue
          </p>
        )}
      </form>
    </div>
  );
};
