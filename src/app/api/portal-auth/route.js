// LP portal sign-in by emailed code. Rules and replies: src/lib/sign-in/handler.js.
import { signInHandler } from '@/lib/sign-in/handler';

export const POST = signInHandler({
  scope: 'portal',
  place: 'LP Portal',
  cookieName: 'portal-session',
  legacyOtpCookie: 'portal-otp-pending',
});
