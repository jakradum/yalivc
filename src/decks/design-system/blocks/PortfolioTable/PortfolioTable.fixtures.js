export const portfolioTableFixtures = {
  typical: {
    rows: [
      { name: 'Perceptyne', sector: 'Robotics', investmentStatus: 'active' },
      { name: 'C2i', sector: 'Fabless Semiconductor', investmentStatus: 'exited' },
      { name: '4baseCare', sector: 'Life Sciences', investmentStatus: 'active' },
    ],
  },
  empty: { rows: [] },
  'missing-sector': { rows: [{ name: 'New Co', investmentStatus: 'active' }] },
};
