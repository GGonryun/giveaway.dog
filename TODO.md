## Roadmap

- [ ] Velora App Integration

- [ ] Twitter v2 import task

- [ ] Bluesky Picker

- [ ] Add discord bot for discord-specific giveaways.

- [ ] Add an "I already completed this task" to tiktok

- [ ] Add integration guard to facebook tasks.

- [ ] Global/Team blacklist/whitelist for users.

- [ ] Add support for a preferred contact method on user profiles.

- [ ] Add twitch bot for streamer giveaways.

- [ ] Add Polls

- [ ] Add Leaderboards

---

### @theejankanator

- Make it easy to collect data about what responses users have provided to questions.
- Just curious is there a way to create a function where they could put their entries into different games under one giveaway with creating a giveaway for every individual game?

## @TheGamesDetective

- [ ] Suggestion for analytics: graph showing the number of users per day, the number of visits, and conversion rate

### Nobody Asked

- [ ] Add question entry method types:
  - [ ] Pick an image from a gallery

- [ ] If I am the owner of a giveaway, display a special "editor" button that takes me to the team sweepstakes overview so I can edit it quickly.

- [ ] Add a Threads integration - https://authjs.dev/getting-started/providers/threads (connect with threads, follow on threads, like a post, reply to a post)
- [ ] Add Reddit integration - https://next-auth.js.org/providers/reddit (visit a subreddit, up vote a post, follow a subreddit, login with Reddit)
- [ ] Add LinkedIn integration - https://next-auth.js.org/providers/linkedin (share on linked in, follow a page, login with LinkedIn)
- [ ] Add a temporary Facebook integration - https://next-auth.js.org/providers/facebook (connect with facebook, follow a page, like a post)
- [ ] Add a Snapchat integration - https://developers.snap.com/api/marketing-api/Ads-API/authentication (connect with snapchat, follow on snapchat)
- [ ] Add a Pinterest integration - https://next-auth.js.org/providers/pinterest (connect with pinterest, follow on pinterest, save a pin)
- [ ] Add GitHub integration - https://next-auth.js.org/providers/github (follow a repo, star a repo, login with GitHub)
- [ ] Add a twitter post entry method
- [ ] Add a twitter reply entry method
- [ ] Add more steam entry methods (join a group, play a game for X hours, wishlist a game, follow a curator)

- [ ] Add a Patreon integration - https://next-auth.js.org/providers/patreon (connect with patreon, become a patron)
- [ ] Add a spotify integration - https://authjs.dev/getting-started/providers/spotify (connect with spotify, follow a playlist, listen to a song)
- [ ] Add a Tumblr integration - https://www.tumblr.com/docs/en/api/v2 (connect with tumblr, follow a blog, like a post)
- [ ] Add a Producthunt entry method - https://api.producthunt.com/v2/docs/oauth_user_authentication/oauth_authorize_ask_for_access_grant_code_on_behalf_of_the_user (visit page, vote for product, follow on producthunt)
- [ ] Add a daily recurring entry method (visit daily to get entries)
- [ ] Add a ko-fi link entry method.

- [ ] Get a business license for facebook login support.

- [ ] As a host, I want improved task and prize selection in form fields.
  - [ ] When adding an entry method or prize it should automatically appear "open"
  - [ ] When an entry method or prize has an error it should show an error triangle and outline it as red.
  - [ ] Make it easier to drag and drop tasks/prizes to reorder them.
  - [ ] When I click "next" on a sweepstake it doesn't scroll me back to the top of the page.
  - [ ] The horizontal scroll bar for sweepstakes tabs doesn't look good when the screen is too small.

- [ ] Add a way to report sweepstakes.
- [ ] Add a way to block users from sweepstakes.
- [ ] Add a built in ticketing support system for sweepstakes.
- [ ] As a host, I want to be able to notify users in-app about rewards and sweepstakes they have won.
- [ ] As a host, I want to be able to attach screenshots/proof that a user has claimed a prize.
- [ ] As a host, I want people to subscribe to my newsletter on giveaway.dog and be notified of my sweepstakes.
  - [ ] It should also include an action to "follow" us on giveaway.dog

- [ ] As a host, I want to let other participants know we are verified and trustworthy by adding a verification badge to my profile.
- [ ] As a host, I want to display my organization's logo on the sweepstake page.

- [ ] Add a "geo-location" entry method where users have to be in a certain location to get entries.

- [ ] Add back "Validate user" feature validates to make sure that the user email is valid and not disposable.

- [ ] BlueSky picker.
- [ ] Create a marketing page for "draw verification".
- [ ] Add support for generating short links for my sweepstakes, and draw verification

## @Dom on Discord

- [ ] Let hosts submit proof of receipt to increase their trust score.
- [ ] Upload social proof onto the website.

## KensonPlays

- [ ] add a discord bot to reward users who interact on discord: lightweight that i'm currently experimenting with is granting users with specific roles access to giveaways

## Personal Features

- [ ] Second chance giveaways
- [ ] Add a Charity Games integration.
- [ ] As a host, I want to use my own custom domain and url for my sweepstakes.
- [ ] Migrate all Charity Games giveaways to Giveaway Dog.
- [ ] As a host I want to be able to create a subdomain for my giveaways such as: https://charitygames.giveaway.dog/12345

## Unrelated Features

- [ ] Custom discord bot.

- [ ] hi folks, im brainstorming an idea for participants nicknamed "autocomplete" which would allow active and highly trusted participants to automatically receive entries into future giveaways for tasks that they've already completed in the past.
- [ ] Add an instant giveaway app where users can instantly win prizes without waiting for a draw, we can have a minimum number of tasks before claiming a prize, and the prize claim can be random chance or guaranteed based on number of prizes available.
- [ ] Add a leaderboard (works similar to wait-lists app) app where users can compete for prizes based on points earned through tasks.
- [ ] Add a milestones app where users can unlock prizes by reaching certain milestones, for example number of referrals.
- [ ] Add a ticket picker, user's get a single ticket number and winners are drawn based on ticket numbers. Works best for in-person events similar to a raffle where users can cut a ticket and then a ticket is drawn.
- [ ] Add a discord giveaway "bot" that automate sweepstake creation/notification via Discord
- [ ] As a host, I want to to have a host profile page that looks like link tree so people can navigate and go to my socials.

- [ ] Improve the marketing site, include more features and benefits and social proof and a blog.
- [ ] Add an FAQ or knowledge base.
- [ ] Add a changelog to the marketing site and the main website.
- [ ] There's a way to exploit the site by having two different primary accounts and constantly switching out the

## UX Improvements

- [ ] add a toggle for start immediately on sweepstakes creation.
- [ ] When someone submits an answer we should show them the data they provided.

## Tech Debt

- [ ] Make it easier to drag things around in the sweepstake editor.

- [ ] Add actual RBAC support for other membership/role types beyond owner, and admin.
- [ ] Fix the timing schema to use super refine on the entire form instead
  - [ ] if we have real RBAC we can now have a true sandbox org where _everyone_ gets the guest role.
- [ ] User's page needs deep links for modal
- [ ] Winner's page needs deep links for modal

- [ ] Fix the way we update sweepstakes it's unruly for huge giveaways.
- [ ] Fix the unoptimized users page slow loading.

- [ ] Update to Prisma 7

---

Other:

- [ ] Give @CuparaGaming access to github repo.

- [ ] "GiveawayDog is a streamers best friend."
