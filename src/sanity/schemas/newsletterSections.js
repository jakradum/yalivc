import { portableTextConfig } from './portableTextConfig';

// Opening Note Section
export const openingNoteSection = {
  name: 'openingNote',
  title: 'Opening Note',
  type: 'object',
  fields: [
    {
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      description: 'Override the default "Opening Note" title. Leave blank to use default.'
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'teamMember' }],
      validation: Rule => Rule.required()
    },
    {
      name: 'body',
      title: 'Content',
      ...portableTextConfig,
      validation: Rule => Rule.required()
    }
  ],
  preview: {
    select: {
      sectionTitle: 'sectionTitle',
      authorName: 'author.name'
    },
    prepare({ sectionTitle, authorName }) {
      return {
        title: `📝 ${sectionTitle || 'Opening Note'}`,
        subtitle: authorName ? `by ${authorName}` : 'No author selected'
      };
    }
  }
};

// Essay Section
export const essaySection = {
  name: 'essay',
  title: 'Essay',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'body',
      title: 'Content',
      ...portableTextConfig,
      validation: Rule => Rule.required()
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'teamMember' }],
      description: 'Optional - leave blank if no specific author'
    }
  ],
  preview: {
    select: {
      title: 'title',
      authorName: 'author.name'
    },
    prepare({ title, authorName }) {
      return {
        title: `📖 ${title || 'Untitled Essay'}`,
        subtitle: authorName ? `by ${authorName}` : ''
      };
    }
  }
};

// Portfolio Spotlight Section
export const portfolioSpotlightSection = {
  name: 'portfolioSpotlight',
  title: 'Portfolio Spotlight',
  type: 'object',
  fields: [
    {
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      description: 'Override the default "Portfolio Spotlight" title. Leave blank to use default.'
    },
    {
      name: 'company',
      title: 'Company',
      type: 'reference',
      to: [{ type: 'company' }],
      validation: Rule => Rule.required()
    },
    {
      name: 'body',
      title: 'Content',
      ...portableTextConfig,
      validation: Rule => Rule.required()
    }
  ],
  preview: {
    select: {
      sectionTitle: 'sectionTitle',
      companyName: 'company.name'
    },
    prepare({ sectionTitle, companyName }) {
      return {
        title: `🎯 ${sectionTitle || 'Portfolio Spotlight'}`,
        subtitle: companyName || 'No company selected'
      };
    }
  }
};

// Guest Column Section
export const guestColumnSection = {
  name: 'guestColumn',
  title: 'Guest Column',
  type: 'object',
  fields: [
    {
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      description: 'Override the default "Guest Column" title. Leave blank to use default.'
    },
    {
      name: 'guestName',
      title: 'Guest Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'guestTitle',
      title: 'Guest Title/Role',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'guestCompany',
      title: 'Guest Company',
      type: 'string'
    },
    {
      name: 'guestPhoto',
      title: 'Guest Photo',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'body',
      title: 'Content',
      ...portableTextConfig,
      validation: Rule => Rule.required()
    }
  ],
  preview: {
    select: {
      sectionTitle: 'sectionTitle',
      name: 'guestName',
      title: 'guestTitle',
      company: 'guestCompany',
      media: 'guestPhoto'
    },
    prepare({ sectionTitle, name, title, company, media }) {
      return {
        title: `🎤 ${sectionTitle || `Guest Column: ${name || 'Unknown Guest'}`}`,
        subtitle: [title, company].filter(Boolean).join(' at '),
        media
      };
    }
  }
};

// Radar Section (What's on Our Radar)
export const radarSection = {
  name: 'radar',
  title: 'The Radar',
  type: 'object',
  fields: [
    {
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      description: 'Override the default "The Radar" title. Leave blank to use default.'
    },
    {
      name: 'items',
      title: 'Radar Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'radarItem',
          fields: [
            {
              name: 'technology',
              title: 'Technology/Topic',
              type: 'string',
              validation: Rule => Rule.required()
            },
            {
              name: 'oneLiner',
              title: 'One-liner Description',
              type: 'text',
              rows: 2,
              validation: Rule => Rule.required().max(200)
            },
            {
              name: 'contributor',
              title: 'Contributor',
              type: 'reference',
              to: [{ type: 'teamMember' }]
            }
          ],
          preview: {
            select: {
              tech: 'technology',
              desc: 'oneLiner',
              contributorName: 'contributor.name'
            },
            prepare({ tech, desc, contributorName }) {
              return {
                title: tech || 'Untitled',
                subtitle: contributorName ? `— ${contributorName}` : desc?.slice(0, 50)
              };
            }
          }
        }
      ],
      validation: Rule => Rule.required().min(1)
    }
  ],
  preview: {
    select: {
      sectionTitle: 'sectionTitle',
      items: 'items'
    },
    prepare({ sectionTitle, items }) {
      const count = items?.length || 0;
      return {
        title: `📡 ${sectionTitle || 'The Radar'}`,
        subtitle: `${count} item${count !== 1 ? 's' : ''}`
      };
    }
  }
};

// Reading Section (What We're Reading)
export const readingSection = {
  name: 'reading',
  title: "What We're Reading",
  type: 'object',
  fields: [
    {
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      description: 'Override the default "What We\'re Reading" title. Leave blank to use default.'
    },
    {
      name: 'items',
      title: 'Reading Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'readingItem',
          fields: [
            {
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: Rule => Rule.required()
            },
            {
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: Rule => Rule.required()
            },
            {
              name: 'blurb',
              title: 'Blurb',
              type: 'text',
              rows: 3,
              description: 'Brief description or why this is worth reading'
            }
          ],
          preview: {
            select: {
              title: 'title',
              blurb: 'blurb'
            },
            prepare({ title, blurb }) {
              return {
                title: title || 'Untitled',
                subtitle: blurb?.slice(0, 60)
              };
            }
          }
        }
      ],
      validation: Rule => Rule.required().min(1)
    }
  ],
  preview: {
    select: {
      sectionTitle: 'sectionTitle',
      items: 'items'
    },
    prepare({ sectionTitle, items }) {
      const count = items?.length || 0;
      return {
        title: `📚 ${sectionTitle || "What We're Reading"}`,
        subtitle: `${count} item${count !== 1 ? 's' : ''}`
      };
    }
  }
};

// Freeform Section (Flexible content block)
export const freeformSection = {
  name: 'freeform',
  title: 'Freeform Section',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Section Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'body',
      title: 'Content',
      ...portableTextConfig,
      validation: Rule => Rule.required()
    }
  ],
  preview: {
    select: {
      title: 'title'
    },
    prepare({ title }) {
      return {
        title: `✏️ ${title || 'Untitled Section'}`
      };
    }
  }
};

// Export all section types for use in the newsletter schema
export const newsletterSectionTypes = [
  openingNoteSection,
  essaySection,
  portfolioSpotlightSection,
  guestColumnSection,
  radarSection,
  readingSection,
  freeformSection
];
