// What the sign-in pages say for each reply from src/lib/sign-in/handler.js.
// Run: node --test tests/sign-in/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { signInMessage } = await import('../../src/lib/sign-in/messages.js');
const until = '2026-11-12T08:00:00Z';

test('first code: tries left on this code', () => {
  assert.match(signInMessage({ status: 'wrong', triesLeft: 2, lockLeft: 5, resend: true }), /2 attempts left on this code/);
});

test('second code after 3 wrong on the first: counts down to the lock', () => {
  assert.equal(signInMessage({ status: 'wrong', triesLeft: 2, lockLeft: 2, resend: false }),
    'Wrong code. You have 2 attempts remaining before this email is locked for 24 hours.');
  assert.match(signInMessage({ status: 'wrong', triesLeft: 1, lockLeft: 1, resend: false }), /1 attempt remaining/);
});

test('second code after an early resend: last code, no lock', () => {
  assert.match(signInMessage({ status: 'wrong', triesLeft: 2, lockLeft: 5, resend: false }), /your last code for today/);
});

test('dead code: resend if allowed, otherwise wait', () => {
  assert.match(signInMessage({ status: 'dead', resend: true }), /Click Resend code/);
  assert.match(signInMessage({ status: 'dead', resend: false, until }), /used both codes for today/);
});

test('limits, locks and send failures', () => {
  assert.match(signInMessage({ status: 'limit', until }), /2 codes in 24 hours/);
  assert.match(signInMessage({ status: 'locked', until }), /locked until/);
  assert.match(signInMessage({ status: 'busy', until }), /from your network/);
  assert.match(signInMessage({ status: 'send_failed' }), /couldn’t send the email/);
  assert.equal(signInMessage({ error: 'Please enter the 6-digit code.' }), 'Please enter the 6-digit code.');
});
