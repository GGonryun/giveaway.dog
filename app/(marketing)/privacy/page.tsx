import { Typography } from '@/components/ui/typography';

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
          Last updated: Sun, Aug 10, 2025
        </Typography.Paragraph>
      </div>

      <div className="prose prose-lg max-w-none">
        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          1. Information We Collect
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          We collect information you provide directly to us, such as when you
          create an account, set up a giveaway, or contact us for support. This
          includes your name, email address, payment information, and any
          content you create using our platform.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          2. How We Use Your Information
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          We use the information we collect to provide, maintain, and improve
          our services, process transactions, communicate with you, and ensure
          the security and integrity of our platform. We may also use your
          information to send you updates about new features or promotional
          content, which you can opt out of at any time.
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
        <Typography.Paragraph className="mb-6">
          We retain your personal information for as long as your account is
          active or as needed to provide you services. We may also retain
          certain information as required by law, for legitimate business
          purposes, or to resolve disputes and enforce our agreements.
        </Typography.Paragraph>

        <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
          8. Your Rights and Choices
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          You have the right to access, update, or delete your personal
          information. You can also opt out of promotional communications and
          control certain privacy settings through your account dashboard. If
          you wish to delete your account, please contact our support team.
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
          10. International Data Transfers
        </Typography.Header>
        <Typography.Paragraph className="mb-6">
          Your information may be transferred to and processed in countries
          other than your own. We ensure that such transfers comply with
          applicable data protection laws and that appropriate safeguards are in
          place to protect your personal information.
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
