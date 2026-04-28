import { GenerateCodeButton } from '../components/GenerateCodeButton';
import { RedemptionLog } from '../components/RedemptionLog';

export default {
  name: 'domainPrivilege',
  title: 'Domain Privilege',
  type: 'document',

  groups: [
    { name: 'access', title: 'Access' },
    { name: 'code', title: 'Shared Code' },
    { name: 'log', title: 'Redemption Log' },
  ],

  fields: [
    {
      name: 'isActive',
      title: 'Privileges Active',
      type: 'boolean',
      initialValue: true,
      description: 'When off, this domain loses all portal and data room access. The record is preserved and can be reactivated at any time.',
    },
    {
      name: 'domain',
      title: 'Email Domain',
      type: 'string',
      group: 'access',
      description: 'Full domain to match, including any subdomain — e.g. yali.vc or apac.hmc.harvard.edu',
      validation: Rule => Rule.required(),
    },
    {
      name: 'label',
      title: 'Organisation Name',
      type: 'string',
      group: 'access',
      description: 'Friendly name shown in the Studio — e.g. Harvard Management Company',
    },
    {
      name: 'lpPortalAccess',
      title: 'LP Portal Access',
      type: 'boolean',
      group: 'access',
      initialValue: false,
      description: 'Allow sign-in to the Partners LP Portal',
    },
    {
      name: 'dataroomAccess',
      title: 'Data Room Access',
      type: 'boolean',
      group: 'access',
      initialValue: false,
      description: 'Allow sign-in to the Investor Data Room',
    },
    {
      name: 'requireCode',
      title: 'Require a shared code',
      type: 'boolean',
      group: 'code',
      initialValue: false,
      description: 'ON — everyone from this domain uses one shared code to sign in. OFF — they sign in via OTP email, no user record needed.',
    },
    {
      name: 'codeActions',
      title: 'Shared Code',
      type: 'string',
      group: 'code',
      readOnly: true,
      hidden: ({ document }) => !document?.requireCode,
      components: { input: GenerateCodeButton },
      description: 'Save the document first, then click Generate. Code is valid for 6 months.',
    },
    // System fields — managed by GenerateCodeButton via API
    {
      name: 'inviteCode',
      title: 'Invite Code',
      type: 'string',
      hidden: true,
      readOnly: true,
    },
    {
      name: 'codeExpiry',
      title: 'Code Expiry',
      type: 'datetime',
      hidden: true,
      readOnly: true,
    },
    {
      name: 'maxUses',
      title: 'Max Uses',
      type: 'number',
      group: 'code',
      hidden: ({ document }) => !document?.requireCode,
      initialValue: 3,
      description: 'How many people can use this code (2–50)',
      validation: Rule => Rule.min(2).max(50).integer(),
    },
    {
      name: 'usedCount',
      title: 'Times Used',
      type: 'number',
      group: 'code',
      hidden: ({ document }) => !document?.requireCode,
      readOnly: true,
      initialValue: 0,
    },
    {
      name: 'redemptionLogDisplay',
      title: 'Code Redemption Log',
      type: 'string',
      group: 'log',
      readOnly: true,
      hidden: ({ document }) => !document?.requireCode,
      components: { input: RedemptionLog },
    },
    // System field — managed by auth route on each successful redemption
    {
      name: 'redemptionLog',
      title: 'Redemption Log',
      type: 'array',
      hidden: true,
      readOnly: true,
      of: [
        {
          type: 'object',
          fields: [
            { name: 'email', title: 'Email', type: 'string' },
            { name: 'redeemedAt', title: 'Redeemed At', type: 'datetime' },
          ],
        },
      ],
    },
  ],

  preview: {
    select: {
      title: 'domain',
      subtitle: 'label',
      requireCode: 'requireCode',
      lpPortal: 'lpPortalAccess',
      dataroom: 'dataroomAccess',
    },
    prepare({ title, subtitle, requireCode, lpPortal, dataroom }) {
      const access = [lpPortal && 'LP Portal', dataroom && 'Data Room'].filter(Boolean).join(' + ') || 'No access';
      return {
        title: title || 'Unnamed domain',
        subtitle: `${subtitle ? subtitle + ' · ' : ''}${access} · ${requireCode ? '🔑 Shared code' : '✓ OTP email'}`,
      };
    },
  },
};
