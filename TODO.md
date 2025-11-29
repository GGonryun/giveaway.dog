## Roadmap

- [ ] Add twitter likes entry method

### h7ban

- [ ] Add Facebook integration - https://next-auth.js.org/providers/facebook
- [ ] Add Instagram integration - https://next-auth.js.org/providers/instagram

### Nobody Asked

- [ ] Add a referral integration.

- [ ] Add Reddit integration - https://next-auth.js.org/providers/reddit
- [ ] Add LinkedIn integration - https://next-auth.js.org/providers/linkedin

- [ ] Add GitHub integration - https://next-auth.js.org/providers/github
- [ ] Add BlueSky integration - https://docs.bsky.app/docs/advanced-guides/oauth-client

- [ ] Add TikTok integration - https://www.better-auth.com/docs/authentication/tiktok

- [ ] Add a form integration.

- [ ] As a host, I want improved task and prize selection in form fields.
  - [ ] When adding an entry method or prize it should automatically appear "open"
  - [ ] When an entry method or prize has an error it should show an error triangle and outline it as red.
  - [ ] Make it easier to drag and drop tasks/prizes to reorder them.
  - [ ] When I click "next" on a sweepstake it doesn't scroll me back to the top of the page.
  - [ ] The horizontal scroll bar for sweepstakes tabs doesn't look good when the screen is too small.

- [ ] Add a recurring tasks to sweepstakes integrations.
- [ ] Add a way to report sweepstakes.
- [ ] Add a way to block users from sweepstakes.
- [ ] Add a built in ticketing support system for sweepstakes.
- [ ] As a host, I want to be able to notify users in-app about rewards and sweepstakes they have won.
- [ ] As a host, I want to be able to attach screenshots/proof that a user has claimed a prize.
- [ ] As a host, I want people to subscribe to my newsletter on giveaway.dog and be notified of my sweepstakes.
  - [ ] It should also include an action to "follow" us on giveaway.dog

- [ ] If I am the owner of a giveaway, display a special "editor" button that takes me to the team sweepstakes overview so I can edit it quickly.

- [ ] As a host, I want to let other participants know we are verified and trustworthy by adding a verification badge to my profile.
- [ ] As a host, I want to display my organization's logo on the sweepstake page.

- [ ] I want to create short links for my sweepstakes, and draw verification

### @Gamelooty

- [ ] Unified Sweepstakes Platform
  - [ ] Also, do you think it would be possible to use picker in a way so that as soon as i create a giveaway with requirements, i put that link into picker and it'd monitor entries from the start, so that when its time to pick, it doesn't take so long to scan through all from 0?

- it would also be nice to be able to use an old giveaway (one thats already finished) and save that one as a template but i might just be nitpicking here
- i also wonder if you have any protection against suspicious looking emails? for example, if someone entered with emails bob1234 and another person as bob12345

## Personal Features

- [ ] Add a Charity Games integration.
- [ ] As a host, I want to use my own custom domain and url for my sweepstakes.
- [ ] Migrate all Charity Games giveaways to Giveaway Dog.
- [ ] As a host I want to be able to create a subdomain for my giveaways such as: https://charitygames.giveaway.dog/12345

## Unrelated Features

- [ ] Add an instant giveaway app where users can instantly win prizes without waiting for a draw, we can have a minimum number of tasks before claiming a prize, and the prize claim can be random chance or guaranteed based on number of prizes available.
- [ ] Add a leaderboard (works similar to wait-lists app) app where users can compete for prizes based on points earned through tasks.
- [ ] Add a milestones app where users can unlock prizes by reaching certain milestones, for example number of referrals.
- [ ] Add a ticket picker, user's get a single ticket number and winners are drawn based on ticket numbers. Works best for in-person events similar to a raffle where users can cut a ticket and then a ticket is drawn.
- [ ] Add a discord giveaway "bot" that automate sweepstake creation/notification via Discord
- [ ] As a host, I want to to have a host profile page that looks like link tree so people can navigate and go to my socials.

- [ ] Improve the marketing site, include more features and benefits and social proof and a blog.
- [ ] Add an FAQ or knowledge base.
- [ ] Add a changelog to the marketing site and the main website.

## Tech Debt

- [ ] Add actual RBAC support for other membership/role types beyond owner, and admin.
  - [ ] if we have real RBAC we can now have a true sandbox org where _everyone_ gets the guest role.
- [ ] User's page needs deep links for modal
- [ ] Winner's page needs deep links for modal
- [ ] Update to Prisma 7
