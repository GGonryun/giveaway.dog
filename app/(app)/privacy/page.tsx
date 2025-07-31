import Image from 'next/image';

export default async function Page() {
  return (
    <div className="flex flex-col gap-4">
      <Image src="/dog.png" alt="The Giveaway Dog" width="222" height="198" />
    </div>
  );
}
