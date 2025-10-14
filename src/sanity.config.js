import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
import { schemaTypes } from './sanity/schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'YALI Capital CMS',

  projectId: 'nt0wmty3',
  dataset: 'production',

  plugins: [
    deskTool({
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

  // Custom base path for Studio
  basePath: '/console'
})