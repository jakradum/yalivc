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
  ],
  preview: {
    select: {
      title: 'email',
      subtitle: 'name',
      active: 'isActive',
    },
    prepare({ title, subtitle, active }) {
      return {
        title: title,
        subtitle: `${subtitle || 'No name'} — ${active ? 'Active' : 'Inactive'}`,
      };
    },
  },
};

export default portalUser;
