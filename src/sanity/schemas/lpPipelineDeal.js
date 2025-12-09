export default {
  name: 'lpPipelineDeal',
  title: 'LP Pipeline Deal',
  type: 'document',

  fields: [
    {
      name: 'companyName',
      title: 'Company Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'sector',
      title: 'Sector',
      type: 'reference',
      to: [{ type: 'category' }],
      description: 'Select from existing categories'
    },
    {
      name: 'sectorOverride',
      title: 'Sector (Text Override)',
      type: 'string',
      description: 'Use if sector not in category list, e.g., "AI Software Solutions"'
    },
    {
      name: 'proposedAmountINR',
      title: 'Proposed Amount (₹ Crores)',
      type: 'number'
    },
    {
      name: 'stage',
      title: 'Stage of Evaluation',
      type: 'string',
      options: {
        list: [
          { title: 'Initial Screening', value: 'screening' },
          { title: 'Due Diligence', value: 'due-diligence' },
          { title: 'Term Sheet', value: 'term-sheet' },
          { title: 'Advanced Documentation', value: 'advanced-documentation' },
          { title: 'Closed', value: 'closed' },
          { title: 'Passed', value: 'passed' }
        ]
      }
    },
    {
      name: 'description',
      title: 'Brief Description',
      type: 'text',
      rows: 3
    },
    {
      name: 'isActive',
      title: 'Show in Reports',
      type: 'boolean',
      initialValue: true,
      description: 'Uncheck to hide from LP reports'
    },

    // TRACKING
    {
      name: 'addedDate',
      title: 'Added to Pipeline',
      type: 'date'
    },
    {
      name: 'lastUpdated',
      title: 'Last Updated',
      type: 'date'
    },
    {
      name: 'notes',
      title: 'Internal Notes',
      type: 'text',
      description: 'Internal notes (not shown in reports)',
      rows: 3
    }
  ],

  preview: {
    select: {
      title: 'companyName',
      stage: 'stage',
      isActive: 'isActive'
    },
    prepare({ title, stage, isActive }) {
      const stageLabels = {
        'screening': '🔍 Screening',
        'due-diligence': '📋 Due Diligence',
        'term-sheet': '📝 Term Sheet',
        'advanced-documentation': '📄 Docs',
        'closed': '✅ Closed',
        'passed': '❌ Passed'
      }
      return {
        title: title || 'Unknown Company',
        subtitle: `${stageLabels[stage] || stage}${!isActive ? ' (Hidden)' : ''}`
      }
    }
  },

  orderings: [
    {
      title: 'By Stage',
      name: 'byStage',
      by: [{ field: 'stage', direction: 'asc' }]
    },
    {
      title: 'By Date Added',
      name: 'byDateAdded',
      by: [{ field: 'addedDate', direction: 'desc' }]
    }
  ]
}
