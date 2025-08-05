import {
  SiteHeader,
  SiteHeaderProps
} from '@/components/patterns/app-sidebar/site-header';

export const Outline: React.PC<SiteHeaderProps> = ({ children, ...props }) => {
  return (
    <>
      <SiteHeader {...props} />
      <div className="container py-8">{children}</div>
    </>
  );
};
