// ─── Newsletter welcome email ─────────────────────────────────────────────────
// Sent once, right after someone subscribes via the homepage footer form.

const BODY_FONT = `Georgia,Cambria,'Times New Roman',Times,serif`;

export function buildWelcomeEmail(unsubscribeUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>You're subscribed to Tattva</title>
  <meta name="format-detection" content="telephone=no" />
  <style type="text/css">
    @media only screen and (max-width:600px){
      .em{width:100%!important;max-width:100%!important}
      .ep{padding-left:16px!important;padding-right:16px!important}
      .et{font-size:18px!important}
      .eb{font-size:15px!important}
      .el{font-size:12px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#e8e8e8;font-family:${BODY_FONT};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#e8e8e8;">
  <tr>
    <td align="center" style="padding:24px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- Brand stripe -->
        <tr>
          <td style="background-color:#363636;padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#830d35;padding:10px 14px;white-space:nowrap;vertical-align:middle;">
                  <span style="font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">Yali Capital</span>
                </td>
                <td style="padding:0 16px;vertical-align:middle;" align="right">
                  <span style="font-family:'Courier New',Courier,monospace;font-size:8px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#ebde84;border:1px solid rgba(235,222,132,0.25);padding:2px 8px;">Welcome</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Title block -->
        <tr>
          <td class="ep" style="background-color:#ffffff;padding:28px 24px 20px;border-bottom:1px solid #ebebeb;">
            <p style="font-family:'Courier New',Courier,monospace;font-size:9px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#830d35;margin:0 0 12px 0;">Newsletter &middot; Welcome</p>
            <h1 class="et" style="font-family:'Courier New',Courier,monospace;font-size:21px;font-weight:700;color:#363636;line-height:1.2;margin:0;">You're subscribed.</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td class="ep" style="background-color:#ffffff;padding:24px 24px 8px;">
            <p class="eb" style="font-family:${BODY_FONT};font-size:16px;line-height:1.6;color:#363636;margin:0 0 18px;">Thanks for signing up. You'll now get <strong>Tattva</strong>, Yali Capital's newsletter on deep tech, science, and where they meet venture capital &mdash; essays, portfolio spotlights, and the occasional podcast episode, sent straight to your inbox.</p>
            <p class="eb" style="font-family:${BODY_FONT};font-size:16px;line-height:1.6;color:#363636;margin:0 0 18px;">No fixed schedule, no spam &mdash; just the pieces worth your time.</p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td class="ep" style="background-color:#ffffff;padding:8px 24px 32px;">
            <a href="https://yali.vc/newsletter/" target="_blank" style="font-family:'Courier New',Courier,monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#830d35;text-decoration:none;border:1px solid #830d35;padding:10px 24px;display:inline-block;">Read past editions</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="ep" style="background-color:#363636;padding:14px 24px;">
            <p style="font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.06em;color:rgba(255,255,255,0.25);margin:0 0 4px 0;text-align:center;">&copy; Yali Capital 2026 &nbsp;|&nbsp; Bangalore, India</p>
            <p style="font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.2);margin:0;text-align:center;">
              You received this because you subscribed at yali.vc.
              &nbsp;<a href="${unsubscribeUrl}" style="color:#830d35;text-decoration:none;">Unsubscribe</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
