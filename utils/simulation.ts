import { UnitStats, SimulationStep, SimulationResult, LawType, DiscreteStep } from '../types';

export const calculateEffectiveDPR = (attacker: UnitStats, defender: UnitStats): number => {
  let hitChance = (21 + attacker.attackBonus - defender.ac) / 20;
  hitChance = Math.max(0.05, Math.min(0.95, hitChance));

  const avgHitDmg = attacker.damageDiceAvg + attacker.damageMod;
  const critDamage = 0.05 * attacker.damageDiceAvg;

  return (hitChance * avgHitDmg) + critDamage;
};

export const calculateCoefficient = (attacker: UnitStats, target: UnitStats): number => {
  const dpr = calculateEffectiveDPR(attacker, target);
  return dpr / target.hp;
};

// Continuous Model (Analytical/High-Res Euler)
const runContinuousSimulation = (
  unitA: UnitStats,
  unitB: UnitStats,
  law: LawType,
  alpha: number,
  beta: number,
  maxTime: number
): { steps: SimulationStep[], duration: number, winner: 'A' | 'B' | 'Draw' } => {
  const steps: SimulationStep[] = [];
  let duration = maxTime;
  let winner: 'A' | 'B' | 'Draw' = 'Draw';

  const a0 = unitA.count;
  const b0 = unitB.count;

  // For Square Law, we can use Analytical Solutions.
  // Using Exponential form: A(t) = C1*e^(kt) + C2*e^(-kt)
  if (law === LawType.SQUARE) {
    const k = Math.sqrt(alpha * beta);
    // Avoid division by zero
    if (k === 0) return { steps: [{time: 0, countA: a0, countB: b0}], duration: 0, winner: 'Draw' };
    
    // Constants for A(t)
    // A(0) = a0  => C1 + C2 = a0
    // A'(0) = -alpha * b0 => k(C1 - C2) = -alpha * b0
    const termA = (alpha * b0) / k;
    const c1_a = 0.5 * (a0 - termA);
    const c2_a = 0.5 * (a0 + termA);

    // Constants for B(t)
    // B(0) = b0 => C3 + C4 = b0t
    // B'(0) = -beta * a0 => k(C3 - C4) = -beta * a0
    const termB = (beta * a0) / k;
    const c1_b = 0.5 * (b0 - termB);
    const c2_b = 0.5 * (b0 + termB);

    // Dynamic step size for plotting smoothness
    const dt = 0.1; 
    
    for (let t = 0; t <= maxTime; t += dt) {
      const timeVal = parseFloat(t.toFixed(2));
      
      const e_kt = Math.exp(k * t);
      const e_neg_kt = Math.exp(-k * t);

      // Analytical Equations (Exponential Form)
      let at = (c1_a * e_kt) + (c2_a * e_neg_kt);
      let bt = (c1_b * e_kt) + (c2_b * e_neg_kt);

      // Check termination
      if (at <= 0 || bt <= 0) {
        // Find exact crossing point roughly
        if (at < 0) at = 0;
        if (bt < 0) bt = 0;
        steps.push({ time: timeVal, countA: at, countB: bt });
        
        duration = timeVal;
        winner = at > bt ? 'A' : 'B';
        break;
      }

      steps.push({ time: timeVal, countA: at, countB: bt });
    }
  } else {
    // Linear Law (Euler Integration is sufficient and easier for coupled Linear)
    // dA/dt = -alpha * A * B
    let a = a0;
    let b = b0;
    let t = 0;
    const dt = 0.05;

    steps.push({ time: 0, countA: a, countB: b });

    while (a > 0 && b > 0 && t < maxTime) {
      const dA = -alpha * a * b * dt;
      const dB = -beta * a * b * dt;
      a += dA;
      b += dB;
      t += dt;

      if (a < 0) a = 0;
      if (b < 0) b = 0;

      steps.push({ time: parseFloat(t.toFixed(2)), countA: a, countB: b });
    }
    duration = parseFloat(t.toFixed(2));
    winner = a > b ? 'A' : (b > a ? 'B' : 'Draw');
  }

  return { steps, duration, winner };
};

// Discrete Model (Turn-Based D&D Logic)
const runDiscreteSimulation = (
  unitA: UnitStats,
  unitB: UnitStats,
  law: LawType, // Even in discrete, we approximate 'focus fire' (Square) vs 'spread' (Linear) logic
  maxRounds: number = 20
): { steps: DiscreteStep[], duration: number } => {
  let steps: DiscreteStep[] = [];
  
  // Create deep copies to track HP pools if needed, but for Lanchester we usually just track count
  // Here we will use fractional casualty logic clamped to integers for "D&D Feel"
  // Or simply: Total Damage / HP = Dead Units (Focus Fire assumption)
  
  let countA = unitA.count;
  let countB = unitB.count;
  
  // Initial State
  steps.push({ round: 0, countA, countB, casualtiesA: 0, casualtiesB: 0 });

  const dprA = calculateEffectiveDPR(unitA, unitB);
  const dprB = calculateEffectiveDPR(unitB, unitA);

  let round = 1;
  while (countA > 0 && countB > 0 && round <= maxRounds) {
    // In D&D, initiative matters. We'll assume simultaneous rounds for simplicity of the model comparison,
    
    // Calculate raw damage output
    let totalDmgA = 0;
    let totalDmgB = 0;

    if (law === LawType.SQUARE) {
      totalDmgA = countA * dprA;
      totalDmgB = countB * dprB;
    } else {
       // Linear approximation in discrete: Damage scales with enemy density? 
       // For discrete verification of linear law, usually just stick to the count-based output 
       // but efficiency drops. Let's keep it simple: The model implies DPR * Count.
       // We'll stick to standard combat logic for Discrete: 
       // "Calculated Damage" -> "Integer Kills".
       totalDmgA = countA * dprA;
       totalDmgB = countB * dprB;
    }

    // Casualties (Flooring damage to HP buckets - strict integer unit death)
    // Actually, D&D allows partial damage (HP reduction). 
    // To strictly model "Units dying" for the graph, we track the 'Pool' or assume focus fire kills.
    // Let's assume Focus Fire (Square Law default behavior).
    
    const killsB = Math.floor(totalDmgA / unitB.hp); 
    const killsA = Math.floor(totalDmgB / unitA.hp);

    const prevA = countA;
    const prevB = countB;

    countA = Math.max(0, countA - killsA);
    countB = Math.max(0, countB - killsB);

    steps.push({
      round,
      countA,
      countB,
      casualtiesA: prevA - countA,
      casualtiesB: prevB - countB
    });

    round++;
  }

  return { steps, duration: round - 1 };
};

export const runSimulation = (
  unitA: UnitStats,
  unitB: UnitStats,
  law: LawType,
  dt: number = 0.1, // Unused in analytical, used in old linear
  maxTime: number = 100
): SimulationResult => {
  const alpha = calculateCoefficient(unitB, unitA); // Effectiveness of B against A
  const beta = calculateCoefficient(unitA, unitB);  // Effectiveness of A against B

  const continuous = runContinuousSimulation(unitA, unitB, law, alpha, beta, maxTime);
  const discrete = runDiscreteSimulation(unitA, unitB, law, maxTime);

  return {
    continuousSteps: continuous.steps,
    discreteSteps: discrete.steps,
    winner: continuous.winner,
    duration: continuous.duration,
    discreteDuration: discrete.duration,
    alpha,
    beta
  };
};