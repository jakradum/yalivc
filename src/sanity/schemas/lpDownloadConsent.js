const lpDownloadConsent = {
  name: 'lpDownloadConsent',
  title: 'LP Download Consent',
  type: 'document',
  fields: [
    {
      name: 'email',
      title: 'User Email',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Email of the LP who downloaded the file',
    },
    {
      name: 'downloadType',
      title: 'Download Type',
      type: 'string',
      options: {
        list: [
          { title: 'Quarterly Report PDF', value: 'quarterly-report' },
          { title: 'Fund Financials', value: 'fund-financials' },
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'reportQuarter',
      title: 'Report Quarter',
      type: 'string',
      description: 'E.g., Q3 FY26',
    },
    {
      name: 'fileName',
      title: 'File Name',
      type: 'string',
      description: 'Name or identifier of the downloaded file',
    },
    {
      name: 'consentedAt',
      title: 'Consented At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'ipAddress',
      title: 'IP Address',
      type: 'string',
      description: 'IP address at time of download (optional)',
    },
  ],
  preview: {
    select: {
      email: 'email',
      downloadType: 'downloadType',
      reportQuarter: 'reportQuarter',
      consentedAt: 'consentedAt',
    },
    prepare({ email, downloadType, reportQuarter, consentedAt }) {
      const date = consentedAt ? new Date(consentedAt).toLocaleDateString('en-IN') : '';
      const type = downloadType === 'quarterly-report' ? 'Report' : 'Financials';
      return {
        title: email,
        subtitle: `${type} - ${reportQuarter || 'N/A'} - ${date}`,
      };
    },
  },
  orderings: [
    {
      title: 'Most Recent',
      name: 'consentedAtDesc',
      by: [{ field: 'consentedAt', direction: 'desc' }],
    },
  ],
};

export default lpDownloadConsent;
