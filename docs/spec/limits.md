# Tier limits

How long a giveaway may run and how long the data of its giveaways and X pickers is kept, for each tier of its team (#684).

## Giveaway duration

- `TIER-001` A giveaway of a Free team runs for at most 7 days, from its start date to its end date.
- `TIER-002` A giveaway of a Pro team runs for at most 30 days.
- `TIER-003` A giveaway of an Elite or Alpha team runs for at most 90 days.
- `TIER-004` The server refuses to save or publish a giveaway that runs longer than the limit of its team's tier, whatever the editor sends.
- `TIER-005` A save that does not change the dates of a published giveaway is never refused for its duration, so a giveaway published before its team's limit applied keeps running until its end date.
- `TIER-006` The editor shows the duration limit of the team's tier, and offers an upgrade when the host picks an end date past it.

## Data retention

- `RETAIN-001` Ninety days after a giveaway of a Free team ends, its participants, their task completions, their form answers, its jobs and its uploaded images are deleted.
- `RETAIN-002` One year after a giveaway of a Pro team ends, the same data is deleted.
- `RETAIN-003` The data of a giveaway of an Elite or Alpha team is never deleted for its age.
- `RETAIN-004` The deletion keeps the name, the dates, the prizes and the winners of the giveaway, so the winners and history pages still show it.
- `RETAIN-005` The deletion follows the tier that the team has on the day of the deletion, so a team that upgrades before that day keeps the data.
- `RETAIN-006` The deletion never deletes a user account, or the data of another giveaway.
- `RETAIN-007` An ended giveaway whose data will be deleted shows its host the date of the deletion and an offer to upgrade.
- `RETAIN-008` Ninety days after an X picker of a Free team, or of no team, completes, its scraped users and posts are deleted, except the users that a draw picked.
- `RETAIN-009` One year after an X picker of a Pro team completes, the same data is deleted. The data of an X picker of an Elite or Alpha team is never deleted for its age.
- `RETAIN-010` The deletion keeps the X picker, its filters and its draws, so the host still sees its winners.
- `RETAIN-011` No data of a giveaway or an X picker is deleted for its age before the end of the retention period of its team's tier.
