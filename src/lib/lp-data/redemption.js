import crypto from 'crypto';

// One entry in a domainPrivilege's redemptionLog.
export function redemptionEntry(email) {
  return { _key: crypto.randomBytes(8).toString('hex'), email, redeemedAt: new Date().toISOString() };
}
