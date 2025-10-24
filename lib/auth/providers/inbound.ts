import { newEmailClient, NO_REPLY_EMAIL } from '@/lib/email/client';
import { getMagicLinkEmailContent } from '@/lib/email/templates';

export const InboundEmailProvider = ({ secret }: { secret?: string }) => {
  const sendVerificationRequest = async ({
    identifier: email,
    url
  }: {
    identifier: string;
    url: string;
  }) => {
    const client = newEmailClient({ secret });

    const result = await client.send({
      from: NO_REPLY_EMAIL,
      to: email,
      ...getMagicLinkEmailContent({ url })
    });

    if (result.error) {
      console.error('Failed to send email:', result.error);
    } else {
      console.log('Email sent successfully!');
      console.log('Email ID:', result.data?.id);
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
