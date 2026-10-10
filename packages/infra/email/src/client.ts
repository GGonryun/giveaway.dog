import 'server-only';

import Inbound from 'inboundemail';
import { isE2eFakeOn } from '@giveaway/e2e-fakes/switch';
import { recordE2eOutbox } from '@giveaway/e2e-fakes/outbox';
import { isE2eEmail } from '@giveaway/e2e-model/personas';

type EmailSendParams = Inbound.Emails.EmailSendParams;
type EmailSendResponse = Inbound.Emails.EmailSendResponse;

const newInboundClient = (secret?: string) => {
  if (!secret) {
    throw new Error('InboundEmailProvider requires a secret');
  }
  const inbound = new Inbound({
    apiKey: secret
  });

  return {
    send: (options: EmailSendParams) => inbound.emails.send(options)
  };
};

const toRecipients = (to: EmailSendParams['to']) =>
  Array.isArray(to) ? to : [to];

const captureE2eEmail = async (
  options: EmailSendParams
): Promise<EmailSendResponse | undefined> => {
  const recipients = toRecipients(options.to);
  if (recipients.length === 0 || !recipients.every(isE2eEmail)) {
    return undefined;
  }

  const entries = [];
  for (const recipient of recipients) {
    entries.push(
      await recordE2eOutbox({
        channel: 'email',
        target: recipient,
        payload: {
          from: options.from,
          to: recipient,
          subject: options.subject,
          html: options.html,
          text: options.text
        }
      })
    );
  }
  return { id: entries[0].id, status: 'sent' };
};

export const newEmailClient = ({ secret }: { secret?: string }) => {
  if (!isE2eFakeOn('email')) {
    return newInboundClient(secret);
  }

  return {
    send: async (options: EmailSendParams) =>
      (await captureE2eEmail(options)) ?? newInboundClient(secret).send(options)
  };
};

export const NO_REPLY_EMAIL = 'noreply@giveaway.dog';
