import 'server-only';

import Inbound from 'inboundemail';

export const newEmailClient = ({ secret }: { secret?: string }) => {
  if (!secret) {
    throw new Error('InboundEmailProvider requires a secret');
  }
  const inbound = new Inbound({
    apiKey: secret
  });

  return {
    send: (options: Inbound.Emails.EmailSendParams) =>
      inbound.emails.send(options)
  };
};

export const NO_REPLY_EMAIL = 'noreply@giveaway.dog';
