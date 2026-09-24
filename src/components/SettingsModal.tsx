import React, { useState } from 'react';
import { soundSystem } from '../game/engine/audio';

interface Props {
  onClose: () => void;
  isDebugMode: boolean;
  onToggleDebug: () => void;
}

export const SettingsModal: React.FC<Props> = ({ onClose, isDebugMode, onToggleDebug }) => {
  const [isMuted, setIsMuted] = useState(soundSystem.getIsMuted());
  const [musicVol, setMusicVol] = useState(Math.round(soundSystem.getMusicVolume() * 100));
  const [sfxVol, setSfxVol] = useState(Math.round(soundSystem.getSfxVolume() * 100));

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundSystem.setMuted(next);
  };

  const handleMusicChange = (val: number) => {
    setMusicVol(val);
    soundSystem.setMusicVolume(val / 100);
  };

  const handleSfxChange = (val: number) => {
    setSfxVol(val);
    soundSystem.setSfxVolume(val / 100);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-amber-600/40 rounded-xl shadow-2xl p-6 flex flex-col gap-5 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <h2 className="text-xl font-bold font-cinzel text-amber-400 tracking-wide">
            GAME SETTINGS
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm font-semibold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Audio Controls */}
        <div className="flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">Master Sound</span>
            <button
              onClick={handleToggleMute}
              className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                isMuted
                  ? 'bg-rose-900/60 text-rose-300 border border-rose-700'
                  : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
              }`}
            >
              {isMuted ? 'Muted' : 'Enabled'}
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Music Volume</span>
              <span>{musicVol}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVol}
              onChange={(e) => handleMusicChange(Number(e.target.value))}
              disabled={isMuted}
              className="accent-amber-500 cursor-pointer w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Sound Effects</span>
              <span>{sfxVol}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sfxVol}
              onChange={(e) => handleSfxChange(Number(e.target.value))}
              disabled={isMuted}
              className="accent-amber-500 cursor-pointer w-full"
            />
          </div>
        </div>

        {/* Display & Screen */}
        <div className="border-t border-slate-800 pt-3 flex flex-col gap-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">Display Mode</span>
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200 cursor-pointer"
            >
              Toggle Fullscreen
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">Developer Debug Mode</span>
            <button
              onClick={onToggleDebug}
              className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                isDebugMode
                  ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {isDebugMode ? 'Active (Map Revealed)' : 'Disabled'}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-2 w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold font-cinzel rounded-lg shadow-md transition-colors cursor-pointer"
        >
          Confirm & Return
        </button>
      </div>
    </div>
  );
};
