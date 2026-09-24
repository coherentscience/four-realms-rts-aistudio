import React from 'react';
import { PlayerStats } from '../game/types';

interface Props {
  isVictory: boolean;
  stats: PlayerStats;
  matchDuration: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const VictoryModal: React.FC<Props> = ({
  isVictory,
  stats,
  matchDuration,
  onPlayAgain,
  onMainMenu,
}) => {
  const minutes = Math.floor(matchDuration / 60);
  const seconds = matchDuration % 60;
  const formattedTime = `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 text-slate-100 text-center">
        {/* Banner */}
        <div>
          <span
            className={`text-4xl sm:text-5xl font-black font-cinzel tracking-wider block ${
              isVictory ? 'text-amber-400 drop-shadow-[0_4px_16px_rgba(251,191,36,0.4)]' : 'text-rose-500'
            }`}
          >
            {isVictory ? 'TRIUMPHANT VICTORY' : 'DEFEAT'}
          </span>
          <p className="text-xs text-slate-400 mt-2">
            {isVictory
              ? 'The enemy citadel has crumbled. Your realm reigns supreme over the land.'
              : 'Your Main Hall has fallen to the enemy offensive. Regroup your forces for another campaign.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs">
          <div className="flex flex-col p-2 bg-slate-900/60 rounded border border-slate-800/80">
            <span className="text-slate-400">Match Duration</span>
            <span className="font-mono text-sm font-bold text-amber-300 mt-0.5">{formattedTime}</span>
          </div>

          <div className="flex flex-col p-2 bg-slate-900/60 rounded border border-slate-800/80">
            <span className="text-slate-400">Gold Collected</span>
            <span className="font-mono text-sm font-bold text-amber-400 mt-0.5">{stats.goldCollected}</span>
          </div>

          <div className="flex flex-col p-2 bg-slate-900/60 rounded border border-slate-800/80">
            <span className="text-slate-400">Units Created</span>
            <span className="font-mono text-sm font-bold text-slate-200 mt-0.5">{stats.unitsCreated}</span>
          </div>

          <div className="flex flex-col p-2 bg-slate-900/60 rounded border border-slate-800/80">
            <span className="text-slate-400">Units Lost</span>
            <span className="font-mono text-sm font-bold text-rose-400 mt-0.5">{stats.unitsLost}</span>
          </div>

          <div className="flex flex-col p-2 bg-slate-900/60 rounded border border-slate-800/80">
            <span className="text-slate-400">Enemies Defeated</span>
            <span className="font-mono text-sm font-bold text-emerald-400 mt-0.5">{stats.enemiesDefeated}</span>
          </div>

          <div className="flex flex-col p-2 bg-slate-900/60 rounded border border-slate-800/80">
            <span className="text-slate-400">Buildings Destroyed</span>
            <span className="font-mono text-sm font-bold text-amber-300 mt-0.5">{stats.buildingsDestroyed}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={onPlayAgain}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold font-cinzel tracking-wider rounded-lg shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={onMainMenu}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold font-cinzel rounded-lg transition-all cursor-pointer"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
