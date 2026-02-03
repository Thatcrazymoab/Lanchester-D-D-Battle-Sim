export enum LawType {
  SQUARE = 'SQUARE', // Aimed Fire (Standard Ranged/Magic)
  LINEAR = 'LINEAR', // Unaimed Fire / Melee Saturation
}

export interface UnitStats {
  name: string;
  count: number;
  hp: number;
  ac: number;
  attackBonus: number;
  damageDiceAvg: number; // e.g., 1d8 = 4.5
  damageMod: number;
}

export interface SimulationStep {
  time: number;
  countA: number;
  countB: number;
}

export interface DiscreteStep {
  round: number;
  countA: number;
  countB: number;
  casualtiesA: number;
  casualtiesB: number;
}

export interface SimulationResult {
  continuousSteps: SimulationStep[];
  discreteSteps: DiscreteStep[];
  winner: 'A' | 'B' | 'Draw';
  duration: number; // Duration of continuous model
  discreteDuration: number; // Duration of turn-based model
  alpha: number; // Effectiveness of B against A
  beta: number;  // Effectiveness of A against B
}