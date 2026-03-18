import { DefenceVector } from './defence vector';
import { ArtificialIntelligenceVector } from './artificial intelligence vector';
import { LifeSciencesVector } from './life sciennces vector';
import { RoboticsVector } from './robotics vector';
import { SemiconVector } from './semicon vector';
import { AdvancedManufacturingVector } from './advanced manufacturing vector';

const DARK = '#363636';

export const DarkDefenceVector = () => <DefenceVector strokeColor={DARK} />;
export const DarkAIVector = () => <ArtificialIntelligenceVector strokeColor={DARK} />;
export const DarkLifeSciencesVector = () => <LifeSciencesVector strokeColor={DARK} />;
export const DarkRoboticsVector = () => <RoboticsVector strokeColor={DARK} />;
export const DarkSemiconVector = () => <SemiconVector strokeColor={DARK} />;
export const DarkAdvancedManufacturingVector = () => <AdvancedManufacturingVector strokeColor={DARK} />;

export const darkVectorBank = [
  DarkDefenceVector,
  DarkAIVector,
  DarkLifeSciencesVector,
  DarkRoboticsVector,
  DarkSemiconVector,
  DarkAdvancedManufacturingVector,
];
