import {portableTextConfig} from './portableTextConfig';

export default {
  name: 'investmentPhilosophy',
  title: 'Investment Philosophy',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    {
      name: 'philosophyText',
      title: 'Investment Philosophy',
      description: 'YALI\'s investment approach and thesis',
      ...portableTextConfig,
      validation: Rule => Rule.required()
    },
    {
      name: 'lastUpdated',
      title: 'Last Updated',
      type: 'datetime',
      description: 'Auto-updated when changes are published',
      readOnly: true
    }
  ],
  preview: {
    prepare() {
      return {
        title: 'Investment Philosophy',
        subtitle: 'Singleton document'
      }
    }
  }
}
