/**
 * pdf-svgs.js
 * Renders sector vector SVGs to static HTML strings for use in PDF pages.
 * Uses dynamic imports to avoid Next.js App Router restrictions on react-dom/server.
 */

const SECTOR_FILES = {
  genomics: () => import('@/app/components/icons/background svgs/category svgs/genomics vector'),
  defence: () => import('@/app/components/icons/background svgs/category svgs/defence vector'),
  lifeSciences: () => import('@/app/components/icons/background svgs/category svgs/life sciennces vector'),
  semicon: () => import('@/app/components/icons/background svgs/category svgs/semicon vector'),
};

const SECTOR_EXPORT_NAMES = {
  genomics: 'GenomicsVector',
  defence: 'DefenceVector',
  lifeSciences: 'LifeSciencesVector',
  semicon: 'SemiconVector',
};

const QUARTER_SECTOR = {
  Q1: 'genomics',
  Q2: 'defence',
  Q3: 'lifeSciences',
  Q4: 'semicon',
};

async function renderSector(sectorKey, strokeColor = 'white') {
  const loader = SECTOR_FILES[sectorKey];
  if (!loader) return '';
  try {
    const [mod, { createElement }, { renderToStaticMarkup }] = await Promise.all([
      loader(),
      import('react'),
      import('react-dom/server'),
    ]);
    const Vector = mod[SECTOR_EXPORT_NAMES[sectorKey]];
    if (!Vector) return '';
    return renderToStaticMarkup(createElement(Vector, { strokeColor }));
  } catch (err) {
    console.error('[pdf-svgs] Failed to render SVG:', sectorKey, err);
    return '';
  }
}

// Cover page: white stroke over burgundy background — randomly pick a sector each generation
export async function getCoverSvgHtml(_quarter) {
  const sectors = Object.keys(SECTOR_FILES);
  const randomSector = sectors[Math.floor(Math.random() * sectors.length)];
  return renderSector(randomSector, 'white');
}

// Separator — Portfolio Company Updates: life sciences (DNA helix), grey stroke
export async function getPortfolioUpdatesSvgHtml() {
  return renderSector('lifeSciences', '#c0bfbf');
}

// Separator — Fund Financials: semiconductors (atomic/orbital), grey stroke
export async function getFundFinancialsSvgHtml() {
  return renderSector('semicon', '#c0bfbf');
}

// Separator — Pipeline Summary: defence (satellite), grey stroke
export async function getPipelineSvgHtml() {
  return renderSector('defence', '#c0bfbf');
}
