import React, { useState, useMemo } from 'react';
import { Zap, Info } from 'lucide-react';
import { UnitStats, LawType, SimulationResult } from './types';
import { runSimulation, calculateEffectiveDPR } from './utils/simulation';
import UnitConfig from './components/UnitConfig';
import AnalysisReport from './components/AnalysisReport';
import SentimentScanner from './components/SentimentScanner';
import BattleCharts from './components/BattleCharts';
import ComparisonTable from './components/ComparisonTable';
import { GUARD, COMMONER, VETERAN, GOBLIN } from './constants';

const App: React.FC = () => {
  const [unitA, setUnitA] = useState<UnitStats>(GUARD);
  const [unitB, setUnitB] = useState<UnitStats>(COMMONER);
  const [lawType, setLawType] = useState<LawType>(LawType.SQUARE);
  
  const simulationResult: SimulationResult = useMemo(() => {
    return runSimulation(unitA, unitB, lawType);
  }, [unitA, unitB, lawType]);

  const statsA = useMemo(() => {
    const dpr = calculateEffectiveDPR(unitA, unitB);
    const totalHealth = unitA.count * unitA.hp;
    return { dpr, totalHealth };
  }, [unitA, unitB]);

  const statsB = useMemo(() => {
    const dpr = calculateEffectiveDPR(unitB, unitA);
    const totalHealth = unitB.count * unitB.hp;
    return { dpr, totalHealth };
  }, [unitB, unitA]);

  const loadPreset = (presetA: UnitStats, presetB: UnitStats) => {
    setUnitA({...presetA});
    setUnitB({...presetB});
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-2">
            Lanchester's Laws & D&D Combat
          </h1>
          <p className="text-slate-400">
            Modeling the Action Economy: Quality vs Quantity in fantasy warfare.
          </p>
        </header>

        {/* Controls and Presets */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <div className="flex gap-2">
            <button
              onClick={() => setLawType(LawType.SQUARE)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${lawType === LawType.SQUARE ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              Square Law (Ranged/Aimed)
            </button>
            <button
              onClick={() => setLawType(LawType.LINEAR)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${lawType === LawType.LINEAR ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              Linear Law (Melee/Area)
            </button>
          </div>
          
          <div className="flex gap-2 items-center text-sm text-slate-400">
            <span>Presets:</span>
            <button onClick={() => loadPreset(GUARD, COMMONER)} className="hover:text-white underline decoration-dotted">Guards v Commoners</button>
            <span className="text-slate-700">|</span>
            <button onClick={() => loadPreset(VETERAN, GOBLIN)} className="hover:text-white underline decoration-dotted">Vets v Goblins</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Inputs Column */}
          <div className="lg:col-span-4 space-y-6">
            <UnitConfig
              side="A"
              stats={unitA}
              onChange={setUnitA}
              color="bg-blue-500"
            />
            <div className="flex justify-center">
              <div className="bg-slate-800 rounded-full p-2 text-slate-500">
                <span className="font-bold text-lg">VS</span>
              </div>
            </div>
            <UnitConfig
              side="B"
              stats={unitB}
              onChange={setUnitB}
              color="bg-red-500"
            />

            {/* Battle Outcome Card */}
            <div className={`p-6 rounded-xl border-l-4 shadow-lg flex items-start gap-4 ${
              simulationResult.winner === 'A' ? 'bg-blue-900/20 border-blue-500' :
              simulationResult.winner === 'B' ? 'bg-red-900/20 border-red-500' :
              'bg-slate-800 border-slate-500'
            }`}>
              <div className={`p-3 rounded-full ${
                 simulationResult.winner === 'A' ? 'bg-blue-600 text-white' :
                 simulationResult.winner === 'B' ? 'bg-red-600 text-white' :
                 'bg-slate-600 text-white'
              }`}>
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Winner: Side {simulationResult.winner}
                </h3>
                <p className="text-slate-300 text-sm">
                  Continuous model ends in <span className="font-mono text-white">{simulationResult.duration}</span> rounds. 
                  Discrete D&D sim ends in <span className="font-mono text-white">{simulationResult.discreteDuration}</span> rounds.
                </p>
                <div className="mt-2 text-xs text-slate-400 flex flex-wrap gap-x-4">
                  <span>Beta (A's power): {simulationResult.beta.toFixed(3)}</span>
                  <span>Alpha (B's power): {simulationResult.alpha.toFixed(3)}</span>
                </div>
              </div>
            </div>
            
             {/* Info Section */}
            <div className="bg-slate-900/50 p-6 rounded-xl text-sm text-slate-400 border border-slate-800/50">
              <div className="flex items-center gap-2 mb-2 text-slate-200 font-semibold">
                <Info size={16} />
                Mathematical Context
              </div>
              <p className="mb-2">
                <strong>Square Law:</strong> $dy/dt = -\\alpha x$ and $dx/dt = -\\beta y$. Used for ranged focus fire. 
              </p>
              <p>
                <strong>Visualization:</strong> The lines represent the theoretical "Lanchester" curves. The dots represent the integer-based D&D rounds.
              </p>
            </div>
          </div>

          {/* Charts & Reports Column */}
          <div className="lg:col-span-8 space-y-6">
            
             {/* Stats Overlay */}
             <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-950/30 p-3 rounded border border-blue-900/50">
                    <div className="text-xs text-blue-300 uppercase font-bold tracking-wider mb-1">Side A Stats</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Indiv. Hit Chance:</span>
                      <span className="font-mono">{((calculateEffectiveDPR(unitA, unitB) / (unitA.damageDiceAvg + unitA.damageMod)) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Eff. DPR per Unit:</span>
                      <span className="font-mono text-white">{statsA.dpr.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="bg-red-950/30 p-3 rounded border border-red-900/50">
                    <div className="text-xs text-red-300 uppercase font-bold tracking-wider mb-1">Side B Stats</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Indiv. Hit Chance:</span>
                      <span className="font-mono">{((calculateEffectiveDPR(unitB, unitA) / (unitB.damageDiceAvg + unitB.damageMod)) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Eff. DPR per Unit:</span>
                      <span className="font-mono text-white">{statsB.dpr.toFixed(2)}</span>
                    </div>
                  </div>
               </div>

            <BattleCharts 
              unitA={unitA}
              unitB={unitB}
              result={simulationResult}
            />

            <ComparisonTable 
              result={simulationResult}
              unitA={unitA}
              unitB={unitB}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnalysisReport 
                unitA={unitA} 
                unitB={unitB} 
                result={simulationResult} 
                law={lawType}
              />
              <SentimentScanner 
                unitA={unitA} 
                unitB={unitB} 
                result={simulationResult} 
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;