import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './sanity/schemas'

export default defineConfig({
  name: 'default',
  title: 'YALI Capital CMS',

  projectId: 'nt0wmty3',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Portfolio Companies')
              .child(S.documentTypeList('company').title('Companies')),
            S.listItem()
              .title('News Articles')
              .child(S.documentTypeList('news').title('News')),
            S.listItem()
              .title('Team Members')
              .child(S.documentTypeList('teamMember').title('Team')),
            S.listItem()
              .title('Categories')
              .child(S.documentTypeList('category').title('Categories')),
            S.listItem()
              .title('Publications')
              .child(S.documentTypeList('publication').title('Publications')),
            S.divider(),
            S.listItem()
              .title('Blog Posts')
              .child(S.documentTypeList('blogPost').title('Blog Posts')),
            S.listItem()
              .title('Quarterly Reports')
              .child(S.documentTypeList('quarterlyReport').title('Reports'))
          ])
    }),
    visionTool()
  ],

  schema: {
    types: schemaTypes,
  },

  basePath: '/console'
})