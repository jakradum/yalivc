// Sanity versions of the lookups and writes that used to be inline in the API
// routes (portal-auth, dataroom-auth, portal-invite, dataroom-invite, check-domain,
// portal-feedback, portal-download). GROQ and client config moved verbatim.
import { createClient } from '@sanity/client';
import { redemptionEntry } from './redemption.js';

// Same config the routes created for themselves.
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  // Read token: the production dataset is private. Published docs only, so Studio
  // drafts never reach a page. (SANITY_READ_TOKEN is a Viewer token; falls back to
  // the existing API token until one is created.)
  token: process.env.SANITY_READ_TOKEN || process.env.SANITY_API_TOKEN,
  perspective: 'published',
});

function writeClient() {
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN,
  });
}

const SIGN_IN_DOMAIN = {
  portal: `*[_type == "domainPrivilege" && domain == $domain && lpPortalAccess == true && isActive == true][0]{
          _id, requireCode, inviteCode, codeExpiry, maxUses, usedCount
        }`,
  dataroom: `*[_type == "domainPrivilege" && domain == $domain && dataroomAccess == true && isActive == true][0]{
          _id, requireCode, inviteCode, codeExpiry, maxUses, usedCount
        }`,
};

const SHARED_CODE_DOMAIN = {
  portal: `*[_type == "domainPrivilege" && domain == $domain && lpPortalAccess == true && requireCode == true && isActive == true][0]{
            _id, inviteCode, codeExpiry, maxUses, usedCount, redemptionLog
          }`,
  dataroom: `*[_type == "domainPrivilege" && domain == $domain && dataroomAccess == true && requireCode == true && isActive == true][0]{
            _id, inviteCode, codeExpiry, maxUses, usedCount, redemptionLog
          }`,
};

const ACTIVE_USER = {
  portal: `*[_type == "portalUser" && lower(email) == $email && noAccess != true && (lpPortalAccess == true || (!defined(lpPortalAccess) && isActive == true))][0]`,
  dataroom: `*[_type == "portalUser" && lower(email) == $email && noAccess != true && (investorDataRoomAccess == true || (dataRoomAccess == true && !defined(investorDataRoomAccess)))][0]`,
};

function scoped(table, scope) {
  const q = Object.prototype.hasOwnProperty.call(table, scope) ? table[scope] : null;
  if (!q) throw new Error(`Unknown scope: ${scope}`);
  return q;
}

export function getDomainPrivilegeForSignIn(scope, domain) {
  return client.fetch(scoped(SIGN_IN_DOMAIN, scope), { domain });
}

export function getDomainSharedCode(scope, domain) {
  return client.fetch(scoped(SHARED_CODE_DOMAIN, scope), { domain });
}

export function getSharedCodeDomain(domain) {
  return client.fetch(
    `*[_type == "domainPrivilege" && domain == $domain && requireCode == true && isActive == true][0]{ _id }`,
    { domain }
  );
}

export function getBlockedPortalUser(email) {
  return client.fetch(
    `*[_type == "portalUser" && lower(email) == $email && noAccess == true][0]{ _id }`,
    { email }
  );
}

export function getActiveUserForSignIn(scope, email) {
  return client.fetch(`${scoped(ACTIVE_USER, scope)}{ _id, name }`, { email });
}

export function getActiveUserInviteCode(scope, email) {
  return client.fetch(
    `${scoped(ACTIVE_USER, scope)}{
            _id, inviteCode, inviteCodeExpiry
          }`,
    { email }
  );
}

export function getActiveUserId(scope, email) {
  return client.fetch(`${scoped(ACTIVE_USER, scope)}{ _id }`, { email });
}

// One redemption of a domain's shared code: usedCount + 1 and a log entry.
export async function redeemDomainSharedCode(domainPriv, email, logEntry = redemptionEntry(email)) {
  const existingLog = Array.isArray(domainPriv.redemptionLog) ? domainPriv.redemptionLog : [];
  await writeClient()
    .patch(domainPriv._id)
    .set({ usedCount: (domainPriv.usedCount || 0) + 1, redemptionLog: [...existingLog, logEntry] })
    .commit();
}

export async function clearUserInviteCode(userId) {
  await writeClient().patch(userId).unset(['inviteCode', 'inviteCodeExpiry']).commit();
}

export function createDownloadConsent(fields) {
  return writeClient().create({ _type: 'lpDownloadConsent', ...fields });
}

export function createPortalFeedback(fields) {
  return writeClient().create({ _type: 'lpPortalFeedback', ...fields });
}
