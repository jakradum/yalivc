import {portableTextConfig} from './portableTextConfig';

export default {
  name: 'blogPost',
  title: 'Blog Posts',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'blurb',
      title: 'Short Description',
      type: 'text',
      rows: 3,
      description: '150-200 characters',
      validation: Rule => Rule.max(200)
    },
    {
      name: 'contentType',
      title: 'Content Type',
      type: 'string',
      options: {
        list: [
          {title: 'Blog Post', value: 'blog'},
          {title: 'Press Release', value: 'press-release'},
          {title: 'Resource', value: 'resource'}
        ],
        layout: 'radio'
      },
      initialValue: 'blog',
      validation: Rule => Rule.required()
    },
    {
      name: 'body',
      title: 'Body',
      ...portableTextConfig
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'teamMember'}],
      validation: Rule => Rule.required()
    },
    {
      name: 'categories',
      title: 'Related Categories',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'category'}]}],
      description: 'Tag relevant investment categories'
    },
    {
      name: 'companies',
      title: 'Related Companies',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'company'}]}],
      description: 'Tag portfolio companies mentioned'
    },
    {
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt text'
        }
      ]
    },
    {
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      validation: Rule => Rule.required()
    },
    {
      name: 'featured',
      title: 'Featured Post',
      type: 'boolean',
      description: 'Show on homepage or top of blog listing',
      initialValue: false
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Published', value: 'published'},
          {title: 'Archived', value: 'archived'}
        ],
        layout: 'radio'
      },
      initialValue: 'draft',
      validation: Rule => Rule.required()
    },
    {
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'SEO title (leave blank to use post title)',
      validation: Rule => Rule.max(60)
    },
    {
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 2,
      description: 'SEO description (leave blank to use blurb)',
      validation: Rule => Rule.max(160)
    },
    {
      name: 'ogImage',
      title: 'Social Share Image',
      type: 'image',
      description: 'Image for social media shares (leave blank to use featured image)',
      options: {hotspot: true}
    }
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'featuredImage',
      contentType: 'contentType',
      status: 'status'
    },
    prepare({title, author, media, contentType, status}) {
      const typeLabel = contentType === 'resource' ? '📚' : contentType === 'press-release' ? '📰' : '📝';
      const statusLabel = status === 'published' ? '✓' : status === 'archived' ? '🗃️' : '✏️';
      return {
        title: `${typeLabel} ${title}`,
        subtitle: `${statusLabel} ${author ? `by ${author}` : 'No author'}`,
        media
      }
    }
  },
  orderings: [
    {
      title: 'Published Date, Newest',
      name: 'publishedDesc',
      by: [{field: 'publishedAt', direction: 'desc'}]
    },
    {
      title: 'Published Date, Oldest',
      name: 'publishedAsc',
      by: [{field: 'publishedAt', direction: 'asc'}]
    }
  ]
}
