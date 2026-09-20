// Slide order + text overrides for a deck (src/decks/decks/<id>/manifest.js
// still defines every slide's type and data source — this document only
// orders them and overrides copy). One document per deck, id
// `deckManifest-<deckId>`. Written by the deck builder as a DRAFT; the
// published version is what the public deck routes render.
export default {
  name: 'deckManifest',
  title: 'Deck Manifest',
  type: 'document',
  fields: [
    { name: 'deckId', title: 'Deck ID', type: 'string', readOnly: true },
    {
      name: 'slides',
      title: 'Slides (in order)',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'deckSlide',
          fields: [
            { name: 'id', title: 'Slide instance ID', type: 'string' },
            { name: 'ref', title: 'Slide definition (code manifest ID, or "section-divider")', type: 'string' },
            { name: 'props', title: 'Prop overrides (JSON)', type: 'text', rows: 3 },
          ],
          preview: { select: { title: 'id', subtitle: 'ref' } },
        },
      ],
    },
    {
      name: 'editLog',
      title: 'Edit log (last 50)',
      type: 'array',
      readOnly: true,
      of: [
        {
          type: 'object',
          name: 'deckEdit',
          fields: [
            { name: 'at', type: 'datetime' },
            { name: 'by', type: 'string' },
            { name: 'prompt', type: 'text' },
            { name: 'summary', type: 'text' },
            { name: 'before', title: 'Slides before this edit (JSON, for undo)', type: 'text' },
          ],
          preview: { select: { title: 'summary', subtitle: 'by' } },
        },
      ],
    },
  ],
  preview: { select: { title: 'deckId' } },
};
