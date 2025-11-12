const { client } = require('./src/sanity/client');

async function test() {
  const sector = await client.fetch(`*[_type == "sector" && slug.current == "robotics"][0]{ _id, name }`);
  console.log('Sector:', sector);
  
  const news = await client.fetch(`*[_type == "news" && "robotics" in relatedSectors[]->slug.current]{ _id, headlineEdited }`);
  console.log('News by slug:', news);
}

test();
