// Sanity versions of the lookups and writes that used to be inline in the API
// routes (portal-auth, dataroom-auth, portal-invite, dataroom-invite,
// portal-feedback, portal-download). GROQ and client config moved verbatim.
import { createClient } from '@sanity/client';

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

export function getBlockedPortalUser(email) {
  return client.fetch(
    `*[_type == "portalUser" && lower(email) == $email && noAccess == true][0]{ _id }`,
    { email }
  );
}

export function getActiveUserForSignIn(scope, email) {
  return client.fetch(`${scoped(ACTIVE_USER, scope)}{ _id, name }`, { email });
}

export function getActiveUserId(scope, email) {
  return client.fetch(`${scoped(ACTIVE_USER, scope)}{ _id }`, { email });
}

export function createDownloadConsent(fields) {
  return writeClient().create({ _type: 'lpDownloadConsent', ...fields });
}

export function createPortalFeedback(fields) {
  return writeClient().create({ _type: 'lpPortalFeedback', ...fields });
}
