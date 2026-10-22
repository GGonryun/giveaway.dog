# Giveaways

What happens to a giveaway when its host edits, copies, deletes or lists it after it is published.

## Edits

- `EDIT-001` Saving a giveaway keeps its participants, their completions with their statuses, their form answers and their referrals, for every task and form field that the save keeps.
- `EDIT-002` Saving a giveaway keeps its winners, its disqualified draws and the chain of each re-roll.
- `EDIT-003` Saving a giveaway keeps each participant's progress on its tasks, such as the attempts at a secret code.
- `EDIT-004` A host can remove a task that has completions or referrals, and the save removes only the completions and referrals of that task.
- `EDIT-005` Saving a giveaway does not change its creation date or its place in the list of the team's giveaways.
- `EDIT-006` After a host saves a giveaway, its public page shows the saved version, at its id URL and at its custom slug URL.

## Copies

- `COPY-001` A copy of a giveaway has every setting of the original (its tasks, prizes, allowed identities, pre-entry login, form fields, prize selection, regions and required age), except that it is a private draft with no custom slug.
- `COPY-002` Copying a giveaway does not change the original.

## Deletes

- `DELETE-001` A host deletes a giveaway only after typing its name.
- `DELETE-002` A deleted giveaway leaves the list of the team's giveaways without a reload.
- `DELETE-003` A deleted giveaway is not found, at its id URL or at its custom slug URL.

## The list of giveaways

- `LIST-001` Each status tab of the team's list of giveaways shows only the giveaways with that status.
- `LIST-002` The search of the list matches the name of a giveaway, whatever its case.
- `LIST-003` The date range filter of the list shows only the giveaways in that range.
- `LIST-004` The list keeps its status tab and its search after a reload.
- `LIST-005` Each row of the list opens the page that fits the status of its giveaway: the editor for a draft, and the preview for the others.
