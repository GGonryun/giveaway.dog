import { describe, it } from 'vitest';

describe('the data retention of the X pickers of each team tier', () => {
  it.todo(
    '[RETAIN-008] the scraped users and posts of a Free or teamless X picker are deleted 90 days after it completes, except the drawn users'
  );
  it.todo(
    '[RETAIN-009] a Pro X picker keeps its data one year, and an Elite or Alpha X picker keeps it forever'
  );
  it.todo(
    '[RETAIN-010] the deletion keeps the X picker, its filters and its draws'
  );
  it.todo(
    '[RETAIN-011] no data of an X picker is deleted before the retention period of its team tier ends'
  );
});
