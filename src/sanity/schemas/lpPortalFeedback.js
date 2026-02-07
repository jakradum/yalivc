const lpPortalFeedback = {
  name: 'lpPortalFeedback',
  title: 'LP Portal Feedback',
  type: 'document',
  fields: [
    {
      name: 'email',
      title: 'User Email',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Email of the LP who submitted feedback',
    },
    {
      name: 'npsScore',
      title: 'NPS Score',
      type: 'number',
      validation: (Rule) => Rule.required().min(0).max(10),
      description: 'Net Promoter Score (0-10)',
    },
    {
      name: 'reportQuarter',
      title: 'Report Quarter Viewed',
      type: 'string',
      description: 'Which quarter report they were viewing when submitting feedback',
    },
    {
      name: 'feedbackDetails',
      title: 'Feedback Details',
      type: 'text',
      description: 'Additional comments (shown if score < 8)',
    },
    {
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },
  ],
  preview: {
    select: {
      email: 'email',
      npsScore: 'npsScore',
      reportQuarter: 'reportQuarter',
      submittedAt: 'submittedAt',
    },
    prepare({ email, npsScore, reportQuarter, submittedAt }) {
      const date = submittedAt ? new Date(submittedAt).toLocaleDateString('en-IN') : '';
      const scoreEmoji = npsScore >= 9 ? '🟢' : npsScore >= 7 ? '🟡' : '🔴';
      return {
        title: `${scoreEmoji} ${npsScore}/10 - ${email}`,
        subtitle: `${reportQuarter || 'N/A'} - ${date}`,
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
      title: 'Score (Low to High)',
      name: 'npsScoreAsc',
      by: [{ field: 'npsScore', direction: 'asc' }],
    },
  ],
};

export default lpPortalFeedback;
