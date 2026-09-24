import React from 'react';
import { FACTIONS } from '../game/config/factions';
import { soundSystem } from '../game/engine/audio';

interface Props {
  onPlayClick: () => void;
  onHowToPlayClick: () => void;
  onSettingsClick: () => void;
}

export const MainMenu: React.FC<Props> = ({
  onPlayClick,
  onHowToPlayClick,
  onSettingsClick,
}) => {
  const factions = Object.values(FACTIONS);

  const handlePlay = () => {
    soundSystem.init();
    soundSystem.playCommandAttack();
    onPlayClick();
  };

  return (
    <div className="relative w-screen h-screen flex flex-col justify-between overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-radial from-slate-900 via-slate-950 to-black opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Top Bar Lore Ticker */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-amber-900/30">
        <span className="text-xs font-mono tracking-widest text-amber-500 uppercase">
          FOUR REALMS // FANTASY RTS WARFARE
        </span>
        <span className="text-xs font-mono text-slate-500">VERSION 1.0.0</span>
      </div>

      {/* Center Hero & Action Menu */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto px-4 max-w-4xl mx-auto text-center">
        {/* Crown Badge */}
        <div className="w-12 h-12 rounded-full border border-amber-500/40 bg-amber-950/30 flex items-center justify-center text-amber-400 text-xl font-cinzel mb-4 shadow-lg shadow-amber-500/10">
          ⚔
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-cinzel tracking-wider text-amber-400 drop-shadow-[0_4px_20px_rgba(251,191,36,0.3)]">
          FOUR REALMS
        </h1>
        <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-300 font-cinzel tracking-widest uppercase">
          Real-Time Fantasy Strategy
        </p>

        <p className="mt-4 max-w-lg text-xs sm:text-sm text-slate-400 leading-relaxed">
          Command asymmetric factions in classic real-time strategic battles. Construct citadels,
          gather infinite gold veins, summon legendary heroes, and march upon the enemy stronghold.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full max-w-md">
          <button
            onClick={handlePlay}
            className="flex-1 py-3.5 px-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold font-cinzel text-sm sm:text-base tracking-widest rounded-lg shadow-xl shadow-amber-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            ENTER WARFARE
          </button>
          <button
            onClick={() => {
              soundSystem.init();
              onHowToPlayClick();
            }}
            className="py-3.5 px-6 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 font-semibold font-cinzel text-xs sm:text-sm tracking-wider rounded-lg transition-all cursor-pointer"
          >
            HOW TO PLAY
          </button>
          <button
            onClick={() => {
              soundSystem.init();
              onSettingsClick();
            }}
            className="py-3.5 px-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 font-medium text-xs sm:text-sm rounded-lg transition-all cursor-pointer"
            title="Settings"
          >
            ⚙
          </button>
        </div>

        {/* 4 Factions Showcase Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10 w-full">
          {factions.map((f) => (
            <div
              key={f.id}
              className="p-3 rounded-lg border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm flex flex-col text-left transition-transform hover:scale-105"
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: f.colors.primary }}
                />
                <span className="font-cinzel font-bold text-xs text-amber-200">{f.name}</span>
              </div>
              <span className="text-[10px] text-slate-400 line-clamp-1">{f.heroName}</span>
              <span className="text-[9px] text-amber-400/90 mt-1 uppercase font-semibold">
                {f.mechanic.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-900 text-[11px] text-slate-500">
        <span>No paywalls. No cheats. Pure real-time tactical mastery.</span>
        <div className="flex gap-4 mt-1 sm:mt-0 font-mono text-[10px]">
          <span>60 FPS Top-Down Canvas</span>
          <span>•</span>
          <span>Web Audio Procedural Engine</span>
        </div>
      </div>
    </div>
  );
};
