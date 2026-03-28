const trackRecord = {
  name: 'trackRecord',
  title: 'Track Record',
  type: 'document',
  fields: [
    {
      name: 'investor',
      title: 'Investor',
      type: 'reference',
      to: [{ type: 'teamMember' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'investeeName',
      title: 'Investee Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'investmentOrg',
      title: 'Investment Organisation',
      type: 'string',
    },
    {
      name: 'year',
      title: 'Investment Year',
      type: 'number',
    },
    {
      name: 'sector',
      title: 'Sector',
      type: 'string',
    },
    {
      name: 'amountInvested',
      title: 'Amount Invested',
      type: 'object',
      fields: [
        {
          name: 'currency',
          title: 'Currency',
          type: 'string',
          options: {
            list: [{ title: 'USD ($)', value: 'USD' }, { title: 'INR (₹)', value: 'INR' }],
            layout: 'radio',
          },
          initialValue: 'USD',
        },
        {
          name: 'value',
          title: 'Amount',
          type: 'number',
          description: 'Enter full number e.g. 5000000 for $5M',
        },
      ],
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Exited (Full)', value: 'exited-full' },
          { title: 'Exited (Partial)', value: 'exited-partial' },
          { title: 'Unexited', value: 'unexited' },
          { title: 'Not Exited', value: 'not-exited' },
          { title: 'Series A Raised', value: 'series-a-raised' },
          { title: 'Series B Raised', value: 'series-b-raised' },
        ],
      },
    },
    {
      name: 'exitYear',
      title: 'Exit Year',
      type: 'number',
    },
    {
      name: 'exitAmountOrValuation',
      title: 'Exit Amount / Valuation',
      type: 'object',
      fields: [
        {
          name: 'currency',
          title: 'Currency',
          type: 'string',
          options: {
            list: [{ title: 'USD ($)', value: 'USD' }, { title: 'INR (₹)', value: 'INR' }],
            layout: 'radio',
          },
          initialValue: 'USD',
        },
        {
          name: 'value',
          title: 'Amount',
          type: 'number',
          description: 'Enter full number e.g. 5000000 for $5M',
        },
      ],
    },
    {
      name: 'irr',
      title: 'IRR (%)',
      type: 'number',
    },
  ],
  preview: {
    select: {
      title: 'investeeName',
      subtitle: 'investmentOrg',
      status: 'status',
      year: 'year',
    },
    prepare({ title, subtitle, status, year }) {
      return {
        title,
        subtitle: [subtitle, year, status].filter(Boolean).join(' · '),
      };
    },
  },
};

export default trackRecord;
