'use server';

export default async function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex grow bg-giveaway">
      <div className="flex items-center justify-center py-3 sm:py-6 container sm:max-w-3xl">
        {children}
      </div>
    </div>
  );
}
