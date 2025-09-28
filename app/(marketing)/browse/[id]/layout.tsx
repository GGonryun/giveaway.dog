'use server';

export default async function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex grow bg-giveaway">
      <div className="flex items-center justify-center gap-4 sm:gap-6 p-2 pb-4 sm:p-4 sm:pb-6 sm:container sm:max-w-2xl">
        {children}
      </div>
    </div>
  );
}
