// What the sign-in pages say for each reply from src/lib/sign-in/handler.js.
// Runs in the browser, so times show in the reader's own time zone.

function when(iso) {
  return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function signInMessage(data) {
  switch (data?.status) {
    case 'wrong':
      // Last code of the day: say whether running out of tries locks the email or just ends the code.
      if (data.resend === false && data.lockLeft <= data.triesLeft) {
        return `Wrong code. You have ${plural(data.lockLeft, 'attempt')} remaining before this email is locked for 24 hours.`;
      }
      if (data.resend === false) {
        return `Wrong code. ${plural(data.triesLeft, 'attempt')} left on this code, and it is your last code for today.`;
      }
      return `Wrong code. Please try again (${plural(data.triesLeft, 'attempt')} left on this code).`;
    case 'dead':
      if (data.resend === false) {
        return `That code has had 3 wrong attempts, and you have used both codes for today. Please try again after ${when(data.until)}.`;
      }
      return 'That code has had 3 wrong attempts and no longer works. Click Resend code to get a new one.';
    case 'send_failed':
      return 'We couldn’t send the email just now. Please try again in a minute.';
    case 'expired':
      return 'This code no longer works. Click Resend code to get a new one.';
    case 'limit':
      return `You can get 2 codes in 24 hours. Use the latest code we sent you, or try again after ${when(data.until)}.`;
    case 'busy':
      return `Too many sign-in requests from your network. Please try again after ${when(data.until)}.`;
    case 'locked':
      return `Too many wrong codes. Sign-in for this email is locked until ${when(data.until)}.`;
    default:
      return data?.error || 'Something went wrong. Please try again.';
  }
}
