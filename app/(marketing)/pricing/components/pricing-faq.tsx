import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';

const faqs = [
  {
    question: 'Do the 10 free giveaways expire?',
    answer: 'No! Your 10 free giveaways never expire. Use them whenever you\'re ready, whether that\'s next month or next year.'
  },
  {
    question: 'Are there any hidden fees?',
    answer: 'Absolutely not. We believe in transparent pricing. The only cost is our value packs when you need more than your 10 free giveaways. No setup fees, no monthly charges, no surprises.'
  },
  {
    question: 'What features are included?',
    answer: 'Everything! Unlike competitors who gate features behind premium tiers, every user gets access to all features including analytics, integrations, custom branding, and priority support.'
  },
  {
    question: 'Can I buy multiple packages?',
    answer: 'Yes! You can purchase multiple packages as needed. Giveaway credits never expire, so you can stock up when convenient and use them whenever you\'re ready to launch campaigns.'
  }
];

export function PricingFAQ() {
  return (
    <section className="mb-12 md:mb-16">
      <div className="text-center mb-8 md:mb-12">
        <Typography.Header
          level={2}
          className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4"
        >
          Frequently Asked Questions
        </Typography.Header>
      </div>

      <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
        {faqs.map((faq) => (
          <Card key={faq.question}>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">
                {faq.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Typography.Paragraph className="text-sm md:text-base text-muted-foreground">
                {faq.answer}
              </Typography.Paragraph>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}