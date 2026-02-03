import React from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Scatter,
  ReferenceDot,
  ReferenceLine
} from 'recharts';
import { SimulationResult, UnitStats } from '../types';

interface Props {
  result: SimulationResult;
  unitA: UnitStats;
  unitB: UnitStats;
}

const BattleCharts: React.FC<Props> = ({ result, unitA, unitB }) => {
  
  // Prepare Phase Plane Data (Y = A, X = B)
  const phaseData = result.continuousSteps.map(step => ({
    countA: step.countA,
    countB: step.countB,
  }));

  // Initial State for Phase Plane label
  const startA = result.continuousSteps[0]?.countA || 0;
  const startB = result.continuousSteps[0]?.countB || 0;

  return (
    <div className="space-y-6">
      
      {/* Chart 1 & 2: Time Series with Discrete Overlay */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-200">Battle Trajectory (Time Series)</h3>
          <p className="text-xs text-slate-400">Comparing Continuous Equations (Lines) vs. Discrete Rounds (Dots)</p>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis 
                dataKey="time" 
                type="number"
                stroke="#94a3b8" 
                domain={[0, 'auto']}
                allowDuplicatedCategory={false}
                label={{ value: 'Time (t)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }} 
              />
              <YAxis stroke="#94a3b8" label={{ value: 'Units', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}/>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                itemStyle={{ fontSize: '0.875rem' }}
                labelFormatter={(v) => `Time: ${v}`}
              />
              <Legend verticalAlign="top" height={36} />
              
              {/* Continuous Lines (The Equations) */}
              <Line 
                data={result.continuousSteps} 
                type="monotone" 
                dataKey="countA" 
                name={`${unitA.name} (Eq)`} 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={false}
              />
              <Line 
                data={result.continuousSteps} 
                type="monotone" 
                dataKey="countB" 
                name={`${unitB.name} (Eq)`} 
                stroke="#ef4444" 
                strokeWidth={2} 
                dot={false}
              />

              {/* Discrete Dots (The Simulation) */}
              <Scatter 
                data={result.discreteSteps} 
                name={`${unitA.name} (Turn)`} 
                dataKey="countA" 
                fill="#60a5fa" 
                shape="circle" 
                line={false}
              />
              <Scatter 
                data={result.discreteSteps} 
                name={`${unitB.name} (Turn)`} 
                dataKey="countB" 
                fill="#f87171" 
                shape="diamond" 
                line={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Phase Plane */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-200">Phase Plane (State Equation)</h3>
          <p className="text-xs text-slate-400">Visualizing the State Space: $k_2(y_0^2 - y^2) = k_1(x_0^2 - x^2)$</p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis 
                dataKey="countB" 
                type="number" 
                stroke="#f87171"
                domain={[0, 'auto']}
                reversed
                label={{ value: `Count B (${unitB.name})`, position: 'insideBottom', offset: -10, fill: '#f87171' }} 
              />
              <YAxis 
                dataKey="countA" 
                type="number" 
                stroke="#60a5fa"
                domain={[0, 'auto']}
                label={{ value: `Count A (${unitA.name})`, angle: -90, position: 'insideLeft', fill: '#60a5fa' }} 
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                formatter={(value: any, name: any) => [value, name === 'countA' ? unitA.name : unitB.name]}
                labelFormatter={() => ''}
              />
              
              <ReferenceDot x={startB} y={startA} r={6} fill="#fff" stroke="none" />
              <ReferenceLine x={0} stroke="#94a3b8" />
              <ReferenceLine y={0} stroke="#94a3b8" />

              <Line 
                data={phaseData} 
                dataKey="countA" 
                name="Trajectory" 
                stroke="#a855f7" 
                strokeWidth={3} 
                dot={false} 
                type="monotone"
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default BattleCharts;