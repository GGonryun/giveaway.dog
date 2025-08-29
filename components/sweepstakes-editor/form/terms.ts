import { toBrowsePageUrl } from '@/components/sweepstakes/util';
import { widetype } from '@/lib/widetype';
import {
  GiveawayTerms,
  GiveawayTermsForm,
  GiveawayTermsTemplateInputSchema
} from '@/schemas/giveaway';
import pluralize from 'pluralize';
import { z } from 'zod';

type GiveawaySection =
  | 'sponsor'
  | 'eligibility'
  | 'agreementToRules'
  | 'entryPeriod'
  | 'howToEnter'
  | 'prizes'
  | 'winnerSelection'
  | 'odds'
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
  'odds',
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

export type SweepstakesTermOptions = {
  sweepstakesName: string;
  eligibilityRegions: string;
  startDate: string;
  entryUrl: string;
  endDate: string;
  eligibilityAge?: string;
  prizes: {
    name: string;
    winners: number;
  }[];
} & GiveawayTermsTemplateInputSchema;

export const giveawayTerms = (
  configuration: SweepstakesTermOptions
): { [key in GiveawaySection]: string } => ({
  heading: `OFFICIAL RULES - ${configuration.sweepstakesName}`,

  noPurchaseNotice: `NO PURCHASE IS NECESSARY TO ENTER OR WIN. A PURCHASE DOES NOT INCREASE YOUR CHANCES OF WINNING.`,

  sponsor: `The Sweepstakes (“Promotion”) is sponsored by ${configuration.sponsorName}${
    configuration.sponsorAddress
      ? `, located at ${configuration.sponsorAddress}`
      : ''
  } (“Sponsor”). For inquiries or winner requests, contact the Sponsor.`,

  eligibility: `The Promotion is open ${configuration.eligibilityRegions} to ${configuration.eligibilityAge ? `individuals ${configuration.eligibilityAge}+ years of age` : 'all individuals'}, unless restricted by local law. 
Employees, contractors, and affiliates of the Sponsor, as well as household or immediate family members, are not eligible to participate.
Entrants under the legal age of majority must have permission from a parent or legal guardian.`,

  entryPeriod: `The Promotion begins on ${configuration.startDate} and ends on ${configuration.endDate}. Entries received outside this period will not be accepted.`,

  howToEnter: `Enter via ${configuration.entryUrl}.${configuration.maxEntriesPerUser ? ` Limit ${configuration.maxEntriesPerUser} entries per person.` : ''} Automated, fraudulent, or multiple entries through bots, scripts, or fake accounts are prohibited and may result in disqualification.`,

  prizes: `
${configuration.prizes.map((p) => `- ${p.winners} ${pluralize('winner', p.winners)} will receive ${p}`).join('\n')}

Prizes are non-transferable and non-redeemable for cash unless permitted by the Sponsor. All taxes and expenses related to the prize are the responsibility of the Winner.`,

  winnerSelection: `Winner(s) will be selected ${configuration.winnerSelectionMethod}. Winners will be notified within ${configuration.notificationTimeframeDays} ${pluralize('day', configuration.notificationTimeframeDays)} using the contact information provided. Winners must claim their prize within ${configuration.claimDeadlineDays} ${pluralize('day', configuration.claimDeadlineDays)} or an alternate winner may be chosen.`,

  odds: `The odds of winning depend on the number of eligible entries received.`,

  rights: `By entering, participants grant the Sponsor rights to use their name, likeness, and submitted content for promotional purposes in any medium, without further compensation, unless prohibited by law.
Participants affirm that their entry is their own original work and does not infringe on the rights of others.`,

  liability: `Sponsor is not responsible for:
- Technical malfunctions, network failures, or lost entries
- Unauthorized human or automated intervention
- Errors in administration or prize delivery
- Circumstances beyond Sponsor's control

By entering, participants release and hold harmless the Sponsor and its affiliates from liability arising from participation or prize use.`,

  disputes: `This Promotion is governed by the laws of ${configuration.governingLawCountry}. All disputes shall be resolved individually (not as part of a class action) and exclusively in the courts located in ${configuration.governingLawCountry}.`,

  platformDisclaimer: `This Promotion is not sponsored, endorsed, or administered by any social media platform, including but not limited to Facebook, Instagram, Twitter (X), YouTube, or Reddit. You are providing your information to the Sponsor.`,

  privacy: `Your information is governed by our privacy policy (https://giveaway.dog/privacy)${configuration.privacyPolicyUrl ? `, and the Sponsor privacy policy (${configuration.privacyPolicyUrl})` : '.'} `,

  winnersList: `To obtain a list of winners, contact the Sponsor within four (4) weeks of the campaign's end date.`,

  additionalTerms: configuration.additionalTerms || '',

  agreementToRules: `By entering, you accept these Official Rules and agree to be bound by them, including all eligibility requirements and Sponsor decisions, which are final.`,

  termsAndConditions: `Sponsor reserves the right to cancel, modify, or suspend the Promotion in the event of fraud, technical failure, or any other factor beyond its reasonable control. Sponsor may disqualify any participant found violating these terms.`
});

export const defaultTermInputOptions: GiveawayTermsTemplateInputSchema = {
  sponsorName: '<Sponsor Name>',
  sponsorAddress: '<Sponsor Address>',
  winnerSelectionMethod: 'Randomly Draw',
  notificationTimeframeDays: 7,
  claimDeadlineDays: 7,
  governingLawCountry: 'USA',
  privacyPolicyUrl: '',
  additionalTerms: ''
};

export const defaultTermOptions: SweepstakesTermOptions = {
  sweepstakesName: '<Sweepstakes Name>',
  eligibilityRegions: '<Eligibility Regions>',
  startDate: '<Tuesday>',
  endDate: '<Thursday>',
  entryUrl: toBrowsePageUrl(`abc123`),
  prizes: [],
  ...defaultTermInputOptions
};

export const stringifyTerms = (
  options: SweepstakesTermOptions = defaultTermOptions
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
