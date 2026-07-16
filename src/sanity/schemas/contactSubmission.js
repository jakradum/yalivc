const INQUIRY_OPTIONS = [
  { title: 'Press / media inquiry', value: 'press' },
  { title: 'Partnership', value: 'partnership' },
];

const STATUS_OPTIONS = [
  { title: 'New', value: 'new' },
  { title: 'Read', value: 'read' },
  { title: 'Actioned', value: 'actioned' },
  { title: 'Processed by cron', value: 'processed' },
];

const BUCKET_OPTIONS = [
  { title: 'Press (established outlet)', value: 'press-established' },
  { title: 'Press (general)', value: 'press-general' },
  { title: 'Partnership', value: 'partnership' },
  { title: 'Borderline', value: 'borderline' },
  { title: 'Spam', value: 'spam' },
];

const contactSubmission = {
  name: 'contactSubmission',
  title: 'Contact Submissions',
  type: 'document',
  fields: [
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: STATUS_OPTIONS, layout: 'radio', direction: 'horizontal' },
      initialValue: 'new',
    },
    {
      name: 'inquiryType',
      title: 'Inquiry type',
      type: 'string',
      options: { list: INQUIRY_OPTIONS },
      readOnly: true,
    },
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'message',
      title: 'Message',
      type: 'text',
      readOnly: true,
    },
    {
      name: 'submittedAt',
      title: 'Submitted at',
      type: 'datetime',
      readOnly: true,
    },
    {
      name: 'processedAt',
      title: 'Processed at (cron)',
      type: 'datetime',
      readOnly: true,
    },
    {
      name: 'haikuScore',
      title: 'Legitimacy score (Haiku)',
      type: 'number',
      readOnly: true,
      description: 'Combined score 0-1. ≥0.70 legit, 0.40-0.69 borderline, <0.40 spam',
    },
    {
      name: 'haikuBucket',
      title: 'Classification (Haiku)',
      type: 'string',
      readOnly: true,
      options: { list: BUCKET_OPTIONS },
    },
    {
      name: 'haikuReasoning',
      title: 'Haiku reasoning',
      type: 'text',
      readOnly: true,
    },
    {
      name: 'autoResponded',
      title: 'Auto-responded',
      type: 'boolean',
      readOnly: true,
    },
  ],
  preview: {
    select: {
      inquiryType: 'inquiryType',
      name: 'name',
      email: 'email',
      submittedAt: 'submittedAt',
      status: 'status',
      haikuScore: 'haikuScore',
      haikuBucket: 'haikuBucket',
    },
    prepare({ inquiryType, name, email, submittedAt, status, haikuScore, haikuBucket }) {
      const date = submittedAt ? new Date(submittedAt).toLocaleDateString('en-IN') : '';
      const statusIcon = status === 'new' ? '🔵' : status === 'read' ? '⚪' : status === 'processed' ? '🤖' : '✅';
      const bucketIcon = haikuBucket === 'spam' ? '🚫' : haikuBucket === 'borderline' ? '🟡' : haikuScore >= 0.7 ? '🟢' : '';
      const scoreStr = haikuScore != null ? ` · ${(haikuScore * 100).toFixed(0)}%` : '';
      const label = INQUIRY_OPTIONS.find((o) => o.value === inquiryType)?.title ?? inquiryType ?? 'Unknown type';
      return {
        title: `${statusIcon}${bucketIcon} ${name || email || 'Unknown'} · ${label}`,
        subtitle: `${email || ''}${scoreStr} · ${date}`,
      };
    },
  },
  orderings: [
    {
      title: 'Most Recent',
      name: 'submittedAtDesc',
      by: [{ field: 'submittedAt', direction: 'desc' }],
    },
    {
      title: 'Status',
      name: 'statusAsc',
      by: [{ field: 'status', direction: 'asc' }, { field: 'submittedAt', direction: 'desc' }],
    },
  ],
};

export default contactSubmission;
