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
