import React, { useState } from 'react';
import { FACTIONS, FactionConfig } from '../game/config/factions';
import { FactionId } from '../game/types';
import { soundSystem } from '../game/engine/audio';

interface Props {
  onStartGame: (playerFaction: FactionId, enemyFaction: FactionId) => void;
  onBack: () => void;
}

export const FactionSelectModal: React.FC<Props> = ({ onStartGame, onBack }) => {
  const [selectedFaction, setSelectedFaction] = useState<FactionId>('kingdoms');
  const [enemyFaction, setEnemyFaction] = useState<FactionId>('horde');

  const factionList = Object.values(FACTIONS);
  const current = FACTIONS[selectedFaction];

  const handleSelectPlayer = (id: FactionId) => {
    setSelectedFaction(id);
    soundSystem.playSelectUnit(id);
    // If enemy faction is the same, pick a different one
    if (enemyFaction === id) {
      const other = (Object.keys(FACTIONS) as FactionId[]).find((f) => f !== id) || 'horde';
      setEnemyFaction(other);
    }
  };

  const handleLaunch = () => {
    soundSystem.playCommandAttack();
    onStartGame(selectedFaction, enemyFaction);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-900 border border-amber-600/40 rounded-xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 text-slate-100 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-cinzel text-amber-400 tracking-wide">
              CHOOSE YOUR REALM
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select your faction to command against the enemy AI in real-time strategic warfare.
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors cursor-pointer"
          >
            Back
          </button>
        </div>

        {/* Faction Cards Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {factionList.map((f) => {
            const isSelected = f.id === selectedFaction;
            return (
              <button
                key={f.id}
                onClick={() => handleSelectPlayer(f.id)}
                className={`flex flex-col p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'border-amber-400 bg-slate-800/90 shadow-lg shadow-amber-500/10 scale-[1.02]'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full mb-2"
                  style={{ backgroundColor: f.colors.primary }}
                />
                <span className="text-lg font-bold font-cinzel text-amber-200">{f.name}</span>
                <span className="text-xs text-slate-400 mt-0.5 line-clamp-1">{f.subtitle}</span>
                {isSelected && (
                  <div className="absolute top-2 right-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Faction Detail Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/70 p-6 rounded-xl border border-slate-800">
          {/* Identity & Lore */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl font-cinzel text-white shadow-md"
                style={{ backgroundColor: current.colors.primary }}
              >
                {current.name[0]}
              </div>
              <div>
                <h3 className="text-xl font-bold font-cinzel text-amber-300">{current.name}</h3>
                <span className="text-xs text-slate-400">{current.subtitle}</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 italic">{current.tagline}</p>

            <div className="mt-2 border-t border-slate-800 pt-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Faction Mechanic: {current.mechanic.name}
              </span>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {current.mechanic.description}
              </p>
            </div>
          </div>

          {/* Strategic Profile */}
          <div className="flex flex-col gap-3 text-xs">
            <div>
              <span className="font-semibold text-emerald-400 uppercase tracking-wider">Strengths</span>
              <ul className="mt-1 space-y-1 text-slate-300">
                {current.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 shrink-0">✓</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-1">
              <span className="font-semibold text-rose-400 uppercase tracking-wider">Weaknesses</span>
              <ul className="mt-1 space-y-1 text-slate-300">
                {current.weaknesses.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-rose-400 shrink-0">✕</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Hero Profile */}
          <div className="flex flex-col gap-2 bg-slate-900/60 p-4 rounded-lg border border-slate-800 text-xs">
            <span className="text-amber-400 font-semibold uppercase tracking-wider">
              Faction Hero Vanguard
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold font-cinzel text-slate-100">
                {current.heroName}
              </span>
              <span className="text-slate-400">({current.heroTitle})</span>
            </div>
            <p className="text-slate-300 mt-1 leading-relaxed">
              Gains experience in battles, advances through levels 1–5, commands 3 distinct spells and
              a battle-altering ultimate ability. Automatically respawns after death.
            </p>
            <div className="mt-2 text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
              <span>Gatherer:</span>
              <span className="text-amber-300 font-medium">{current.gatheringUnit}</span>
            </div>
          </div>
        </div>

        {/* AI Opponent Selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs uppercase tracking-wider text-slate-400">AI Opponent:</span>
            <select
              value={enemyFaction}
              onChange={(e) => setEnemyFaction(e.target.value as FactionId)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:border-amber-500"
            >
              {factionList.map((f) => (
                <option key={f.id} value={f.id} disabled={f.id === selectedFaction}>
                  {f.name} {f.id === selectedFaction ? '(Player Selected)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleLaunch}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold font-cinzel tracking-wider rounded-lg shadow-lg shadow-amber-600/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            ENTER THE BATTLEFIELD
          </button>
        </div>
      </div>
    </div>
  );
};
