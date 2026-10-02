import { Typography } from '@/components/ui/typography';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Giveaway.dog',
  description:
    'Read our privacy policy to learn how Giveaway.dog collects, uses, and protects your personal information when you use our giveaway hosting platform.'
};

export default function PrivacyPage() {
  return (
    <div className="container py-8 md:py-16">
      <div className="text-center mb-8 md:mb-12">
        <Typography.Header
          level={1}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
        >
          Privacy Policy
        </Typography.Header>
        <Typography.Paragraph className="text-lg text-muted-foreground">
          Last updated: Mon, Jan 6, 2026
        </Typography.Paragraph>
      </div>

      <div className="prose prose-lg max-w-none">
        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          1. Information We Collect
        </Typography.Header>
        <Typography.Paragraph className="mb-4">
          We collect various types of information in connection with the
          services we provide, including:
        </Typography.Paragraph>
        <Typography.Paragraph className="mb-4">
          <strong>Account Information:</strong> We collect information you
          provide directly to us when you create an account, set up a giveaway,
          or contact us for support. This includes your name, email address,
          payment information, and any content you create using our platform.
        </Typography.Paragraph>
        <Typography.Paragraph className="mb-4">
          <strong>Security and Fraud Prevention Information:</strong> To
          maintain the integrity and security of our platform, we automatically
          collect certain technical and security-related information, including
          but not limited to: (a) your IP address(es), both current and
          historical; (b) approximate geographic location derived from reverse
          IP geolocation, limited to regional identification; (c) browser
          fingerprinting data, which may include browser type and version,
          operating system, device characteristics, screen resolution, installed
          fonts, plugins, and other browser capabilities; and (d) device
          identifiers.
        </Typography.Paragraph>
        <Typography.Paragraph className="mb-6">
          This information is collected and processed exclusively for the
          following legitimate security purposes: verifying user authenticity,
          detecting and preventing fraudulent activity, protecting against spam
          and automated bot behavior, identifying multi-account abuse, and
          maintaining the overall integrity of our platform.{' '}
          <strong>
            We do not and will never sell this information to third parties, use
            it to create user profiles for advertising purposes, or employ it
            for any purpose other than fraud prevention and security
            verification.
          </strong>
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          2. How We Use Your Information
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          We use the information we collect to provide, maintain, and improve
          our services, process transactions, communicate with you, and ensure
          the security and integrity of our platform. Specifically, we use your
          information to: verify your identity and authenticate your account;
          detect, prevent, and investigate fraudulent activity, spam, bots,
          multi-account abuse, and other security threats; process your
          giveaways and transactions; provide customer support; analyze usage
          patterns to improve our services; and comply with legal obligations.
          We may also use your information to send you updates about new
          features or promotional content, which you can opt out of at any time.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          3. Information Sharing and Disclosure
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          We do not sell, trade, or otherwise transfer your personal information
          to third parties without your consent, except as described in this
          policy. We may share your information with service providers who
          assist us in operating our platform, conducting our business, or
          serving our users, provided they agree to keep this information
          confidential.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          4. Data Security
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          We implement appropriate security measures to protect your personal
          information against unauthorized access, alteration, disclosure, or
          destruction. This includes encryption, secure server environments, and
          regular security audits. However, no method of transmission over the
          internet is 100% secure.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          5. Cookies and Tracking Technologies
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          We use cookies and similar tracking technologies to enhance your
          experience on our platform, analyze usage patterns, and provide
          personalized content. You can control cookie settings through your
          browser preferences, though disabling certain cookies may affect the
          functionality of our service.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          6. Third-Party Services
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          Our platform may integrate with third-party services such as social
          media platforms, payment processors, and analytics providers. These
          services have their own privacy policies, and we encourage you to
          review them. We are not responsible for the privacy practices of these
          third-party services.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          7. Data Retention
        </Typography.Header>
        <Typography.Paragraph className="mb-4">
          We retain your personal information for as long as your account is
          active or as needed to provide you services. We may also retain
          certain information as required by law, for legitimate business
          purposes, or to resolve disputes and enforce our agreements.
        </Typography.Paragraph>
        <Typography.Paragraph className="mb-6">
          <strong>Security Data Retention:</strong> Security-related
          information, including IP addresses, browser fingerprints, and
          geolocation data, is retained for a period of ninety (90) days
          following your last account activity. This retention period allows us
          to effectively identify patterns of fraudulent behavior while
          minimizing unnecessary data storage. Security data may be retained for
          longer periods if required by law, necessary for active fraud
          investigations, or essential for resolving disputes or enforcing our
          Terms of Service. Upon expiration of the retention period, such data
          is automatically deleted from our systems unless subject to a legal
          hold or active investigation.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          8. Your Rights and Choices
        </Typography.Header>
        <Typography.Paragraph className="mb-4">
          You have the right to access, update, or delete your personal
          information. You can also opt out of promotional communications and
          control certain privacy settings through your account dashboard. If
          you wish to delete your account, please contact our support team.
        </Typography.Paragraph>
        <Typography.Paragraph className="mb-6">
          <strong>Rights Regarding Security Data:</strong> In addition to your
          general data rights, you have the right to: (a) access
          security-related data we have collected about your account; (b)
          request deletion of such data, subject to our legitimate security
          interests; and (c) receive an explanation of why specific security
          data is being retained if deletion is not immediately possible. Please
          note that requests to delete security data may be declined or delayed
          if your account is subject to an active security investigation, has
          been flagged for suspicious activity, or if deletion would compromise
          our ability to detect and prevent fraud. To exercise these rights,
          please contact us at privacy@giveaway.dog.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          9. Children's Privacy
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          Our service is not intended for children under the age of 13. We do
          not knowingly collect personal information from children under 13. If
          we discover that we have collected information from a child under 13,
          we will take steps to delete such information promptly.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          10. International Data Transfers and Regulatory Compliance
        </Typography.Header>
        <Typography.Paragraph className="mb-4">
          Your information may be transferred to and processed in countries
          other than your own. We ensure that such transfers comply with
          applicable data protection laws and that appropriate safeguards are in
          place to protect your personal information.
        </Typography.Paragraph>
        <Typography.Paragraph className="mb-6">
          <strong>GDPR and CCPA Compliance:</strong> We are committed to
          complying with the General Data Protection Regulation (GDPR) for users
          in the European Economic Area and the California Consumer Privacy Act
          (CCPA) for California residents. Under these regulations, you have
          enhanced rights including the right to access your personal
          information, the right to rectification, the right to erasure (right
          to be forgotten), the right to restrict processing, the right to data
          portability, and the right to object to processing. European users
          also have the right to lodge a complaint with a supervisory authority.
          California residents have the right to know what personal information
          is collected, to know whether personal information is sold or
          disclosed, to opt-out of the sale of personal information (note: we do
          not sell personal information), and to non-discrimination for
          exercising privacy rights. To exercise any of these rights, please
          contact us at privacy@giveaway.dog.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          11. Legal Compliance
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          We may disclose your information if required to do so by law or in
          response to valid requests by public authorities, such as a court
          order or government agency. We may also disclose information to
          protect our rights, property, or safety, or that of our users or
          others.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          12. Changes to This Privacy Policy
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          We may update this Privacy Policy from time to time to reflect changes
          in our practices or applicable laws. We will notify you of any
          material changes by posting the new policy on our platform and
          updating the "Last updated" date. Your continued use of our service
          constitutes acceptance of the updated policy.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          13. Contact Us
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          If you have any questions about this Privacy Policy or our privacy
          practices, please contact us at privacy@giveaway.dog or through our
          support channels. We will do our best to respond to your inquiries
          promptly and address any concerns you may have.
        </Typography.Paragraph>
      </div>
    </div>
  );
}
