import { InviteButtons } from '../components/InviteButtons';

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
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
      description: 'Disable to revoke access without deleting the user',
    },
    {
      name: 'isGiftCityLP',
      title: 'GIFT City LP',
      type: 'boolean',
      initialValue: false,
      description: 'Check if this LP should see GIFT City-specific fund financials',
    },
    {
      name: 'dataRoomAccess',
      title: 'Data Room Access',
      type: 'boolean',
      initialValue: false,
      description: 'Grant access to dataroom.yali.vc. isActive must also be true. Disable to revoke data room access without affecting portal access.',
    },
    {
      name: 'allAccess',
      title: 'All Access (Data Room)',
      type: 'boolean',
      initialValue: false,
      description: 'Grants access to portfolio company data in the data room. Requires dataRoomAccess to also be true.',
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
      active: 'isActive',
      dataRoom: 'dataRoomAccess',
      allAccess: 'allAccess',
    },
    prepare({ title, subtitle, active, dataRoom, allAccess }) {
      const flags = [
        active ? 'Active' : 'Inactive',
        dataRoom ? 'Data Room' : '',
        allAccess ? 'All Access' : '',
      ].filter(Boolean).join(' · ');
      return {
        title: title,
        subtitle: `${subtitle || 'No name'} — ${flags}`,
      };
    },
  },
};

export default portalUser;
