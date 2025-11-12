require('dotenv').config({ path: '.env.local' });
const { client } = require('./src/sanity/client');

const updates = [
  {
    _id: "23e41827-8cfb-4685-b472-f53f59bcd849",
    relatedSectors: [{_type: "reference", _ref: "sector-robotics", _key: "a"}],
    relatedCompanies: [{_type: "reference", _ref: "hY1KZnhsaIM4Q2Zu6tPDFM", _key: "b"}]
  },
  {
    _id: "6kg5k912uqjIhBQgkxET11",
    relatedSectors: [{_type: "reference", _ref: "sector-genomics", _key: "c"}],
    relatedCompanies: [{_type: "reference", _ref: "6kg5k912uqjIhBQgkxERGd", _key: "d"}]
  },
  {
    _id: "hY1KZnhsaIM4Q2Zu6tPDWW",
    relatedSectors: [{_type: "reference", _ref: "sector-semiconductors", _key: "e"}],
    relatedCompanies: [{_type: "reference", _ref: "6kg5k912uqjIhBQgkxERhj", _key: "f"}]
  },
  {
    _id: "6kg5k912uqjIhBQgkxEVZ5",
    relatedSectors: [{_type: "reference", _ref: "sector-genomics", _key: "g"}],
    relatedCompanies: [{_type: "reference", _ref: "6kg5k912uqjIhBQgkxERGd", _key: "h"}]
  },
  {
    _id: "6kg5k912uqjIhBQgkxEW0B",
    relatedSectors: [{_type: "reference", _ref: "sector-robotics", _key: "i"}],
    relatedCompanies: [{_type: "reference", _ref: "hY1KZnhsaIM4Q2Zu6tPDFM", _key: "j"}]
  },
  {
    _id: "6kg5k912uqjIhBQgkxEXkZ",
    relatedSectors: [{_type: "reference", _ref: "sector-genomics", _key: "k"}],
    relatedCompanies: [{_type: "reference", _ref: "6kg5k912uqjIhBQgkxERGd", _key: "l"}]
  },
  {
    _id: "6kg5k912uqjIhBQgkxEZHP",
    relatedSectors: [{_type: "reference", _ref: "sector-artificial-intelligence", _key: "m"}],
    relatedCompanies: []
  }
];

const toDelete = [
  "8770e221-0728-4f9c-8b13-598973d8ba98",
  "cdb57fd8-e567-42c7-8ead-7913739fae15",
  "4Iu3Y5gQeqWF6lm0uvxQ4F",
  "4Iu3Y5gQeqWF6lm0uvxQyJ",
  "6kg5k912uqjIhBQgkxEWIF",
  "6kg5k912uqjIhBQgkxEWep",
  "6kg5k912uqjIhBQgkxEWwt",
  "4Iu3Y5gQeqWF6lm0uvxT6p",
  "6kg5k912uqjIhBQgkxEXAR",
  "hY1KZnhsaIM4Q2Zu6tPDzQ",
  "4Iu3Y5gQeqWF6lm0uvxULH",
  "4Iu3Y5gQeqWF6lm0uvxUpr"
];

async function run() {
  console.log('Updating tags...');
  for (const update of updates) {
    await client.patch(update._id)
      .set({
        relatedSectors: update.relatedSectors,
        relatedCompanies: update.relatedCompanies
      })
      .commit();
    console.log(`✓ Tagged ${update._id}`);
  }
  
  console.log('\nDeleting duplicates...');
  for (const id of toDelete) {
    await client.delete(id);
    console.log(`✗ Deleted ${id}`);
  }
  
  console.log('\n✅ Done!');
}

run().catch(console.error);
