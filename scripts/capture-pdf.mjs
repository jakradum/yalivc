import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:3000/about-yali/pranav-karnad';
const outputPath = process.argv[3] || 'team-profile.pdf';

async function capturePDF() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set viewport to desktop width
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto(url, { waitUntil: 'networkidle0' });

  // Wait for images to load
  await page.waitForTimeout(2000);

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });

  console.log(`PDF saved to ${outputPath}`);
  await browser.close();
}

capturePDF();
