import { describe, it } from 'vitest';

describe('the data retention of each team tier', () => {
  it.todo(
    '[RETAIN-001] the participant data of a Free giveaway is deleted 90 days after it ends'
  );
  it.todo(
    '[RETAIN-002] the participant data of a Pro giveaway is deleted one year after it ends'
  );
  it.todo(
    '[RETAIN-003] the data of an Elite or Alpha giveaway is never deleted for its age'
  );
  it.todo(
    '[RETAIN-004] the deletion keeps the name, the dates, the prizes and the winners'
  );
  it.todo(
    '[RETAIN-005] a team that upgrades before the day of the deletion keeps the data'
  );
  it.todo(
    '[RETAIN-006] the deletion deletes no user account and no data of another giveaway'
  );
  it.todo(
    '[RETAIN-011] no data of a giveaway is deleted before the retention period of its team tier ends'
  );
});
