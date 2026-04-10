export default {
  name: 'dataroomSectionVisibility',
  title: 'Dataroom Section Visibility',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    {
      name: 'pipeline',
      title: 'Dealflow & Pipeline',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'ppmAgreements',
      title: 'PPM & Agreements',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'presentations',
      title: 'Presentations',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'regulatoryDocuments',
      title: 'Regulatory Documents',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'team',
      title: 'Team',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'trackRecord',
      title: 'Track Record & Recommendation',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'fundPerformance',
      title: 'Fund Performance',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'categorySplit',
      title: 'Portfolio by Sector',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'portfolio',
      title: 'Portfolio (allAccess users only)',
      type: 'boolean',
      initialValue: true,
    },
  ],
  preview: {
    prepare() {
      return { title: 'Dataroom Section Visibility' };
    },
  },
}
