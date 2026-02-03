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

  // For Square Law, we can use Analytical Solutions (Hyperbolic functions)
  // A(t) = A0 cosh(sqrt(ab)t) - B0 sqrt(a/b) sinh(sqrt(ab)t)
  if (law === LawType.SQUARE) {
    const sqrtAB = Math.sqrt(alpha * beta);
    // Avoid division by zero
    if (sqrtAB === 0) return { steps: [{time: 0, countA: a0, countB: b0}], duration: 0, winner: 'Draw' };
    
    const factorA = Math.sqrt(alpha / beta);
    const factorB = Math.sqrt(beta / alpha);

    // Dynamic step size for plotting smoothness
    const dt = 0.1; 
    
    for (let t = 0; t <= maxTime; t += dt) {
      const timeVal = parseFloat(t.toFixed(2));
      const cosh = Math.cosh(sqrtAB * t);
      const sinh = Math.sinh(sqrtAB * t);

      // Analytical Equations
      let at = a0 * cosh - b0 * factorA * sinh;
      let bt = b0 * cosh - a0 * factorB * sinh;

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
    // OR A goes then B goes. Let's do Simultaneous damage application to match the Differential Equation spirit closer,
    // otherwise First-Turn-Advantage skews heavily against the math.
    
    // Side A attacks
    // Square Law assumption: All A can attack.
    // Linear Law assumption: Only a limited frontage can attack? 
    // For this app's "Linear" visualization, we usually imply Saturation/AoE.
    // Let's stick to the standard "Total DPR" logic but floor the results.

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