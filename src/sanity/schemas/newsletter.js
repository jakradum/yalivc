import {
  openingNoteSection,
  essaySection,
  portfolioSpotlightSection,
  guestColumnSection,
  radarSection,
  readingSection,
  freeformSection
} from './newsletterSections';

export default {
  name: 'newsletter',
  title: 'Newsletter (Tattva)',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g., "2025 - A lookback and what lies ahead in 2026"',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'e.g., "tattva-01" - URL-friendly identifier',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: input => input
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .slice(0, 96)
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'edition',
      title: 'Edition Number',
      type: 'number',
      description: 'e.g., 1, 2, 3...',
      validation: Rule => Rule.required().positive().integer()
    },
    {
      name: 'publishedDate',
      title: 'Published Date',
      type: 'datetime',
      validation: Rule => Rule.required()
    },
    {
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      rows: 3,
      description: 'For meta tags and social preview (150-200 characters)',
      validation: Rule => Rule.required().min(100).max(250)
    },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      description: 'Optional cover image for the newsletter',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Important for SEO and accessibility'
        }
      ]
    },
    {
      name: 'sections',
      title: 'Sections',
      type: 'array',
      description: 'Add and arrange newsletter sections in any order',
      of: [
        { type: 'openingNote' },
        { type: 'essay' },
        { type: 'portfolioSpotlight' },
        { type: 'guestColumn' },
        { type: 'radar' },
        { type: 'reading' },
        { type: 'freeform' }
      ],
      validation: Rule => Rule.required().min(1)
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Published', value: 'published' },
          { title: 'Archived', value: 'archived' }
        ],
        layout: 'radio'
      },
      initialValue: 'draft'
    }
  ],
  orderings: [
    {
      title: 'Edition (Newest First)',
      name: 'editionDesc',
      by: [{ field: 'edition', direction: 'desc' }]
    },
    {
      title: 'Published Date (Newest First)',
      name: 'publishedDateDesc',
      by: [{ field: 'publishedDate', direction: 'desc' }]
    }
  ],
  preview: {
    select: {
      title: 'title',
      edition: 'edition',
      date: 'publishedDate',
      status: 'status',
      media: 'coverImage'
    },
    prepare({ title, edition, date, status, media }) {
      const statusEmoji = {
        draft: '📝',
        published: '✅',
        archived: '📦'
      };
      const formattedDate = date ? new Date(date).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric'
      }) : '';

      return {
        title: `${statusEmoji[status] || '📝'} Tattva #${edition || '?'}`,
        subtitle: `${title}${formattedDate ? ` • ${formattedDate}` : ''}`,
        media
      };
    }
  }
};
