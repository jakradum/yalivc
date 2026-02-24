import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './sanity/schemaTypes';

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
            // Core Content
            S.listItem()
              .title('Core Content')
              .child(
                S.list()
                  .title('Core Content')
                  .items([
                    S.listItem()
                      .title('Investment Philosophy')
                      .child(S.document().schemaType('investmentPhilosophy').documentId('investmentPhilosophy')),
                    S.listItem().title('Portfolio Companies').child(S.documentTypeList('company').title('Companies')),
                    S.listItem().title('Categories').child(S.documentTypeList('category').title('Categories')),
                    S.listItem().title('Team Members').child(S.documentTypeList('teamMember').title('Team')),
                  ])
              ),
            S.divider(),
            // Site Content
            S.listItem()
              .title('Site Content')
              .child(
                S.list()
                  .title('Site Content')
                  .items([
                    S.listItem().title('Blog Posts').child(S.documentTypeList('blogPost').title('Blog Posts')),
                    S.listItem()
                      .title('Newsletter (Tattva)')
                      .child(
                        S.list()
                          .title('Newsletter (Tattva)')
                          .items([
                            S.listItem().title('Issues').child(S.documentTypeList('newsletter').title('Newsletters')),
                            S.listItem().title('Subscribers').child(S.documentTypeList('newsletterSubscriber').title('Subscribers')),
                          ])
                      ),
                    S.listItem().title('News Articles').child(S.documentTypeList('news').title('News')),
                    S.listItem().title('Social Updates').child(S.documentTypeList('socialUpdate').title('Social Updates')),
                    S.listItem().title('Publications').child(S.documentTypeList('publication').title('Publications')),
                    S.listItem().title('FAQ').child(S.documentTypeList('faq').title('FAQ')),
                  ])
              ),
            S.divider(),
            // LP Portal
            S.listItem()
              .title('LP Portal')
              .child(
                S.list()
                  .title('LP Portal')
                  .items([
                    // Fund Settings (singleton)
                    S.listItem()
                      .title('Fund Settings')
                      .child(
                        S.document()
                          .schemaType('lpFundSettings')
                          .documentId('lpFundSettings')
                      ),
                    S.divider(),
                    S.listItem()
                      .title('Investors')
                      .child(S.documentTypeList('investor').title('Investors')),
                    S.listItem()
                      .title('Pipeline Deals')
                      .child(S.documentTypeList('lpPipelineDeal').title('Pipeline')),
                    S.divider(),
                    S.listItem()
                      .title('LP Quarterly Reports')
                      .child(S.documentTypeList('lpQuarterlyReport').title('LP Reports')),
                    S.divider(),
                    S.listItem()
                      .title('Portal Users')
                      .child(S.documentTypeList('portalUser').title('Portal Users')),
                    S.divider(),
                    S.listItem()
                      .title('Portal Feedback (NPS)')
                      .child(S.documentTypeList('lpPortalFeedback').title('Portal Feedback')),
                  ])
              ),
          ]),
    }),
    visionTool(),
  ],

    studio: {
    components: {
      navbar: () => null
    }
  },

  schema: {
    types: schemaTypes,
  },

  basePath: '/console',
});
