// scripts/addBasePath.js
const fs = require('fs');
const path = require('path');

const basePath = '/yalivc'; // Make sure this matches your repo name
const outDir = path.join(__dirname, '..', 'out');

function addBasePathToHtml(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const updatedContent = content.replace(/(src|href)="\//g, `$1="${basePath}/`);
  fs.writeFileSync(filePath, updatedContent);
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath);
    } else if (path.extname(file) === '.html') {
      addBasePathToHtml(filePath);
    }
  });
}

walkDir(outDir);
console.log('Base path added to all HTML files in the out directory.');