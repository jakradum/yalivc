import { SlugWithUrlPreview } from '../components/SlugWithUrlPreview';

const letterheadDocument = {
  name: 'letterheadDocument',
  title: 'Letterhead Documents',
  type: 'document',
  fields: [
    {
      name: 'subject',
      title: 'Subject',
      type: 'string',
      description: 'The subject line shown on the letter (e.g. "Certificate of Investment")',
      validation: Rule => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'subject', maxLength: 96 },
      validation: Rule => Rule.required(),
      components: { input: SlugWithUrlPreview },
    },
    {
      name: 'date',
      title: 'Date',
      type: 'date',
      options: { dateFormat: 'MMMM D, YYYY' },
      validation: Rule => Rule.required(),
    },
    {
      name: 'reference',
      title: 'Reference Number',
      type: 'string',
      description: 'Optional — e.g. YPLP/FIN/2026/001',
    },
    {
      name: 'salutation',
      title: 'Salutation',
      type: 'string',
      description: 'e.g. "To Whom It May Concern" or "Dear Mr. Sharma"',
      validation: Rule => Rule.required(),
      initialValue: 'To Whom It May Concern',
    },
    {
      name: 'body',
      title: 'Letter Body',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Underline', value: 'underline' },
            ],
            annotations: [],
          },
        },
      ],
      validation: Rule => Rule.required(),
    },
    {
      name: 'closing',
      title: 'Closing',
      type: 'string',
      description: 'e.g. "Yours sincerely," or "Warm regards,"',
      initialValue: 'Yours sincerely,',
      validation: Rule => Rule.required(),
    },
    {
      name: 'signatory',
      title: 'Signatory',
      type: 'reference',
      to: [{ type: 'teamMember' }],
      description: 'The team member whose name and role appear below the closing',
      validation: Rule => Rule.required(),
    },
  ],
  preview: {
    select: {
      title: 'subject',
      subtitle: 'date',
      signatoryName: 'signatory.name',
    },
    prepare({ title, subtitle, signatoryName }) {
      return {
        title: title || 'Untitled letter',
        subtitle: [subtitle, signatoryName].filter(Boolean).join(' · '),
      };
    },
  },
};

export default letterheadDocument;
