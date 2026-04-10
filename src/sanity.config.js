import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './sanity/schemaTypes';
import { SendBetaTestAction } from './sanity/actions/sendBetaTestAction';
import { SendFullListAction } from './sanity/actions/sendFullListAction';
import { GeneratePdfAction } from './sanity/actions/generatePdfAction';

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
                      .title('Newsletter')
                      .child(
                        S.list()
                          .title('Newsletter')
                          .items([
                            S.listItem().title('Issues').child(S.documentTypeList('newsletter').title('Newsletters')),
                            S.divider(),
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
            S.divider(),
            // Data Room
            S.listItem()
              .title('Data Room')
              .child(
                S.list()
                  .title('Data Room')
                  .items([
                    S.listItem()
                      .title('Section Visibility')
                      .child(S.document().schemaType('dataroomSectionVisibility').documentId('dataroomSectionVisibility')),
                    S.divider(),
                    S.listItem()
                      .title('Dealflow & Pipeline')
                      .child(S.documentList().title('Dealflow & Pipeline').filter('_type == "dataRoomDocument" && category == "pipeline"').schemaType('dataRoomDocument')),
                    S.listItem()
                      .title('PPM & Agreements')
                      .child(S.documentList().title('PPM & Agreements').filter('_type == "dataRoomDocument" && category == "ppm-agreements"').schemaType('dataRoomDocument')),
                    S.listItem()
                      .title('Presentations')
                      .child(S.documentList().title('Presentations').filter('_type == "dataRoomDocument" && category == "presentations"').schemaType('dataRoomDocument')),
                    S.listItem()
                      .title('Regulatory Documents')
                      .child(S.documentList().title('Regulatory Documents').filter('_type == "dataRoomDocument" && category == "regulatory-documents"').schemaType('dataRoomDocument')),
                    S.listItem()
                      .title('Track Record / Recommendation')
                      .child(S.documentList().title('Track Record / Recommendation').filter('_type == "dataRoomDocument" && category == "recommendation"').schemaType('dataRoomDocument')),
                    S.divider(),
                    S.listItem()
                      .title('All Documents')
                      .child(S.documentTypeList('dataRoomDocument').title('All Documents')),
                  ])
              ),
            S.divider(),
            // Track Record
            S.listItem()
              .title('Track Record')
              .child(S.documentTypeList('trackRecord').title('Track Record')),
          ]),
    }),
    visionTool(),
  ],

    studio: {
    components: {
      navbar: () => null
    }
  },

  document: {
    actions: (prev, { schemaType }) => {
      if (schemaType === 'newsletter') {
        return [...prev, SendBetaTestAction, SendFullListAction];
      }
      if (schemaType === 'lpQuarterlyReport') {
        return [...prev, GeneratePdfAction];
      }
      return prev;
    },
  },

  schema: {
    types: schemaTypes,
  },

  basePath: '/console',
});
