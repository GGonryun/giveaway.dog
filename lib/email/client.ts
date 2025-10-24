import InboundEmailClient, { PostEmailsRequest } from '@inboundemail/sdk';

export const newEmailClient = ({ secret }: { secret?: string }) => {
  if (!secret) {
    throw new Error('InboundEmailProvider requires a secret');
  }
  const inbound = new InboundEmailClient(secret);

  return {
    send: (options: PostEmailsRequest) => inbound.emails.send(options)
  };
};

export const NO_REPLY_EMAIL = 'noreply@giveaway.dog';
