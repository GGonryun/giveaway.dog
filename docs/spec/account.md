# Account

How a new user finishes onboarding, and what a user can change about their own account.

## Onboarding

- `ONBOARD-001` A new user who finishes onboarding as a participant lands on browse, and keeps using the site as an onboarded participant without signing in again.
- `ONBOARD-002` A new user who finishes onboarding as a host lands on the team picker, and keeps access to the host pages without signing in again.
- `ONBOARD-003` Onboarding refuses a username that another user already has, and keeps the user on the profile step.
- `ONBOARD-004` A new user who starts onboarding from a giveaway page returns to that giveaway when they finish.

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
