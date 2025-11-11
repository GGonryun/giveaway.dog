- [] Add a small banner that says "Thank you for completing all the tasks!"

- [ ] As a host, I want improved task and prize selection in form fields.
  - [ ] When adding an entry method or prize it should automatically appear "open"
  - [ ] When an entry method or prize has an error it should show an error triangle and outline it as red.
  - [ ] Make it easier to drag and drop tasks/prizes to reorder them.

- [ ] As a host, I want to let other participants know we are verified and trustworthy by adding a verification badge to my profile.
- [ ] As a host, I want to display my organization's logo and social media links on the sweepstake page.
- [ ] As a host, I want to be able to attach screenshots/proof that a user has claimed a prize.

- [ ] As a host, I want to create templates for sweepstakes so that i can easily create duplicates.

- [ ] Add a way to report sweepstakes.
- [ ] Add a way to block users from sweepstakes.

- [ ] Add Twitch integration.
- [ ] Add a referral integration.
- [ ] Add a secret code integration.
- [ ] Add TikTok integration.
- [ ] Add YouTube integration.
- [ ] Add Facebook integration.
- [ ] Add Instagram integration.
- [ ] Add a recurring tasks.
- [ ] Add a form integration.

## Questionable Features

- [ ] As a host, I want to automatically send a twitter post and then update my sweepstake with the tweet link.
  - questionable because twitter API limits make this difficult.
  - it also opens up a can of worms around customizing the tweet content or the task content.

## Major Features

- [ ] I want to create short links for my sweepstakes, and draw verification
- [ ] Add an instant giveaway feature where users can instantly win prizes without waiting for a draw.
- [ ] Add a leaderboard giveaway feature where users can compete for prizes based on points earned through tasks.
- [ ] Add a discord giveaway "bot" that automate sweepstake creation/notification via Discord
- [ ] As a host, I want to to have a host profile page that looks like link tree so people can navigate and go to my socials.

## Minor Features

- [ ] Add a built in ticketing support system for sweepstakes.
- [ ] As a host, I want to be able to notify users in-app about rewards and sweepstakes they have won.
- [ ] Add multiple image support for sweepstakes.
- [ ] Add a way to pause sweepstakes.

## Marketing Features

- [ ] Improve the marketing site, include more features and benefits and social proof and a blog.
- [ ] Add an FAQ or knowledge base.
- [ ] Add a changelog to the marketing site and the main website.

## Personal Features

- [ ] Add a Charity Games integration.
- [ ] As a host, I want to use my own custom domain and url for my sweepstakes.
- [ ] Migrate all Charity Games giveaways to Giveaway Dog.
- [ ] As a host I want to be able to create a subdomain for my giveaways such as: https://charitygames.giveaway.dog/12345

## Tech Debt

- [ ] Get rid of invalidate and cache methods on procedures
- [ ] Add actual RBAC support for other membership/role types beyond owner, and admin.
  - [ ] if we have real RBAC we can now have a true sandbox org where _everyone_ gets the guest role.
- [ ] User's page needs deep links for modal
