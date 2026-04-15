import { InviteButtons } from '../components/InviteButtons';
import { NoAccessToggle } from '../components/NoAccessToggle';

const portalUser = {
  name: 'portalUser',
  title: 'Portal User',
  type: 'document',
  fields: [
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    },
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'LP name or organization',
    },
    {
      name: 'lpPortalAccess',
      title: 'LP Portal Access',
      type: 'boolean',
      initialValue: true,
      description: 'Grants access to the Partners Portal. Should be true for all active LPs.',
    },
    {
      name: 'investorDataRoomAccess',
      title: 'Investor Data Room Access',
      type: 'boolean',
      initialValue: false,
      description: 'Grants access to the Yali Investors Data Room. Enabling this automatically grants LP Portal access. For a select few LPs only.',
    },
    {
      name: 'noAccess',
      title: 'No Access (Kill Switch)',
      type: 'boolean',
      initialValue: false,
      description: 'Kill switch. Toggle on to immediately revoke all access without deleting the record. Overrides all other access flags.',
      components: { input: NoAccessToggle },
    },
    {
      name: 'isGiftCityLP',
      title: 'GIFT City LP',
      type: 'boolean',
      initialValue: false,
      description: 'Check if this LP should see GIFT City-specific fund financials',
    },
    {
      name: 'source',
      title: 'Source',
      type: 'string',
      initialValue: 'portal',
      description: 'How this user was onboarded — portal (LP portal invite) or dataroom (data room import)',
      options: {
        list: [
          { title: 'Portal', value: 'portal' },
          { title: 'Data Room', value: 'dataroom' },
        ],
      },
    },
    // Invite action buttons — rendered as a custom input component
    {
      name: 'inviteActions',
      title: 'Send Invites',
      type: 'string',
      readOnly: true,
      components: { input: InviteButtons },
    },
    // System fields — managed by the invite API, not editable in Studio
    {
      name: 'inviteCode',
      title: 'Invite Code',
      type: 'string',
      hidden: true,
      readOnly: true,
    },
    {
      name: 'inviteCodeExpiry',
      title: 'Invite Code Expiry',
      type: 'string',
      hidden: true,
      readOnly: true,
    },
  ],
  preview: {
    select: {
      title: 'email',
      subtitle: 'name',
      noAccess: 'noAccess',
      lpPortal: 'lpPortalAccess',
      dataRoom: 'investorDataRoomAccess',
    },
    prepare({ title, subtitle, noAccess, lpPortal, dataRoom }) {
      const flags = [
        noAccess ? '🚫 No Access' : '',
        lpPortal ? 'Portal' : '',
        dataRoom ? 'Data Room' : '',
      ].filter(Boolean).join(' · ');
      return {
        title: title,
        subtitle: `${subtitle || 'No name'} — ${flags || 'No access flags set'}`,
      };
    },
  },
};

export default portalUser;
