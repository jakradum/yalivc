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
    // Shared code is set by hand. The old "Generate" button called a web route
    // that anyone on the internet could call, so both were removed (5 Nov 2026).
    {
      name: 'inviteCode',
      title: 'Shared Code',
      type: 'string',
      group: 'code',
      hidden: ({ document }) => !document?.requireCode,
      description: 'The code everyone at this domain types to sign in. Use at least 8 random characters, and share it privately. When you change it, also set a new expiry and reset Times Used to 0.',
      validation: (Rule) => Rule.custom((v, ctx) => (!ctx.document?.requireCode || (v && v.trim().length >= 8)) ? true : 'Use at least 8 characters'),
    },
    {
      name: 'codeExpiry',
      title: 'Code Expiry',
      type: 'datetime',
      group: 'code',
      hidden: ({ document }) => !document?.requireCode,
      description: 'The code stops working after this date. 6 months is a sensible default.',
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
      initialValue: 0,
      description: 'Counts up automatically each time someone signs in with the code. Reset to 0 when you set a new code.',
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
