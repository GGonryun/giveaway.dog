export default function Layout({
  children,
  automation
}: {
  children: React.ReactNode;
  automation: React.ReactNode;
}) {
  return (
    <>
      {automation}
      {children}
    </>
  );
}
