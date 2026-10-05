import { UsersTable } from './users-table';
import { getTeamParticipants } from '@giveaway/participant-server/get-team-participants';
import { getTeamTasks } from '@giveaway/participant-server/get-team-tasks';
import { TeamPageProps } from '@giveaway/sweepstakes-model/pages';
import { ParsedUsersParams } from '../lib/parse-search-params';

type UsersTableWrapperProps = {
  teamParams: TeamPageProps;
  parsedParams: ParsedUsersParams;
};

export async function UsersTableWrapper({
  teamParams,
  parsedParams
}: UsersTableWrapperProps) {
  const participantsResult = await getTeamParticipants({
    ...teamParams,
    ...parsedParams
  });

  const tasks = await getTeamTasks({
    ...teamParams
  });

  if (!participantsResult.ok) {
    return <div>Failed to load users: {participantsResult.data.message}</div>;
  }

  if (!tasks.ok) {
    return <div>Failed to load tasks: {tasks.data.message}</div>;
  }

  return (
    <UsersTable
      initialData={participantsResult.data}
      totalTasks={tasks.data.length}
    />
  );
}
