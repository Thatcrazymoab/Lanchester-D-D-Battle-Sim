import React from 'react';
import { UnitStats } from '../types';
import { Shield, Sword, Users, Target, Heart, Dna } from 'lucide-react';

interface Props {
  side: 'A' | 'B';
  stats: UnitStats;
  onChange: (stats: UnitStats) => void;
  color: string;
}

const UnitConfig: React.FC<Props> = ({ side, stats, onChange, color }) => {
  const handleChange = (field: keyof UnitStats, value: any) => {
    onChange({
      ...stats,
      [field]: field === 'name' ? value : Number(value),
    });
  };

  const inputClass = "w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-indigo-500";
  const labelClass = "flex items-center gap-2 text-xs text-slate-400 mb-1 uppercase font-semibold";

  return (
    <div className={`p-4 rounded-xl border-2 ${side === 'A' ? 'border-blue-500/30 bg-blue-950/20' : 'border-red-500/30 bg-red-950/20'}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-8 rounded-full ${color}`}></div>
        <h2 className="text-xl font-bold text-slate-100">Side {side}</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelClass}><Dna size={14} /> Unit Name</label>
          <input
            type="text"
            value={stats.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}><Users size={14} /> Count</label>
            <input
              type="number"
              value={stats.count}
              onChange={(e) => handleChange('count', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}><Heart size={14} /> HP (per unit)</label>
            <input
              type="number"
              value={stats.hp}
              onChange={(e) => handleChange('hp', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}><Shield size={14} /> Armor Class</label>
            <input
              type="number"
              value={stats.ac}
              onChange={(e) => handleChange('ac', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}><Target size={14} /> To Hit Bonus</label>
            <input
              type="number"
              value={stats.attackBonus}
              onChange={(e) => handleChange('attackBonus', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}><Sword size={14} /> Dmg Dice Avg</label>
            <input
              type="number"
              step="0.5"
              value={stats.damageDiceAvg}
              onChange={(e) => handleChange('damageDiceAvg', e.target.value)}
              className={inputClass}
              title="e.g. 1d8 = 4.5"
            />
          </div>
          <div>
            <label className={labelClass}><Sword size={14} /> Flat Dmg Mod</label>
            <input
              type="number"
              value={stats.damageMod}
              onChange={(e) => handleChange('damageMod', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitConfig;