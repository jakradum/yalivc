export default {
  name: 'lpQuarterlyReport',
  title: 'LP Quarterly Report',
  type: 'document',

  groups: [
    { name: 'meta', title: 'Report Info' },
    { name: 'coverNote', title: 'Cover Note' },
    { name: 'commentary', title: 'Commentary Sections' },
    { name: 'portfolio', title: 'Portfolio' },
    { name: 'pipeline', title: 'Pipeline' },
    { name: 'media', title: 'Media' },
    { name: 'output', title: 'Output' }
  ],

  fields: [
    // ===== META =====
    {
      name: 'title',
      title: 'Report Title',
      type: 'string',
      description: 'e.g., "Q2 FY26 Quarterly Report"',
      group: 'meta',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      group: 'meta',
      validation: Rule => Rule.required()
    },
    {
      name: 'quarter',
      title: 'Quarter',
      type: 'string',
      options: { list: ['Q1', 'Q2', 'Q3', 'Q4'] },
      group: 'meta',
      validation: Rule => Rule.required()
    },
    {
      name: 'fiscalYear',
      title: 'Fiscal Year',
      type: 'string',
      options: {
        list: ['FY24', 'FY25', 'FY26', 'FY27', 'FY28', 'FY29', 'FY30']
      },
      group: 'meta',
      validation: Rule => Rule.required()
    },
    {
      name: 'reportingDate',
      title: 'As of Date',
      type: 'date',
      description: 'e.g., 30 Sep 2025 for Q2 FY26',
      group: 'meta'
    },
    {
      name: 'publishDate',
      title: 'Publish Date',
      type: 'datetime',
      group: 'meta'
    },

    // ===== COVER NOTE (Text/Narrative only) =====
    {
      name: 'coverNoteGreeting',
      title: 'Greeting',
      type: 'string',
      initialValue: 'Dear Partners,',
      group: 'coverNote'
    },
    {
      name: 'coverNoteIntro',
      title: 'Cover Note - Introduction',
      type: 'array',
      of: [{ type: 'block' }],
      group: 'coverNote',
      description: 'Opening paragraphs: greeting, fund overview'
    },
    {
      name: 'investmentActivityNotes',
      title: 'Investment Activity Notes',
      type: 'array',
      of: [{ type: 'block' }],
      group: 'coverNote',
      description: 'Pipeline commentary, new investments'
    },
    {
      name: 'portfolioHighlightsNotes',
      title: 'Portfolio Highlights Notes',
      type: 'array',
      of: [{ type: 'block' }],
      group: 'coverNote',
      description: 'Brief summary of each company'
    },
    {
      name: 'ecosystemNotes',
      title: 'Ecosystem & Tailwinds',
      type: 'array',
      of: [{ type: 'block' }],
      group: 'coverNote',
      description: 'Market commentary'
    },
    {
      name: 'closingNotes',
      title: 'Closing Notes',
      type: 'array',
      of: [{ type: 'block' }],
      group: 'coverNote'
    },
    {
      name: 'signatory',
      title: 'Signatory',
      type: 'reference',
      to: [{ type: 'teamMember' }],
      group: 'coverNote',
      description: 'Team member who signs the cover note'
    },

    // ===== COMMENTARY SECTIONS =====
    {
      name: 'commentarySections',
      title: 'Commentary Sections',
      type: 'array',
      group: 'commentary',
      description: 'Add custom commentary sections with your own headers. These can be placed anywhere in the report.',
      of: [{
        type: 'object',
        name: 'commentarySection',
        title: 'Commentary Section',
        fields: [
          {
            name: 'sectionHeader',
            title: 'Section Header',
            type: 'string',
            description: 'Custom header for this commentary section (e.g., "Market Outlook", "Strategic Updates")',
            validation: Rule => Rule.required()
          },
          {
            name: 'placement',
            title: 'Placement',
            type: 'string',
            options: {
              list: [
                { title: 'After Fund Summary', value: 'after-fund-summary' },
                { title: 'After Portfolio Summary', value: 'after-portfolio-summary' },
                { title: 'After Portfolio Updates', value: 'after-portfolio-updates' },
                { title: 'After Pipeline', value: 'after-pipeline' },
                { title: 'After Media Coverage', value: 'after-media' },
                { title: 'Before Contact Information', value: 'before-contact' }
              ]
            },
            description: 'Where should this section appear in the report?'
          },
          {
            name: 'content',
            title: 'Content',
            type: 'array',
            of: [{ type: 'block' }],
            description: 'Long-form text content for this section'
          }
        ],
        preview: {
          select: {
            title: 'sectionHeader',
            placement: 'placement'
          },
          prepare({ title, placement }) {
            const placementLabels = {
              'after-fund-summary': 'After Fund Summary',
              'after-portfolio-summary': 'After Portfolio Summary',
              'after-portfolio-updates': 'After Portfolio Updates',
              'after-pipeline': 'After Pipeline',
              'after-media': 'After Media Coverage',
              'before-contact': 'Before Contact'
            }
            return {
              title: title || 'Untitled Section',
              subtitle: placementLabels[placement] || 'No placement set'
            }
          }
        }
      }]
    },

    // ===== PORTFOLIO (References only) =====
    {
      name: 'portfolioCompanies',
      title: 'Portfolio Companies in Report',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{ type: 'company' }]
      }],
      group: 'portfolio',
      description: 'Select portfolio companies. Investment data and quarterly updates are pulled from Core Content → Portfolio Companies.'
    },

    // ===== PIPELINE (References + Commentary) =====
    {
      name: 'pipelineDeals',
      title: 'Pipeline Deals to Include',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{ type: 'lpPipelineDeal' }]
      }],
      group: 'pipeline',
      description: 'Select pipeline deals to include in this report'
    },
    {
      name: 'pipelineNotes',
      title: 'Pipeline Commentary',
      type: 'array',
      of: [{ type: 'block' }],
      group: 'pipeline',
      description: 'Narrative commentary about the pipeline'
    },

    // ===== MEDIA (References only) =====
    {
      name: 'mediaFromNews',
      title: 'Media Coverage',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{ type: 'news' }]
      }],
      group: 'media',
      description: 'Select news articles from Site Content → News to include in this report'
    },
    {
      name: 'mediaNotes',
      title: 'Media Commentary',
      type: 'array',
      of: [{ type: 'block' }],
      group: 'media',
      description: 'Optional narrative about media coverage'
    },

    // ===== OUTPUT =====
    {
      name: 'generatedPdf',
      title: 'Generated PDF',
      type: 'file',
      group: 'output',
      options: {
        accept: 'application/pdf'
      },
      description: 'Upload the generated PDF report'
    },
    {
      name: 'isPublished',
      title: 'Published to Partners Portal',
      type: 'boolean',
      group: 'output',
      initialValue: false,
      description: 'When checked, this report will be visible to LPs'
    },
    {
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      group: 'output',
      description: 'Lower numbers appear first in the list'
    }
  ],

  preview: {
    select: {
      quarter: 'quarter',
      year: 'fiscalYear',
      published: 'isPublished',
      title: 'title'
    },
    prepare({ quarter, year, published, title }) {
      return {
        title: title || `${quarter} ${year}`,
        subtitle: published ? '✓ Published' : '○ Draft'
      }
    }
  },

  orderings: [
    {
      title: 'Newest First',
      name: 'newestFirst',
      by: [
        { field: 'fiscalYear', direction: 'desc' },
        { field: 'quarter', direction: 'desc' }
      ]
    },
    {
      title: 'By Display Order',
      name: 'displayOrderAsc',
      by: [{ field: 'displayOrder', direction: 'asc' }]
    }
  ]
}
