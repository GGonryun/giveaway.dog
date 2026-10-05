'use client';

import { TeamNameCard } from './team-name-card';
import { TeamSlugCard } from './team-slug-card';
import { TeamLogoCard } from './team-logo-card';
import { useRouter } from 'next/navigation';

interface BasicInformationSectionProps {
  slug: string;
  name: string;
  logo: string;
}

export const BasicInformationSection: React.FC<
  BasicInformationSectionProps
> = ({ slug, name, logo }) => {
  const router = useRouter();

  const handleUpdate = () => {
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <TeamSlugCard slug={slug} />
      <TeamNameCard slug={slug} initialName={name} onUpdate={handleUpdate} />
      <TeamLogoCard slug={slug} initialLogo={logo} onUpdate={handleUpdate} />
    </div>
  );
};
