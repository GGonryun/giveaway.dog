import { SweepstakesTable } from './table';

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page() {
  return <SweepstakesTable />;
}
