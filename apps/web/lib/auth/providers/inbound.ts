import { newEmailClient, NO_REPLY_EMAIL } from '@giveaway/email/client';
import { getMagicLinkEmailContent } from '@giveaway/email/templates';

export const InboundEmailProvider = ({ secret }: { secret?: string }) => {
  const sendVerificationRequest = async ({
    identifier: email,
    url
  }: {
    identifier: string;
    url: string;
  }) => {
    const client = newEmailClient({ secret });

    try {
      const result = await client.send({
        from: NO_REPLY_EMAIL,
        to: email,
        ...getMagicLinkEmailContent({ url })
      });

      console.info('Email sent successfully!');
      console.info('Email ID:', result.id);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  return {
    id: 'email',
    name: 'Email',
    type: 'email',
    maxAge: 60 * 60 * 24, // Email link will expire in 24 hours
    sendVerificationRequest
  } as const;
};
