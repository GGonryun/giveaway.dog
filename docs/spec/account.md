# Account

How a new user finishes onboarding, and what a user can change about their own account.

## Onboarding

- `ONBOARD-001` A new user who finishes onboarding as a participant lands on browse, and keeps using the site as an onboarded participant without signing in again.
- `ONBOARD-002` A new user who finishes onboarding as a host lands on the team picker, and keeps access to the host pages without signing in again.
- `ONBOARD-003` Onboarding refuses a username that another user already has, and keeps the user on the profile step.
- `ONBOARD-004` A new user who starts onboarding from a giveaway page returns to that giveaway when they finish.
- `ONBOARD-005` A new user who picks hosting and reloads the profile step still finishes onboarding as a host.
- `ONBOARD-006` An onboarded user who opens the onboarding page is sent where their account belongs, and keeps their account type.

## Account settings

- `ACCOUNT-001` The account menu shows the user's name and email, and the links of their role: a host gets the dashboard and the upgrade, and a participant gets their participation history.
- `ACCOUNT-002` A user can change their display name, and the new name shows on the account page and in the account menu.
- `ACCOUNT-003` A display name is 5 to 30 characters long, and the account page refuses any other length.
- `ACCOUNT-004` A participant can turn on host access, and opens the host pages without signing in again.
- `ACCOUNT-005` A host can turn off host access, and can no longer open the host pages.
- `ACCOUNT-006` A user can link an Instagram or a Facebook profile, and disconnect it while they have another connected account.
- `ACCOUNT-007` A user cannot disconnect their only connected account.
- `ACCOUNT-008` A user cannot disconnect the last connected account that they can sign in with.
- `ACCOUNT-009` A profile that another user already linked is refused with an error, and stays linked to the first user.
- `ACCOUNT-010` When linking an account fails, the account page tells the user why.
- `ACCOUNT-011` A user who deletes their account is signed out, and the account is gone: signing in again with the same identity creates a new user.
- `ACCOUNT-012` A user can change their email address: the account keeps its old address until the user opens the verification link sent to the new one, and then shows the new address as verified.
- `ACCOUNT-013` An email change to an address that another user has verified is refused, and the account keeps its address.
- `ACCOUNT-014` A verification link with a wrong or expired token verifies nothing, and the page says that the link is not valid.
- `ACCOUNT-015` A verification link opened while signed out verifies the address once the user signs in.
- `ACCOUNT-016` After linking an account merges another user into theirs, the account page says so.
- `ACCOUNT-017` The account page tells a user when a provider connection has expired or is missing permissions, and offers to reconnect it.
- `ACCOUNT-018` Signing in again with the provider account clears an expired or missing-permission connection.
- `ACCOUNT-019` A user can pick a connected account as their preferred contact method, and keeps it after a reload.
- `ACCOUNT-020` When the preferred contact account is disconnected, the account page warns the user to pick another one.
- `ACCOUNT-021` A theme picked on the appearance tab applies at once and stays after a reload.
- `ACCOUNT-022` Each account tab opens from its own URL, with that tab selected.
- `ACCOUNT-023` A user can upload a profile image, which shows on the account page and in the account menu.
- `ACCOUNT-024` A user who links the provider account of an imported user gets that user's entries, and the imported user is gone.
- `ACCOUNT-025` A visitor who signs in with the provider account of an imported user takes over that user and is sent to onboarding.
- `ACCOUNT-026` Deleting an account removes the user from the participants of every giveaway they entered.
- `ACCOUNT-027` Deleting a host's account keeps the giveaways and templates of their team for its other members.
- `ACCOUNT-028` The account deletion dialog says that the account is deleted at once.
