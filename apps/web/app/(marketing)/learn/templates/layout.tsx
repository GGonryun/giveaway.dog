import { pageMetadata } from '@giveaway/marketing-model/page-metadata';

export const metadata = pageMetadata({
  title: 'Giveaway Templates | Giveaway.dog',
  description:
    'Save time with professionally designed giveaway templates tailored for different platforms and goals.'
});

interface TemplatesLayoutProps {
  modal: React.ReactNode;
  children: React.ReactNode;
}

export default function TemplatesLayout({
  modal,
  children
}: TemplatesLayoutProps) {
  return (
    <>
      {modal}
      {children}
    </>
  );
}
