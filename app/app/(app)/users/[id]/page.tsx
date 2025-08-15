import { Outline } from '../../../outline';
import { UserDetailView } from './components/user-detail-view';

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  
  return (
    <Outline title={`User ${id.replace('user_', '')}`} container={true}>
      <UserDetailView userId={id} />
    </Outline>
  );
}