export default {
  name: 'lpQuarterlyReport',
  title: 'LP Quarterly Report',
  type: 'document',

  groups: [
    { name: 'meta', title: 'Report Info' },
    { name: 'coverNote', title: 'Cover Note' },
    { name: 'commentary', title: 'Commentary Sections' },
    { name: 'pipeline', title: 'Pipeline' },
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

    // ===== OUTPUT =====
    {
      name: 'fundFinancialsPdf',
      title: 'Fund Financials PDF',
      type: 'file',
      group: 'output',
      options: {
        accept: 'application/pdf'
      },
      description: 'Upload the fund financials PDF for this quarter (shown to all LPs)'
    },
    {
      name: 'giftCityFundFinancialsPdf',
      title: 'GIFT City Fund Financials PDF',
      type: 'file',
      group: 'output',
      options: {
        accept: 'application/pdf'
      },
      description: 'Upload the GIFT City-specific fund financials PDF (only shown to GIFT City LPs)'
    },
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

    // ===== PORTFOLIO SUMMARY FOOTNOTES =====
    {
      name: 'portfolioSummaryFootnotes',
      title: 'Portfolio Summary Table Footnotes',
      type: 'array',
      group: 'output',
      description: 'Add footnotes for the Portfolio Investment Summary table',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'fieldName',
              title: 'Assign to Column/Metric',
              type: 'string',
              options: {
                list: [
                  { title: 'Company Name', value: 'company' },
                  { title: 'Sector', value: 'sector' },
                  { title: 'Initial Investment Date', value: 'initial-date' },
                  { title: 'Amount (₹ Crores)', value: 'amount' },
                  { title: 'Fully Diluted Ownership (%)', value: 'ownership' },
                  { title: 'Table Header', value: 'header' },
                  { title: 'General (below table)', value: 'general' }
                ]
              },
              validation: Rule => Rule.required()
            },
            {
              name: 'marker',
              title: 'Marker',
              type: 'string',
              description: 'e.g., "*", "†", "1", "2"',
              validation: Rule => Rule.required()
            },
            {
              name: 'text',
              title: 'Footnote Text',
              type: 'string',
              validation: Rule => Rule.required()
            }
          ],
          preview: {
            select: {
              fieldName: 'fieldName',
              marker: 'marker',
              text: 'text'
            },
            prepare({ fieldName, marker, text }) {
              const fieldLabels = {
                'company': 'Company',
                'sector': 'Sector',
                'initial-date': 'Initial Date',
                'amount': 'Amount',
                'ownership': 'Ownership',
                'header': 'Header',
                'general': 'General'
              };
              return {
                title: `${marker} ${text}`,
                subtitle: `Assigned to: ${fieldLabels[fieldName] || fieldName}`
              };
            }
          }
        }
      ]
    },
    {
      name: 'visibility',
      title: 'Visibility',
      type: 'string',
      group: 'output',
      options: {
        list: [
          { title: 'Draft (Sanity only)', value: 'draft' },
          { title: 'Internal Review (@yali.vc only)', value: 'internal' },
          { title: 'Published (All LPs)', value: 'published' }
        ],
        layout: 'radio'
      },
      initialValue: 'draft',
      description: 'Draft = only visible in Sanity. Internal = visible to @yali.vc team for review. Published = visible to all authenticated LPs.'
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
      visibility: 'visibility',
      title: 'title'
    },
    prepare({ quarter, year, visibility, title }) {
      const visibilityLabels = {
        draft: '○ Draft',
        internal: '👁 Internal Review',
        published: '✓ Published'
      };
      return {
        title: title || `${quarter} ${year}`,
        subtitle: visibilityLabels[visibility] || '○ Draft'
      };
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
