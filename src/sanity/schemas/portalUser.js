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
      name: 'accessCode',
      title: 'Access Code',
      type: 'string',
      description: 'Unique access code for this user',
      validation: (Rule) => Rule.required().min(6),
    },
    {
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
      description: 'Disable to revoke access without deleting the user',
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
