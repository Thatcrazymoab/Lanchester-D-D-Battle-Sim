import React from 'react';
import { SimulationResult, UnitStats } from '../types';

interface Props {
  result: SimulationResult;
  unitA: UnitStats;
  unitB: UnitStats;
}

const ComparisonTable: React.FC<Props> = ({ result, unitA, unitB }) => {
  // We need to align discrete steps with continuous time points
  // Continuous steps are high resolution (0.1). Discrete are Integer (1.0).
  // We filter continuous steps where time is an integer.
  
  const rows = result.discreteSteps.map((dStep) => {
    // Find closest continuous step
    const cStep = result.continuousSteps.find(c => Math.abs(c.time - dStep.round) < 0.05);
    
    const contA = cStep ? cStep.countA.toFixed(2) : '-';
    const contB = cStep ? cStep.countB.toFixed(2) : '-';
    
    // Calculate Error (Difference between Model and Reality)
    const errorA = cStep ? (cStep.countA - dStep.countA).toFixed(2) : '-';

    return {
      round: dStep.round,
      contA,
      discA: dStep.countA,
      errorA,
      contB,
      discB: dStep.countB,
    };
  });

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg mt-6">
      <div className="p-4 bg-slate-800/50 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-slate-200">Model Validity: Discrete vs. Continuous Verification</h3>
        <p className="text-xs text-slate-400 mt-1">Comparing the theoretical Differential Equation ($dt \to 0$) against the Round-Based D&D Mechanic ($dt=1$).</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-950 text-slate-400 font-medium">
            <tr>
              <th className="px-4 py-3 text-center">Round ($t$)</th>
              <th className="px-4 py-3 text-center text-blue-400">{unitA.name} (Model)</th>
              <th className="px-4 py-3 text-center text-blue-400">{unitA.name} (Sim)</th>
              <th className="px-4 py-3 text-center text-slate-500">Difference</th>
              <th className="px-4 py-3 text-center text-red-400">{unitB.name} (Model)</th>
              <th className="px-4 py-3 text-center text-red-400">{unitB.name} (Sim)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((row) => (
              <tr key={row.round} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-center font-mono text-slate-300">{row.round}</td>
                <td className="px-4 py-3 text-center font-mono text-blue-300/80">{row.contA}</td>
                <td className="px-4 py-3 text-center font-mono font-bold text-blue-400">{row.discA}</td>
                <td className="px-4 py-3 text-center font-mono text-slate-500">{row.errorA}</td>
                <td className="px-4 py-3 text-center font-mono text-red-300/80">{row.contB}</td>
                <td className="px-4 py-3 text-center font-mono font-bold text-red-400">{row.discB}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable;