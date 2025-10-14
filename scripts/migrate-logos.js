// scripts/migrate-logos.js
const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

const client = createClient({
  projectId: 'nt0wmty3',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01'
});

const logoMap = {
  'Aurasemi': 'logos/aura semi.png',
  'BluArmor': 'logos/bluarmor.png',
  'Cadence': 'logos/cadence-1.png',
  'Cirel Systems': 'logos/cirel-systems-1.png',
  'Cosmic Circuits': 'logos/cosmic circuits.png',
  'Data Patterns': 'logos/data-pattens-1.png',
  'Ethereal Machines': 'logos/ethereal-machines-1.png',
  'GalaxEye': 'logos/galaxeye-1.png',
  'Greenstone Biosciences': 'logos/greenstone.png',
  'Kyulux': 'logos/kyulux-1.png',
  'Artera': 'logos/artera.png',
  'MTAR Technologies': 'logos/mtar.png',
  'NanoSemi': 'logos/nanosemi-inc-1.png',
  'SambaNova Systems': 'logos/SambaNova-dark-logo-1.png',
  'Tonbo Imaging': 'logos/tonbo.png',
  'Haystack Analytics': 'logos/haystack.svg',
  'Walden International': 'logos/walden.jpeg',
  'ideaForge': 'logos/ideaforge.png',
  '4baseCare': 'logos/4basecare.png',
  'Perceptyne': 'logos/perceptyne.png',
  'C2i': 'logos/C2i.webp',
};

async function uploadLogos() {
  for (const [companyName, logoPath] of Object.entries(logoMap)) {
    const filePath = path.join(__dirname, '../public', logoPath);
    
    // Upload asset
    const asset = await client.assets.upload('image', fs.createReadStream(filePath), {
      filename: path.basename(logoPath)
    });
    
    // Link to company
    await client
      .patch({ query: `*[_type == "company" && name == "${companyName}"][0]` })
      .set({ logo: { _type: 'image', asset: { _ref: asset._id } } })
      .commit();
    
    console.log(`✓ ${companyName}`);
  }
}

uploadLogos();