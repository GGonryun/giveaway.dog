'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';
import { PUBLIC_PICKER_MAX_WINNERS } from '../constants';

const faqs = [
  {
    question: 'How are winners selected from X retweets?',
    answer:
      'Winners are selected using a cryptographically secure random number generator. Every participant who retweeted your post and meets your filter criteria has an equal chance of winning. The selection process is completely transparent and cannot be manipulated.'
  },
  {
    question: 'Can I filter participants by followers or account age?',
    answer:
      'Yes! You can set filters for minimum followers, minimum following count, account age in days, post count, and profile completeness requirements like having a profile image or bio. This helps ensure you select quality winners who are real, active accounts.'
  },
  {
    question: 'How many retweets can the picker handle?',
    answer:
      'Our picker can handle posts with up to 5,000 retweets. We automatically fetch and analyze retweeters to ensure accurate winner selection. For posts with more than 5,000 retweets, we sample a representative portion of participants to maintain fair and efficient winner selection.'
  },
  {
    question: 'Is the winner selection really random and fair?',
    answer:
      'Absolutely. We use industry-standard cryptographic algorithms to ensure true randomness. The selection process is deterministic and verifiable, meaning the same input will always produce the same random selection. This ensures fairness and transparency for both hosts and participants.'
  },
  {
    question: 'How many winners can I pick for free?',
    answer: `You can pick up to ${PUBLIC_PICKER_MAX_WINNERS} winners for free with our public picker tool. No account required, no credit card needed. For unlimited winners, advanced features, and saved history, upgrade to our Pro plan.`
  },
  {
    question: 'Do I need to connect my X account to use this?',
    answer:
      "No! Our public picker tool works without any authentication. Simply paste your post URL and we'll fetch the retweets. If you want to save your picks and access advanced features, you can create an account, but it's completely optional."
  }
];

export function PickerFaqSection() {
  return (
    <section className="w-full py-12">
      <div className="max-w-3xl mx-auto">
        <MarketingPageHeader
          title="Frequently Asked Questions"
          description="Common questions about our X giveaway picker tool"
        />

        <div className="mt-8">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer
              }
            }))
          })
        }}
      />
    </section>
  );
}
