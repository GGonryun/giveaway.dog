# Public data

What the public pages may send, who can open a giveaway that is not public, and how the app tracks the people who visit.

## What a page sends

- `LEAK-001` A page sends a participant no other user's email address.
- `LEAK-002` A giveaway page sends a visitor no email address of the host.
- `LEAK-003` A giveaway page sends no answer of a secret-code task, to a visitor or to a participant.
- `LEAK-004` The page of a completed giveaway sends no personal data of its winners, to a visitor or to a participant.

## Giveaway visibility

- `VIS-001` A private or draft giveaway is not found for anyone outside its team.
- `VIS-002` A private giveaway opens for a member of its team.
- `VIS-003` The page of a private or draft giveaway gives a bot none of its name, description or banner.
- `VIS-004` Opening the page of a private, draft, scheduled or ended giveaway does not make the visitor a participant of it.

## Tracking

- `TRACK-001` A signed-in visitor is tracked at most once, even when their browser keeps no cookie.
