# Entries

How participants complete tasks, and how many entries a completion is worth.

- `ENTRY-001` A participant gets at most one completion for each task.
- `ENTRY-002` A completion is worth a finite number of entries, and at least 1.
- `ENTRY-003` A task's bonus for a verified account is added only when the proof of the completion is verified.
- `ENTRY-004` The server refuses an entry that the giveaway's rules block (its dates, regions, allowed identities and required age), even when the request does not come from the giveaway page.
- `ENTRY-005` A participant whose country is unknown cannot enter a giveaway that has a region restriction, whether it includes or excludes regions.
- `ENTRY-006` Once a giveaway's start time has passed, its page shows each visitor the state of a running giveaway (sign in, complete the profile, not eligible, or the tasks), even when the page was cached before the start.
