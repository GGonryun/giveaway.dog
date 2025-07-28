import { widetype } from '@/lib/widetype';

type GiveawaySection =
  | 'sponsor'
  | 'eligibility'
  | 'agreementToRules'
  | 'entryPeriod'
  | 'howToEnter'
  | 'prizes'
  | 'winnerSelection'
  | 'rights'
  | 'termsAndConditions'
  | 'liability'
  | 'disputes'
  | 'winnersList'
  | 'platformDisclaimer'
  | 'privacy'
  | 'additionalTerms'
  | 'heading'
  | 'noPurchaseNotice';

const giveawayOrder: GiveawaySection[] = [
  'heading',
  'noPurchaseNotice',
  'sponsor',
  'eligibility',
  'agreementToRules',
  'entryPeriod',
  'howToEnter',
  'prizes',
  'winnerSelection',
  'rights',
  'termsAndConditions',
  'liability',
  'disputes',
  'winnersList',
  'platformDisclaimer',
  'privacy',
  'additionalTerms'
];

const omitSections: GiveawaySection[] = ['heading'];

type GiveawayTermOptions = {
  sponsorName: string;
  sponsorAddress: string;
  winnerSelectionMethod: string;
  winnerContactTimeframe: string;
  winnerClaimPeriod: string;
  governingLawCountry: string;
  privacyPolicyUrl: string;
  additionalTerms: string;
};

export const giveawayTerms = (
  configuration: GiveawayTermOptions
): { [key in GiveawaySection]: string } => ({
  sponsor: `The sponsor of this giveaway ("Sweepstakes") is ${configuration.sponsorName}, located at ${configuration.sponsorAddress} ("Sponsor").`,

  eligibility: `This Sweepstakes is open worldwide and is void where prohibited by law. Entrants must sign up at the designated website and comply with all terms herein. Employees and affiliates of the Sponsor and their family members or anyone residing in the same household are not eligible.

Entrants under the age of 18 must obtain the permission of a parent or legal guardian to enter. By entering, minors affirm that such consent has been granted.`,

  agreementToRules: `By entering the Sweepstakes, you agree to be bound by these terms, meet eligibility requirements, and accept Sponsor decisions as final.`,

  entryPeriod: `The Sweepstakes starts and ends during the period specified on the campaign page. Entries outside this period will not be considered.`,

  howToEnter: `You must complete the form on the designated entry platform. Verification (e.g., email confirmation or fraud detection) may be required. Multiple entries or attempts to game the system using bots, scripts, or fake accounts may lead to disqualification.`,

  prizes: `Winners will receive the prize(s) described on the campaign page. Prizes are non-transferable and non-redeemable for cash unless permitted by the Sponsor. All taxes and expenses are the responsibility of the Winner.`,

  winnerSelection: `Winners will be selected ${configuration.winnerSelectionMethod} and contacted ${configuration.winnerContactTimeframe} via the contact information provided. Winners have ${configuration.winnerClaimPeriod} to claim their prize. Failure to do so may result in forfeiture and selection of an alternate winner.`,

  rights: `By entering, you grant the Sponsor the right to use your name, likeness, and content in any promotional materials, in any medium, without further compensation, unless prohibited by law.

You affirm that your entry is your original work and does not infringe on the rights of others. You agree to indemnify the Sponsor for any claims resulting from your entry.`,

  termsAndConditions: `Sponsor may cancel, modify, or suspend the Sweepstakes due to fraud, technical issues, or other factors outside its control. Sponsor reserves the right to disqualify anyone violating these terms.`,

  liability: `By participating, you release the Sponsor and its affiliates from liability related to:
- Participation or inability to participate
- Technical or human errors
- Prize use or misuse
- Disruption or corruption of the campaign`,

  disputes: `The Sweepstakes is governed by the laws of ${configuration.governingLawCountry}. Disputes will be resolved individually (not as part of a class) in a court of competent jurisdiction in ${configuration.governingLawCountry}.`,

  winnersList: `To obtain a list of winners, contact the Sponsor within four (4) weeks of the campaign's end.`,

  platformDisclaimer: `This Sweepstakes is not sponsored, endorsed, administered by, or associated with any social media platform, including Facebook, Instagram, Twitter (X), YouTube, Reddit, or others. You are providing your information to the Sponsor.`,

  privacy: `Your information is governed by our privacy policy: ${configuration.privacyPolicyUrl}`,

  additionalTerms: `${configuration.additionalTerms}`,

  heading: `Giveaway Terms & Conditions`,

  noPurchaseNotice: `NO PURCHASE IS NECESSARY TO ENTER OR WIN. A PURCHASE DOES NOT INCREASE THE CHANCES OF WINNING.`
});

const sampleOptions: GiveawayTermOptions = {
  sponsorName: 'My Company',
  sponsorAddress: '123 Main St, Anytown, USA',
  winnerSelectionMethod: 'random drawing',
  winnerContactTimeframe: 'within 48 hours',
  winnerClaimPeriod: '7 days',
  governingLawCountry: 'USA',
  privacyPolicyUrl: 'https://mycompany.com/privacy',
  additionalTerms: 'No additional terms.'
};

export const stringifyTerms = (
  options: GiveawayTermOptions = sampleOptions
) => {
  const terms = giveawayTerms(options);

  return widetype
    .entries(terms)
    .filter(([key]) => !omitSections.includes(key))
    .sort(
      ([keyA], [keyB]) =>
        giveawayOrder.indexOf(keyA) - giveawayOrder.indexOf(keyB)
    )
    .map(([, value]) => value)
    .join('\n\n');
};
