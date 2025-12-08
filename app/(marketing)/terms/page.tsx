import { Typography } from '@/components/ui/typography';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Giveaway.dog',
  description:
    'Read our terms of service to understand the rules, guidelines, and legal agreements for using the Giveaway.dog platform.'
};

export default function TermsPage() {
  return (
    <div className="container py-8 md:py-16">
      <div className="text-center mb-8 md:mb-12">
        <Typography.Header
          level={1}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
        >
          Terms and Conditions
        </Typography.Header>
        <Typography.Paragraph className="text-lg text-muted-foreground">
          Last updated: Sun, Aug 10, 2025
        </Typography.Paragraph>
      </div>

      <div className="prose prose-lg max-w-none">
        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          1. Acceptance of Terms
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          By accessing and using Giveaway.dog, you accept and agree to be bound
          by the terms and provision of this agreement. These Terms and
          Conditions govern your use of our service and constitute a legally
          binding agreement between you and Giveaway.dog.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          2. Description of Service
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          Giveaway.dog is a platform that allows users to create, manage, and
          run giveaways and contests. Our service operates on a pay-per-giveaway
          model where users receive 10 free giveaways and can purchase
          additional giveaway packages as needed.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          3. User Accounts and Registration
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          To use our service, you must create an account by providing accurate
          and complete information. You are responsible for maintaining the
          confidentiality of your account credentials and for all activities
          that occur under your account. You must immediately notify us of any
          unauthorized use of your account.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          4. Payment Terms
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          Our pricing model is pay-per-giveaway. Every account includes 10 free
          giveaways with all premium features. Additional giveaway packages can
          be purchased as needed. All payments are processed securely through
          our payment providers. Refunds may be available in accordance with our
          refund policy.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          5. User Content and Conduct
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          You retain ownership of content you create using our service. However,
          you grant us a license to use, store, and display your content as
          necessary to provide our services. You agree not to use our service
          for any illegal, harmful, or offensive purposes, including but not
          limited to fraud, spam, or harassment.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          6. Prohibited Activities
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          Users are prohibited from: creating fake or fraudulent giveaways,
          manipulating entry methods, violating any applicable laws or
          regulations, infringing on intellectual property rights, or attempting
          to harm or exploit other users or our platform.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          7. Mature and Explicit Content Policy
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          Giveaway.dog is committed to providing a safe and appropriate
          environment for all users, including minors. To protect underage users
          from exposure to inappropriate material, we have established strict
          policies regarding mature and explicit content.
        </Typography.Paragraph>
        <Typography.Paragraph className="mb-6">
          <strong>Public Giveaways:</strong> We do not permit public giveaways
          that promote, feature, or are associated with mature or explicit
          content. This includes, but is not limited to: adult-oriented material,
          sexually explicit content, graphic violence, excessive profanity, drug
          or alcohol-related promotions targeted at minors, gambling or
          casino-related content, or any other material deemed inappropriate for
          users under 18 years of age. Public giveaways must be suitable for all
          audiences and comply with applicable content rating standards.
        </Typography.Paragraph>
        <Typography.Paragraph className="mb-6">
          <strong>Private Giveaways with Mature Content:</strong> Giveaways
          containing mature or explicit content may only be run as private
          giveaways and must be clearly marked with a &quot;mature&quot; content
          filter. When creating such giveaways, hosts are required to: (a) enable
          the mature content designation, (b) ensure the giveaway is set to
          private visibility only, (c) provide accurate age-gating mechanisms, and
          (d) include clear warnings about the nature of the content. This policy
          extends to all aspects of the giveaway, including prizes, promotional
          materials, and any required actions for entry. If a required action for
          entry involves viewing, sharing, or interacting with content that is
          rated 18+ or contains mature themes, the entire giveaway must be
          designated as mature content and restricted to private visibility.
        </Typography.Paragraph>
        <Typography.Paragraph className="mb-6">
          By enabling the mature content filter, giveaway hosts acknowledge that
          their giveaway contains material that is not suitable for minors and
          agree to implement safeguards to prevent underage participation. The
          mature filter automatically restricts access to users who have verified
          they are 18 years of age or older. Circumventing or attempting to bypass
          these age restrictions is strictly prohibited and may result in
          immediate account termination.
        </Typography.Paragraph>
        <Typography.Paragraph className="mb-6">
          Giveaway.dog reserves the right to review any giveaway flagged as
          potentially containing mature content and may require hosts to enable
          the mature filter or remove content that violates this policy. Failure
          to properly designate mature content, attempting to run public giveaways
          with mature themes, or knowingly allowing underage access to
          age-restricted giveaways will result in: removal of the giveaway,
          suspension or permanent termination of your account, forfeiture of any
          unused giveaway credits, and potential reporting to appropriate
          authorities if illegal content is involved.
        </Typography.Paragraph>
        <Typography.Paragraph className="mb-6">
          Users who encounter giveaways that appear to violate our mature content
          policy should report them immediately through our reporting system. We
          take all reports seriously and will investigate promptly to ensure
          compliance with this policy and applicable laws protecting minors.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          8. User Quality Scoring and Eligibility
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          To maintain the integrity of our platform and ensure fair giveaways,
          Giveaway.dog employs an automated user quality scoring system that
          monitors participant behavior and activity patterns. This system
          evaluates various metrics including but not limited to: device usage
          patterns, login frequency, account age, verification status, task
          completion behavior, and potential fraud indicators.
        </Typography.Paragraph>
        <Typography.Paragraph className="mb-6">
          Users who exhibit suspicious tendencies, fraudulent behavior, or
          patterns consistent with bot activity may receive a low quality score.
          Based on this scoring system, giveaway hosts have the option to
          automatically revoke eligibility from users with low quality scores,
          disqualify suspicious entries, or exclude participants who fail to
          meet minimum quality thresholds. This automated system operates
          continuously and decisions may be made without prior notice.
        </Typography.Paragraph>
        <Typography.Paragraph className="mb-6">
          Quality scores are calculated using proprietary algorithms that
          analyze user activity over time. Users agree that participation in
          giveaways may be restricted or revoked based on these quality
          assessments. While we strive for accuracy, the scoring system is
          automated and may occasionally produce false positives. Users who
          believe they have been incorrectly flagged may contact support for
          review, though we reserve the right to make final determinations
          regarding account quality and eligibility.
        </Typography.Paragraph>
        <Typography.Paragraph className="mb-6">
          By using our platform, you acknowledge and agree that: (a) your
          activity is monitored and scored, (b) low quality scores may result in
          automatic disqualification from giveaways, (c) giveaway hosts may set
          minimum quality requirements for participation, and (d) Giveaway.dog
          is not liable for any losses resulting from eligibility restrictions
          based on quality scores.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          9. Intellectual Property
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          The Giveaway.dog platform, including its design, functionality, and
          content, is protected by intellectual property laws. You may not copy,
          modify, or distribute our platform without explicit permission. All
          trademarks and logos are property of their respective owners.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          10. Privacy and Data Protection
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          Your privacy is important to us. Our collection and use of personal
          information is governed by our Privacy Policy, which is incorporated
          by reference into these Terms. By using our service, you consent to
          the collection and use of your information as described in our Privacy
          Policy.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          11. Limitation of Liability
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          To the maximum extent permitted by law, Giveaway.dog shall not be
          liable for any indirect, incidental, special, consequential, or
          punitive damages, including without limitation, loss of profits, data,
          use, goodwill, or other intangible losses resulting from your use of
          our service.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          12. Service Availability
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          While we strive to maintain high service availability, we do not
          guarantee that our service will be uninterrupted or error-free. We
          reserve the right to modify, suspend, or discontinue our service at
          any time with reasonable notice to users.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          13. Termination
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          Either party may terminate this agreement at any time. We may suspend
          or terminate your account if you violate these terms. Upon
          termination, your right to use our service ceases immediately, though
          certain provisions of these terms will survive termination.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          14. Changes to Terms
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          We reserve the right to modify these Terms and Conditions at any time.
          We will notify users of significant changes via email or platform
          notifications. Continued use of our service after changes constitutes
          acceptance of the new terms.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          15. Governing Law
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          These Terms and Conditions are governed by and construed in accordance
          with applicable laws. Any disputes arising from these terms will be
          resolved through binding arbitration in accordance with established
          arbitration rules.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          16. Contact Information
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          If you have any questions about these Terms and Conditions, please
          contact us at legal@giveaway.dog or through our support channels
          available on the platform.
        </Typography.Paragraph>
      </div>
    </div>
  );
}
