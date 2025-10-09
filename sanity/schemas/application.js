export default {
  name: 'application',
  title: 'Funding Applications',
  type: 'document',
  fields: [
    // Applicant Data (read-only in Studio)
    {
      name: 'fullName',
      title: 'Full Name',
      type: 'string',
      validation: Rule => Rule.required(),
      readOnly: true
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule.required().email(),
      readOnly: true
    },
    {
      name: 'companyName',
      title: 'Company Name',
      type: 'string',
      validation: Rule => Rule.required(),
      readOnly: true
    },
    {
      name: 'pitch',
      title: '100-word Pitch',
      type: 'text',
      validation: Rule => Rule.required().max(700),
      readOnly: true
    },
    {
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      validation: Rule => Rule.required(),
      readOnly: true
    },
    
    // For Official Use
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'New', value: 'new'},
          {title: 'Under Review', value: 'under_review'},
          {title: 'Dismiss - Not Proceeding', value: 'dismiss'},
          {title: 'Progress - Proceeding', value: 'progress'},
          {title: 'Closed', value: 'closed'}
        ]
      },
      initialValue: 'new',
      validation: Rule => Rule.required()
    },
    {
      name: 'assignedTo',
      title: 'Assigned To',
      type: 'reference',
      to: [{type: 'teamMember'}]
    },
    {
      name: 'internalNotes',
      title: 'Internal Notes',
      type: 'text',
      rows: 5
    },
    {
      name: 'lastUpdatedAt',
      title: 'Last Updated',
      type: 'datetime',
      readOnly: true
    },
    {
      name: 'lastUpdatedBy',
      title: 'Last Updated By',
      type: 'string',
      readOnly: true
    }
  ],
  preview: {
    select: {
      title: 'companyName',
      subtitle: 'fullName',
      status: 'status',
      date: 'submittedAt'
    },
    prepare({title, subtitle, status, date}) {
      return {
        title,
        subtitle: `${subtitle} - ${status} (${new Date(date).toLocaleDateString()})`
      }
    }
  },
  orderings: [
    {
      title: 'Newest First',
      name: 'submittedDesc',
      by: [{field: 'submittedAt', direction: 'desc'}]
    },
    {
      title: 'Status',
      name: 'status',
      by: [{field: 'status', direction: 'asc'}]
    }
  ]
}