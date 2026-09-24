import React from 'react';
import { GameManager } from '../game/engine/game';

interface Props {
  game: GameManager;
  onRefresh: () => void;
}

export const DebugOverlay: React.FC<Props> = ({ game, onRefresh }) => {
  const handleAddGold = () => {
    game.player.gold += 500;
    onRefresh();
  };

  const handleToggleFog = () => {
    game.isDebugMode = !game.isDebugMode;
    if (game.isDebugMode) {
      game.fog.visible.fill(1);
      game.fog.explored.fill(1);
    }
    onRefresh();
  };

  const handleMaxTech = () => {
    game.player.techTier = 3;
    game.player.upgrades.weapons = 2;
    game.player.upgrades.armor = 2;
    onRefresh();
  };

  return (
    <div className="pointer-events-auto fixed top-12 left-4 z-30 bg-slate-900/90 border border-amber-500/50 rounded-lg p-2.5 shadow-xl text-xs text-slate-200 flex flex-col gap-2 font-mono">
      <div className="flex items-center justify-between border-b border-slate-700 pb-1">
        <span className="font-bold text-amber-400">DEBUG CONSOLE</span>
        <span className="text-emerald-400 font-bold">{game.fps} FPS</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <button
          onClick={handleAddGold}
          className="px-2 py-1 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-700 text-amber-300 rounded cursor-pointer"
        >
          +500 Gold
        </button>
        <button
          onClick={handleToggleFog}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded cursor-pointer"
        >
          {game.isDebugMode ? 'Enable Fog' : 'Reveal Map'}
        </button>
        <button
          onClick={handleMaxTech}
          className="px-2 py-1 bg-sky-950/70 hover:bg-sky-900/80 border border-sky-700 text-sky-300 rounded cursor-pointer col-span-2"
        >
          Unlock Max Tier & Upgrades
        </button>
      </div>
    </div>
  );
};
