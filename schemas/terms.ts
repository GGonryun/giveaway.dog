type SweepstakesTerms = {
  sponsorName: string;
  giveawayName: string;
  entryUrl: string;
  eligibilityAge: number;
  eligibilityRegions: string;
  startDate: string; // ISO or human-readable
  endDate: string;
  maxEntriesPerUser: number;
  prizes: string[];
  winnerCount: number;
} & UserInputSweepstakesTerms;

type UserInputSweepstakesTerms = {
  sponsorName: string;
  sponsorAddress: string;
  winnerSelectionMethod: string;
  notificationTimeframeDays: number;
  claimDeadlineDays: number;
  jurisdiction: string;
  privacyPolicy: string;
  additionalTerms: string;
};

export function generateSweepstakesTerms(terms: SweepstakesTerms): string {
  return `
  OFFICIAL RULES - ${terms.giveawayName}

  NO PURCHASE IS NECESSARY TO ENTER OR WIN. A PURCHASE DOES NOT INCREASE YOUR CHANCES OF WINNING.

  1. Sponsor
  The Sweepstakes (“Promotion”) is sponsored by ${terms.sponsorName} (“Sponsor”)${terms.sponsorAddress ? `,located at ${terms.sponsorAddress}` : ''}. For inquiries or winner requests, contact the Sponsor.

  2. Eligibility
  The Promotion is open ${terms.eligibilityRegions} to individuals ${terms.eligibilityAge}+ years of age, unless restricted by local law. Employees, contractors, and affiliates of the Sponsor are not eligible.

  3. Entry Period
  The Promotion begins on ${terms.startDate} and ends on ${terms.endDate}. Entries outside this period will not be accepted.

  4. How to Enter
  Enter via ${terms.entryUrl}. Limit ${terms.maxEntriesPerUser} entries per person. Automated or fraudulent entries are prohibited.

  5. Prizes
  ${terms.winnerCount} winner(s) will receive:
  ${terms.prizes.map((p, i) => `   - ${p}`).join('\n')}

  6. Winner Selection & Notification
  Winner(s) will be selected by ${terms.winnerSelectionMethod}. Winners will be notified within ${terms.notificationTimeframeDays} days. Prizes must be claimed within ${terms.claimDeadlineDays} days, or an alternate winner may be chosen.

  7. Odds
  Odds depend on the number of eligible entries received.

  8. Rights Granted
  By entering, participants grant the Sponsor rights to use their name and likeness for promotional purposes, unless prohibited by law.

  9. Limitation of Liability
  Sponsor is not responsible for technical issues, lost entries, or circumstances beyond its control. By entering, participants release the Sponsor from liability.

  10. Governing Law
  This Promotion is governed by the laws of ${terms.jurisdiction}. All disputes will be handled in the courts of that jurisdiction.

  11. Social Media Disclaimer
  This Promotion is not sponsored or endorsed by any social media platform used for entry.

  12. Your information is governed by our privacy policy (https://giveaway.dog/privacy)${terms.privacyPolicy ? `, and the Sponsor privacy policy (${terms.privacyPolicy})` : '.'} 

  ${
    terms.additionalTerms
      ? `
  13. Additional Terms
  ${terms.additionalTerms}`
      : ''
  }

  By entering, you accept these Official Rules.
  `;
}
