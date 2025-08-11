import { Typography } from '@/components/ui/typography';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
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
            By accessing and using Giveaway.dog, you accept and agree to be
            bound by the terms and provision of this agreement. These Terms and
            Conditions govern your use of our service and constitute a legally
            binding agreement between you and Giveaway.dog.
          </Typography.Paragraph>

          <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
            2. Description of Service
          </Typography.Header>
          <Typography.Paragraph className="mb-6">
            Giveaway.dog is a platform that allows users to create, manage, and
            run giveaways and contests. Our service operates on a
            pay-per-giveaway model where users receive 10 free giveaways and can
            purchase additional giveaway packages as needed.
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
            Our pricing model is pay-per-giveaway. Every account includes 10
            free giveaways with all premium features. Additional giveaway
            packages can be purchased as needed. All payments are processed
            securely through our payment providers. Refunds may be available in
            accordance with our refund policy.
          </Typography.Paragraph>

          <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
            5. User Content and Conduct
          </Typography.Header>
          <Typography.Paragraph className="mb-6">
            You retain ownership of content you create using our service.
            However, you grant us a license to use, store, and display your
            content as necessary to provide our services. You agree not to use
            our service for any illegal, harmful, or offensive purposes,
            including but not limited to fraud, spam, or harassment.
          </Typography.Paragraph>

          <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
            6. Prohibited Activities
          </Typography.Header>
          <Typography.Paragraph className="mb-6">
            Users are prohibited from: creating fake or fraudulent giveaways,
            manipulating entry methods, violating any applicable laws or
            regulations, infringing on intellectual property rights, or
            attempting to harm or exploit other users or our platform.
          </Typography.Paragraph>

          <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
            7. Intellectual Property
          </Typography.Header>
          <Typography.Paragraph className="mb-6">
            The Giveaway.dog platform, including its design, functionality, and
            content, is protected by intellectual property laws. You may not
            copy, modify, or distribute our platform without explicit
            permission. All trademarks and logos are property of their
            respective owners.
          </Typography.Paragraph>

          <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
            8. Privacy and Data Protection
          </Typography.Header>
          <Typography.Paragraph className="mb-6">
            Your privacy is important to us. Our collection and use of personal
            information is governed by our Privacy Policy, which is incorporated
            by reference into these Terms. By using our service, you consent to
            the collection and use of your information as described in our
            Privacy Policy.
          </Typography.Paragraph>

          <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
            9. Limitation of Liability
          </Typography.Header>
          <Typography.Paragraph className="mb-6">
            To the maximum extent permitted by law, Giveaway.dog shall not be
            liable for any indirect, incidental, special, consequential, or
            punitive damages, including without limitation, loss of profits,
            data, use, goodwill, or other intangible losses resulting from your
            use of our service.
          </Typography.Paragraph>

          <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
            10. Service Availability
          </Typography.Header>
          <Typography.Paragraph className="mb-6">
            While we strive to maintain high service availability, we do not
            guarantee that our service will be uninterrupted or error-free. We
            reserve the right to modify, suspend, or discontinue our service at
            any time with reasonable notice to users.
          </Typography.Paragraph>

          <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
            11. Termination
          </Typography.Header>
          <Typography.Paragraph className="mb-6">
            Either party may terminate this agreement at any time. We may
            suspend or terminate your account if you violate these terms. Upon
            termination, your right to use our service ceases immediately,
            though certain provisions of these terms will survive termination.
          </Typography.Paragraph>

          <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
            12. Changes to Terms
          </Typography.Header>
          <Typography.Paragraph className="mb-6">
            We reserve the right to modify these Terms and Conditions at any
            time. We will notify users of significant changes via email or
            platform notifications. Continued use of our service after changes
            constitutes acceptance of the new terms.
          </Typography.Paragraph>

          <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
            13. Governing Law
          </Typography.Header>
          <Typography.Paragraph className="mb-6">
            These Terms and Conditions are governed by and construed in
            accordance with applicable laws. Any disputes arising from these
            terms will be resolved through binding arbitration in accordance
            with established arbitration rules.
          </Typography.Paragraph>

          <Typography.Header level={2} className="text-2xl font-bold mb-4 mt-8">
            14. Contact Information
          </Typography.Header>
          <Typography.Paragraph className="mb-6">
            If you have any questions about these Terms and Conditions, please
            contact us at legal@giveaway.dog or through our support channels
            available on the platform.
          </Typography.Paragraph>
        </div>
      </div>
    </div>
  );
}
