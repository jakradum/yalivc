// Data room sign-in by emailed code. Rules and replies: src/lib/sign-in/handler.js.
import { signInHandler } from '@/lib/sign-in/handler';

export const POST = signInHandler({
  scope: 'dataroom',
  place: 'Data Room',
  cookieName: 'dataroom-session',
  legacyOtpCookie: 'dataroom-otp-pending',
  allowSignOut: true,
});
