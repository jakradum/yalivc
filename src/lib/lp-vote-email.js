// The Fund II term vote email (design approved 24 Nov 2026): a card per option, each
// with its own button. The buttons open yali.vc/fund-vote, where the LP confirms; opening
// the link records nothing (see src/lib/lp-vote.js). Table layout and inline styles so
// it renders in Outlook as well as Gmail and Apple Mail.
import { voteToken } from './lp-vote.js';

export const VOTE_EMAIL_FROM = 'Yali Investor Relations <noreply@yali.vc>';
export const VOTE_EMAIL_SUBJECT = 'Fund II terms: one quick vote';

// closes: how the closing date reads in the email, e.g. "5 December 2026".
export function voteEmail(email, { closes, base = 'https://yali.vc' }) {
  const token = voteToken(email);
  const link = (choice) => `${base}/fund-vote/?t=${token}&choice=${choice}`;
  const html = `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>Fund II terms: one quick vote</title>
<!--[if mso]><style>table,td,div,p,a,span{font-family:Arial,sans-serif !important;}</style><![endif]-->
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500&display=swap');
  body { margin: 0; padding: 0; background: #d0d0d0; }
  a { text-decoration: none; }
  @media (max-width: 600px) {
    .opt { padding: 0 0 12px !important; }
    .px { padding-left: 24px !important; padding-right: 24px !important; }
    .title { font-size: 24px !important; }
    .opt { display: block !important; width: 100% !important; }
    .gap { display: block !important; width: 100% !important; height: 12px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#d0d0d0;">
<!-- Preheader (inbox preview line), hidden in the body -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#d0d0d0;">Which fund term do you prefer for Fund II: 10 + 1 + 1 or 12 + 1 + 1?&#8202;&#847;&#8202;&#847;&#8202;&#847;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#d0d0d0;">
<tr><td align="center" style="padding:40px 16px;">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#efefef;">

    <!-- Hero -->
    <tr><td class="px" style="background:#830d35;padding:44px 40px 40px;">
      <img src="https://www.yali.vc/email/yali-monogram-white.png" alt="Yali Capital" width="31" height="40" style="display:block;width:31px;height:40px;border:0;margin:0 0 28px;">
      <div class="title" style="font-family:'JetBrains Mono',Consolas,monospace;font-size:28px;font-weight:700;line-height:1.25;color:#efefef;">Fund II terms: <span style="color:#ebde84;">one quick vote</span></div>
    </td></tr>

    <!-- Body -->
    <tr><td class="px" style="padding:40px 40px 8px;">
      <p style="margin:0 0 18px;font-family:'Inter',Arial,sans-serif;font-size:15px;line-height:1.7;color:#363636;">Dear Partner,</p>
      <p style="margin:0 0 28px;font-family:'Inter',Arial,sans-serif;font-size:15px;line-height:1.7;color:#363636;">As we finalise the terms for Yali Deeptech Fund II, we would value your view on the fund's term. Which do you prefer?</p>
    </td></tr>

    <!-- Two options: a card per option, each with its own button -->
    <tr><td class="px" style="padding:0 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="opt" width="50%" valign="top" style="width:50%;padding:0 7px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #363636;">
              <tr><td style="padding:22px 20px 6px;font-family:'JetBrains Mono',Consolas,monospace;font-size:26px;font-weight:700;color:#363636;text-align:center;">10 + 1 + 1</td></tr>
              <tr><td style="padding:0 20px 18px;font-family:'Inter',Arial,sans-serif;font-size:12.5px;line-height:1.5;color:#595959;text-align:center;">10-year term, with two optional one-year extensions</td></tr>
              <tr><td align="center" style="padding:0 20px 22px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#830d35" style="background:#830d35;">
                <a href="${link("10-1-1")}" style="display:inline-block;padding:12px 26px;font-family:'JetBrains Mono',Consolas,monospace;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Choose this</a></td></tr></table></td></tr>
            </table>
          </td>
          <td class="opt" width="50%" valign="top" style="width:50%;padding:0 7px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #363636;">
              <tr><td style="padding:22px 20px 6px;font-family:'JetBrains Mono',Consolas,monospace;font-size:26px;font-weight:700;color:#363636;text-align:center;">12 + 1 + 1</td></tr>
              <tr><td style="padding:0 20px 18px;font-family:'Inter',Arial,sans-serif;font-size:12.5px;line-height:1.5;color:#595959;text-align:center;">12-year term, with two optional one-year extensions</td></tr>
              <tr><td align="center" style="padding:0 20px 22px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#830d35" style="background:#830d35;">
                <a href="${link("12-1-1")}" style="display:inline-block;padding:12px 26px;font-family:'JetBrains Mono',Consolas,monospace;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Choose this</a></td></tr></table></td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- Note -->
    <tr><td class="px" style="padding:32px 40px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="background:#e4e4e4;border-left:3px solid #ebde84;padding:18px 22px;font-family:'Inter',Arial,sans-serif;font-size:13px;line-height:1.7;color:#363636;">
          Clicking a button opens a page where you confirm your choice. You can vote once, and your vote is final. Voting closes on <strong>${closes}</strong>.
        </td></tr>
      </table>
    </td></tr>

    <!-- Footer -->
    <tr><td class="px" style="padding:28px 40px 32px;border-top:1px solid #d0d0d0;">
      <p style="margin:0 0 20px;font-family:'Inter',Arial,sans-serif;font-size:13px;line-height:1.8;color:#555555;">This email is sent from an address that is not monitored. Questions? Write to <a href="mailto:investor-relations@yali.vc" style="color:#830d35;">investor-relations@yali.vc</a> or <a href="mailto:sunil@yali.vc" style="color:#830d35;">sunil@yali.vc</a>.</p>
      <p style="margin:0;font-family:'JetBrains Mono',Consolas,monospace;font-size:10px;letter-spacing:0.1em;color:#999999;">Yali Capital &middot; Confidential &middot; For authorised recipients only</p>
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>
`;
  const text = [
    'Dear Partner,',
    '',
    "As we finalise the terms for Yali Deeptech Fund II, we would value your view on the fund's term. Which do you prefer?",
    '',
    `10 + 1 + 1 (10-year term, with two optional one-year extensions): ${link('10-1-1')}`,
    `12 + 1 + 1 (12-year term, with two optional one-year extensions): ${link('12-1-1')}`,
    '',
    `Each link opens a page where you confirm your choice. You can vote once, and your vote is final. Voting closes on ${closes}.`,
    '',
    'This email is sent from an address that is not monitored. Questions? Write to investor-relations@yali.vc or sunil@yali.vc.',
  ].join('\n');
  return { from: VOTE_EMAIL_FROM, subject: VOTE_EMAIL_SUBJECT, html, text };
}
