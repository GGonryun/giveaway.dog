'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@giveaway/ui-primitives/accordion';
import { MarketingPageHeader } from './marketing/marketing-page-header';

const faqs = [
  {
    question: 'Why switch from Gleam or SocialMan?',
    answer:
      "Same core features, 1/10th the price, actually simple to use. Tools like Gleam and SocialMan charge $50-$500/month and nickel-and-dime you for features most people never use. Giveaway.dog focuses on what matters: running fair, verified giveaways across all major platforms. No bloated dashboards, no enterprise features you don't need, no paying extra for basic functionality. Just connect your accounts, create your giveaway, and launch in minutes. Plus you get human support from our team instead of waiting days for ticket responses."
  },
  {
    question: 'What social platforms do you support?',
    answer:
      'We support Twitter/X, Bluesky, Twitch, TikTok, Kick, Facebook, Snapchat, Threads, LinkedIn, Pinterest, Reddit, Instagram, YouTube, Discord, Tumblr, GitHub, Google, Patreon, Product Hunt, Coinbase, Spotify, and Steam. More platforms are added regularly based on user feedback.'
  },
  {
    question: 'How many giveaways can I create?',
    answer:
      'On the Creator plan, you can run unlimited giveaways with basic features. Pro plan users get access to advanced features like custom branding, priority support, and advanced analytics for all their giveaways.'
  },
  {
    question: 'What is an entry method?',
    answer:
      'An entry method is an action participants must complete to enter your giveaway, such as following your account, liking a post, retweeting, joining a Discord server, or subscribing to your channel. You can combine multiple entry methods to maximize engagement.'
  },
  {
    question: 'Can I require multiple entry methods for one giveaway?',
    answer:
      'Yes! You can create giveaways with multiple entry methods. For example, you could require participants to follow your Twitter account AND join your Discord server to enter. This helps you grow across multiple platforms simultaneously.'
  },
  {
    question: 'How many entries can a giveaway receive?',
    answer:
      'There is no limit to the number of entries your giveaways can receive. Our platform scales automatically to handle giveaways of any size, from small community events to viral campaigns with hundreds of thousands of participants.'
  },
  {
    question: 'Will my giveaways get flagged by social platforms?',
    answer:
      "No. Giveaway.dog follows all platform guidelines and terms of service. Our entry verification happens on our platform, not through automated actions on social media, ensuring your giveaways comply with each platform's policies."
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes, absolutely. You can cancel your Pro subscription at any time from your account settings. Your access will continue until the end of your current billing period, and you can always resubscribe later if needed.'
  },
  {
    question: 'Can I get a refund?',
    answer:
      "We offer a satisfaction-based money-back guarantee for Pro plan subscriptions. If you're not satisfied with Giveaway.dog for any reason within the first 30 days of any month, contact our support team for a full refund."
  },
  {
    question: 'Do I need to share my social media passwords with you?',
    answer:
      "No, never. We use OAuth authentication, which means you authorize our app through the official platform APIs without ever sharing your passwords with us. You can revoke access at any time from your social platform's settings."
  },
  {
    question: 'I have another question',
    answer:
      "We're here to help! Contact our support team at support@giveaway.dog or use the chat widget in the bottom right corner. We typically respond within 24 hours (usually much faster)."
  }
];

export function FaqSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <MarketingPageHeader
            title="Frequently Asked Questions"
            description="Everything you need to know about Giveaway.dog"
          />

          <div className="mt-12">
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
      </div>
    </section>
  );
}
