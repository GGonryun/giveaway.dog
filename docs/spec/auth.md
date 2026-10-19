# Auth

How people sign in and out, which pages they can open, and how a sign-in finds the account it belongs to.

## Sign-in and sign-out

- `AUTH-001` A magic link from the sign-in email signs in the person it was sent to.
- `AUTH-002` A magic link signs in only once: a second use of the same link signs in no one.
- `AUTH-003` The login page refuses an empty email address and sends no email.
- `AUTH-004` After a visitor asks for a magic link, the login page shows that the email was sent.
- `AUTH-005` A first sign-in through an OAuth provider creates a new user, with the provider account linked to it.
- `AUTH-006` A new user's first sign-in sends them to onboarding.
- `AUTH-007` A visitor whom the app sends to the login page returns to the page they asked for after signing in.
- `AUTH-008` Logging out from any place that offers it ends the session, and the person is signed out afterwards.
- `AUTH-009` The logout page counts down from 5 seconds before it sends the person on.

## Route protection

- `ROUTE-001` A visitor who opens an account page or a host page is sent to the login page.
- `ROUTE-002` A visitor opens the public pages without signing in.
- `ROUTE-003` A visitor who opens the logout page is sent home.
- `ROUTE-004` A participant who opens a host page is sent to browse.
- `ROUTE-005` A signed-in user who opens the login page is sent away from it.
- `ROUTE-006` A user who has not finished onboarding is sent to onboarding from every page except the home and pricing pages.
- `ROUTE-007` A signed-in user lands where their account belongs: a host on the team picker, a participant on browse, and a user who has not finished onboarding on onboarding.

## Account linking

- `LINK-001` A magic-link sign-in never signs into an account that holds the email address without having verified it.
- `LINK-002` An OAuth sign-in whose provider has not verified the email address never signs into an existing account with that address.
