export const metadata = {
  title: 'GiveawayDog',
  description: 'Build better giveaways and contests'
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
