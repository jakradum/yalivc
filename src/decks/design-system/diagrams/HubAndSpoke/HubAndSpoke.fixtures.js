const CORE_6 = ['Life Sciences', 'Smart Manufacturing', 'Fabless Semiconductor', 'Artificial Intelligence', 'Robotics', 'Aerospace & Surveillance'].map((label) => ({ label }));
const ADJACENT_4 = ['Space Tech', 'Quantum', 'Energy', 'Advanced Materials'].map((label) => ({ label }));

export const hubAndSpokeFixtures = {
  'typical-6-and-4': { core: CORE_6, adjacent: ADJACENT_4 },
  'core-only': { core: CORE_6, adjacent: [] },
  'three-and-three': { core: CORE_6.slice(0, 3), adjacent: ADJACENT_4.slice(0, 3) },
  'eight-core': { core: [...CORE_6, { label: 'Extra One' }, { label: 'Extra Two' }], adjacent: ADJACENT_4 },
};
