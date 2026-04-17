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
      name: 'portfolio',
      title: 'Portfolio (allAccess users only)',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'exitValueAsOfDate',
      title: 'Track Record — Exit Value "As of" Date',
      type: 'string',
      description: 'Shown as fine print under the Exit Value column header (e.g. "15 Jul \'24"). Leave blank to hide.',
    },
    {
      name: 'hiddenFunds',
      title: 'Track Record — Hide Records by Fund / Org',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'Enter exact Fund / Org values whose records should be hidden (e.g. "Fund 2"). Case-sensitive.',
    },
  ],
  preview: {
    prepare() {
      return { title: 'Dataroom Section Visibility' };
    },
  },
}
