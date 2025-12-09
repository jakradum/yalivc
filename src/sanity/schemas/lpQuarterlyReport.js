export default {
  name: 'lpQuarterlyReport',
  title: 'LP Quarterly Report',
  type: 'document',

  groups: [
    { name: 'meta', title: 'Report Info' },
    { name: 'fundMetrics', title: 'Fund Metrics' },
    { name: 'coverNote', title: 'Cover Note' },
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
      description: 'e.g., "FY26"',
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

    // ===== FUND METRICS (Snapshot) =====
    {
      name: 'fundMetrics',
      title: 'Fund Metrics',
      type: 'object',
      group: 'fundMetrics',
      fields: [
        { name: 'fundSizeAtClose', title: 'Fund Size at Final Close (₹ Cr)', type: 'number' },
        { name: 'amountDrawnDown', title: 'Amount Drawn Down (₹ Cr)', type: 'number' },
        { name: 'totalInvestedInPortfolio', title: 'Total Invested in Portfolio (₹ Cr)', type: 'number' },
        { name: 'fmvOfPortfolio', title: 'FMV of Portfolio (₹ Cr)', type: 'number' },
        { name: 'numberOfPortfolioCompanies', title: 'Number of Portfolio Companies', type: 'number' },
        { name: 'amountReturned', title: 'Amount Returned (₹ Cr)', type: 'number' },
        { name: 'moic', title: 'MOIC', type: 'number' },
        { name: 'tvpi', title: 'TVPI', type: 'number' },
        { name: 'dpi', title: 'DPI', type: 'number' },
        { name: 'irr', title: 'IRR (%)', type: 'number' }
      ]
    },

    // ===== COVER NOTE =====
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
      description: 'Team member who signs the cover note (their role will be used as title)'
    },

    // ===== PORTFOLIO (References) =====
    {
      name: 'portfolioCompanyUpdates',
      title: 'Portfolio Company Updates',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{ type: 'lpCompanyQuarterUpdate' }]
      }],
      group: 'portfolio',
      description: 'Select company updates for this quarter'
    },
    {
      name: 'companyDisplayOrder',
      title: 'Company Display Order',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{ type: 'lpInvestment' }]
      }],
      group: 'portfolio',
      description: 'Order companies should appear in report (if different from default)'
    },

    // ===== PIPELINE =====
    {
      name: 'pipelineDeals',
      title: 'Pipeline Deals to Include',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{ type: 'lpPipelineDeal' }]
      }],
      group: 'pipeline'
    },
    {
      name: 'pipelineNotes',
      title: 'Pipeline Commentary',
      type: 'array',
      of: [{ type: 'block' }],
      group: 'pipeline',
      description: 'Additional commentary about the pipeline'
    },

    // ===== MEDIA =====
    {
      name: 'mediaHighlights',
      title: 'Media Highlights (Manual Entry)',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'date', title: 'Date', type: 'date' },
          { name: 'headline', title: 'Headline', type: 'string' },
          { name: 'url', title: 'URL', type: 'url' },
          { name: 'publication', title: 'Publication', type: 'string' },
          { name: 'image', title: 'Image', type: 'image' },
          { name: 'caption', title: 'Caption', type: 'text', rows: 2 }
        ],
        preview: {
          select: { title: 'headline', subtitle: 'date', media: 'image' }
        }
      }],
      group: 'media',
      description: 'Manually entered media highlights'
    },
    {
      name: 'mediaFromNews',
      title: 'Include from Newsroom',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{ type: 'news' }]
      }],
      group: 'media',
      description: 'Reference existing news articles'
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
