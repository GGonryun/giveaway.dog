export interface VerificationEmailOptions {
  url: string;
  name?: string;
}

export const getVerificationEmailHTML = ({
  url,
  name
}: VerificationEmailOptions): string => {
  const recipientName = name ? `Hello ${name},` : 'Hello';
  return `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; color: #333; background: #fafafa; padding: 20px;">
      <table style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 10px; padding: 24px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
        <tr>
          <td style="text-align: center;">
            <h1 style="color: #222; margin-bottom: 16px;">🐶 ${recipientName} from <span style="color:#ff7b00;">Giveaway.Dog</span>!</h1>
            <p style="font-size: 16px; line-height: 1.5;">
              Please verify your email address by clicking the button below.
            </p>
            <p style="margin: 24px 0;">
              <a href="${url}" 
                 style="background-color:#ff7b00; color:#fff; padding:12px 24px; text-decoration:none; border-radius:8px; font-weight:bold; display:inline-block;">
                Verify Email
              </a>
            </p>
            <p style="font-size: 13px; color:#666;">
              Or copy and paste this link into your browser:<br>
              <a href="${url}" style="color:#ff7b00; word-break:break-all;">${url}</a>
            </p>
            <p style="font-size: 13px; color:#999; margin-top: 24px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};

export const getVerificationEmailText = ({
  url,
  name
}: VerificationEmailOptions): string => {
  const recipientName = name ? `Hello ${name}!` : 'Hello!';
  return `${recipientName} 🐶

Please verify your email address by visiting the link below:
${url}

If you didn't request this, you can safely ignore this message.
`;
};

export const getVerificationEmailContent = (
  options: VerificationEmailOptions
) => ({
  subject: 'Verify your email - Giveaway.Dog',
  html: getVerificationEmailHTML(options),
  text: getVerificationEmailText(options)
});

export interface MagicLinkEmailOptions {
  url: string;
  name?: string;
}

export const getMagicLinkEmailHTML = ({
  url,
  name
}: MagicLinkEmailOptions): string => {
  const recipientName = name ? `Hey ${name},` : 'Hey there,';
  return `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; color: #333; background: #fafafa; padding: 20px;">
      <table style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 10px; padding: 24px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
        <tr>
          <td style="text-align: center;">
            <h1 style="color: #222; margin-bottom: 16px;">🐶 ${recipientName}</h1>
            <p style="font-size: 16px; line-height: 1.5;">
              Use the button below to sign in to your <strong style="color:#ff7b00;">Giveaway.Dog</strong> account.
            </p>
            <p style="margin: 24px 0;">
              <a href="${url}" 
                 style="background-color:#ff7b00; color:#fff; padding:12px 24px; text-decoration:none; border-radius:8px; font-weight:bold; display:inline-block;">
                Sign In to Giveaway.Dog
              </a>
            </p>
            <p style="font-size: 13px; color:#666;">
              Or copy and paste this link into your browser:<br>
              <a href="${url}" style="color:#ff7b00; word-break:break-all;">${url}</a>
            </p>
            <p style="font-size: 13px; color:#999; margin-top: 24px;">
              This link will expire soon and can only be used once for security reasons.
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};

export const getMagicLinkEmailText = ({
  url,
  name
}: MagicLinkEmailOptions): string => {
  const recipientName = name ? `Hey ${name}!` : 'Hey there!';
  return `${recipientName} 🐶

Use the link below to sign in to your Giveaway.Dog account:
${url}

This link will expire soon and can only be used once for security reasons.`;
};

export const getMagicLinkEmailContent = (options: MagicLinkEmailOptions) => ({
  subject: 'Your Magic Sign-In Link ✨ - Giveaway.Dog',
  html: getMagicLinkEmailHTML(options),
  text: getMagicLinkEmailText(options)
});

export interface PickerProcessedEmailOptions {
  pickerName: string;
  eligibleParticipants: number;
  totalParticipants: number;
  verificationUrl: string;
  name?: string;
}

export const getPickerProcessedEmailHTML = ({
  pickerName,
  eligibleParticipants,
  totalParticipants,
  verificationUrl,
  name
}: PickerProcessedEmailOptions): string => {
  const recipientName = name ? `Hey ${name},` : 'Hey there,';
  return `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; color: #333; background: #fafafa; padding: 20px;">
      <table style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 10px; padding: 24px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
        <tr>
          <td style="text-align: center;">
            <h1 style="color: #222; margin-bottom: 16px;">🎉 ${recipientName}</h1>
            <p style="font-size: 18px; line-height: 1.5; font-weight: bold; color: #ff7b00;">
              Your picker is ready!
            </p>
            <h2 style="color: #333; margin: 16px 0; font-size: 20px;">
              "${pickerName}"
            </h2>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: left;">
              <p style="margin: 8px 0; font-size: 15px;">
                <strong>📊 Total Participants:</strong> ${totalParticipants}
              </p>
              <p style="margin: 8px 0; font-size: 15px;">
                <strong>✅ Eligible Participants:</strong> ${eligibleParticipants}
              </p>
            </div>
            <p style="font-size: 16px; line-height: 1.6; margin: 24px 0;">
              All participants have been processed and verified!<br>
              <strong>You're now ready to select and notify the winners.</strong>
            </p>
            <p style="margin: 24px 0;">
              <a href="${verificationUrl}"
                 style="background-color:#ff7b00; color:#fff; padding:14px 28px; text-decoration:none; border-radius:8px; font-weight:bold; display:inline-block; font-size: 16px;">
                Select Winners
              </a>
            </p>
            <p style="font-size: 14px; color:#666; margin: 24px 0;">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color:#ff7b00; word-break:break-all; font-size: 13px;">${verificationUrl}</a>
            </p>
            <div style="border-top: 1px solid #e0e0e0; margin-top: 32px; padding-top: 20px;">
              <p style="font-size: 13px; color:#999; margin: 8px 0;">
                <strong>Next Steps:</strong>
              </p>
              <ol style="font-size: 13px; color:#666; text-align: left; padding-left: 20px; line-height: 1.6;">
                <li>Click the button above to go to your giveaway</li>
                <li>Review the eligible participants</li>
                <li>Select the number of winners to draw</li>
                <li>Share the results with participants</li>
              </ol>
            </div>
            <p style="font-size: 12px; color:#999; margin-top: 24px;">
              Powered by <strong style="color:#ff7b00;">Giveaway.Dog</strong> 🐶
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};

export const getPickerProcessedEmailText = ({
  pickerName,
  eligibleParticipants,
  totalParticipants,
  verificationUrl,
  name
}: PickerProcessedEmailOptions): string => {
  const recipientName = name ? `Hey ${name}!` : 'Hey there!';
  return `${recipientName} 🎉

Your picker is ready: "${pickerName}"

PROCESSING COMPLETE
==================
📊 Total Participants: ${totalParticipants}
✅ Eligible Participants: ${eligibleParticipants}

All participants have been processed and verified!
You're now ready to select and notify the winners.

SELECT WINNERS
==============
Click the link below to select your winners:
${verificationUrl}

NEXT STEPS
==========
1. Review the eligible participants
2. Select the number of winners to draw
3. Share the results with participants

---
Powered by Giveaway.Dog 🐶
`;
};

export const getPickerProcessedEmailContent = (
  options: PickerProcessedEmailOptions
) => ({
  subject: `🎉 Your picker "${options.pickerName}" is ready! - Giveaway.Dog`,
  html: getPickerProcessedEmailHTML(options),
  text: getPickerProcessedEmailText(options)
});
