import React, { useEffect, useRef, useState } from 'react';
import { BUILDINGS, TIER_UPGRADES } from '../game/config/buildings';
import { FACTIONS } from '../game/config/factions';
import { UNITS } from '../game/config/units';
import { UPGRADES } from '../game/config/upgrades';
import { soundSystem } from '../game/engine/audio';
import { GameManager } from '../game/engine/game';
import { Building, BuildingDef, Unit } from '../game/types';

interface Props {
  game: GameManager;
  onOpenSettings: () => void;
  onQuitMatch: () => void;
}

export const GameHUD: React.FC<Props> = ({ game, onOpenSettings, onQuitMatch }) => {
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(soundSystem.getIsMuted());

  // Render Minimap
  useEffect(() => {
    let animId: number;
    const renderMinimapLoop = () => {
      const canvas = minimapCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          game.renderMinimapTo(ctx);
        }
      }
      animId = requestAnimationFrame(renderMinimapLoop);
    };
    animId = requestAnimationFrame(renderMinimapLoop);
    return () => cancelAnimationFrame(animId);
  }, [game]);

  const handleMinimapInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const scaleX = game.map.width / canvas.width;
    const scaleY = game.map.height / canvas.height;

    game.centerCameraOn(mx * scaleX, my * scaleY);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundSystem.setMuted(next);
  };

  const selectedUnits = game.selectedUnits;
  const selectedBuilding = game.selectedBuilding;
  const primaryUnit: Unit | null = selectedUnits.length > 0 ? selectedUnits[0] : null;
  const hasGatherer = selectedUnits.some((u) => u.role === 'gatherer');
  const heroUnit = selectedUnits.find((u) => u.role === 'hero') || game.units.find((u) => u.isPlayer && u.role === 'hero');

  // Available buildings for player faction
  const factionBuildings = Object.values(BUILDINGS).filter(
    (b) => b.faction === game.player.faction && b.category !== 'main_hall'
  );

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between">
      {/* ================= TOP STATUS BAR ================= */}
      <header className="pointer-events-auto flex items-center justify-between px-4 py-2 bg-slate-950/85 border-b border-amber-600/30 backdrop-blur-md shadow-lg text-slate-100 select-none">
        {/* Left: Realm & Resources */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div
              className="w-3.5 h-3.5 rounded-full shadow-sm"
              style={{ backgroundColor: FACTIONS[game.player.faction].colors.primary }}
            />
            <span className="font-cinzel font-bold text-sm text-amber-300 tracking-wide uppercase">
              {FACTIONS[game.player.faction].name}
            </span>
          </div>

          {/* Gold */}
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">●</span>
            <span className="text-xs text-slate-400">GOLD:</span>
            <span className="font-mono font-bold text-sm text-amber-300 tabular-nums">
              {game.player.gold}
            </span>
          </div>

          {/* Population */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">POPULATION:</span>
            <span
              className={`font-mono font-bold text-sm tabular-nums ${
                game.player.population >= game.player.maxPopulation
                  ? 'text-rose-400 animate-pulse'
                  : 'text-slate-200'
              }`}
            >
              {game.player.population} / {game.player.maxPopulation}
            </span>
          </div>

          {/* Tech Tier */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-xs">
            <span className="text-amber-400 font-semibold font-cinzel">
              TIER {game.player.techTier}
            </span>
          </div>
        </div>

        {/* Center: Match Duration */}
        <div className="hidden md:flex items-center gap-2 font-mono text-xs text-slate-400">
          <span>TIME:</span>
          <span className="text-slate-200 font-bold">{formatTimer(game.getMatchDuration())}</span>
        </div>

        {/* Right: Actions / Controls */}
        <div className="flex items-center gap-2">
          {/* Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium transition-colors cursor-pointer"
          >
            Settings
          </button>

          {/* Resign / Surrender */}
          <button
            onClick={onQuitMatch}
            className="px-2.5 py-1 rounded bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800 text-xs text-rose-300 font-medium transition-colors cursor-pointer"
          >
            Surrender
          </button>
        </div>
      </header>

      {/* ================= BOTTOM COMMAND CONSOLE ================= */}
      <footer className="pointer-events-auto bg-slate-950/95 border-t border-amber-600/30 backdrop-blur-md shadow-2xl p-2 sm:p-3 flex flex-col sm:flex-row gap-3 select-none">
        {/* Zone 1: Minimap */}
        <div className="relative shrink-0 flex flex-col items-center justify-center bg-slate-900 p-1 rounded-lg border border-slate-800 shadow-inner">
          <canvas
            ref={minimapCanvasRef}
            width={160}
            height={160}
            onClick={handleMinimapInteraction}
            onMouseMove={(e) => {
              if (e.buttons === 1) handleMinimapInteraction(e);
            }}
            className="rounded cursor-crosshair border border-slate-700/60"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 font-mono">BATTLEFIELD MINIMAP</span>
        </div>

        {/* Zone 2: Entity Inspect Card */}
        <div className="flex-1 bg-slate-900/80 rounded-lg border border-slate-800/90 p-3 flex flex-col justify-between min-h-[140px]">
          {primaryUnit ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-cinzel font-bold text-sm text-amber-300">
                    {primaryUnit.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                    {primaryUnit.role}
                  </span>
                  {primaryUnit.role === 'hero' && primaryUnit.level && (
                    <span className="text-[10px] font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-700/60">
                      LEVEL {primaryUnit.level} (XP {primaryUnit.xp}/{primaryUnit.maxXp})
                    </span>
                  )}
                </div>
                {selectedUnits.length > 1 && (
                  <span className="text-xs font-mono text-slate-400">
                    {selectedUnits.length} Units Selected
                  </span>
                )}
              </div>

              {/* Health Bar */}
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Health</span>
                  <span className="text-slate-200 font-bold">
                    {primaryUnit.hp} / {primaryUnit.maxHp}
                  </span>
                </div>
                <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-150"
                    style={{ width: `${Math.max(0, (primaryUnit.hp / primaryUnit.maxHp) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Unit Combat Attributes */}
              <div className="grid grid-cols-4 gap-2 text-[11px] font-mono pt-1 text-slate-300">
                <div className="flex flex-col bg-slate-950/60 p-1 rounded border border-slate-800/80">
                  <span className="text-slate-500 text-[10px]">DAMAGE</span>
                  <span className="font-bold text-amber-300">{primaryUnit.attackDamage}</span>
                </div>
                <div className="flex flex-col bg-slate-950/60 p-1 rounded border border-slate-800/80">
                  <span className="text-slate-500 text-[10px]">ARMOR</span>
                  <span className="font-bold text-sky-300">{primaryUnit.armor}</span>
                </div>
                <div className="flex flex-col bg-slate-950/60 p-1 rounded border border-slate-800/80">
                  <span className="text-slate-500 text-[10px]">RANGE</span>
                  <span className="font-bold text-slate-200">{primaryUnit.range}</span>
                </div>
                <div className="flex flex-col bg-slate-950/60 p-1 rounded border border-slate-800/80">
                  <span className="text-slate-500 text-[10px]">SPEED</span>
                  <span className="font-bold text-slate-200">{primaryUnit.moveSpeed}</span>
                </div>
              </div>

              {/* Status Buffs */}
              {primaryUnit.buffs.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  {primaryUnit.buffs.map((b) => (
                    <span
                      key={b.id}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-700/40"
                    >
                      {b.name} ({Math.ceil(b.duration)}s)
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : selectedBuilding ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-cinzel font-bold text-sm text-amber-300">
                    {selectedBuilding.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                    {selectedBuilding.category.replace('_', ' ')}
                  </span>
                </div>
                {!selectedBuilding.isConstructed && (
                  <span className="text-xs text-amber-400 font-semibold animate-pulse">
                    UNDER CONSTRUCTION ({Math.round(selectedBuilding.buildProgress * 100)}%)
                  </span>
                )}
              </div>

              {/* Health Bar */}
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Integrity</span>
                  <span className="text-slate-200 font-bold">
                    {selectedBuilding.hp} / {selectedBuilding.maxHp}
                  </span>
                </div>
                <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-150"
                    style={{
                      width: `${Math.max(0, (selectedBuilding.hp / selectedBuilding.maxHp) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Active Queue Progress */}
              {selectedBuilding.queue.length > 0 ? (
                <div className="flex flex-col gap-1 bg-slate-950/60 p-2 rounded border border-slate-800 mt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-amber-400 font-semibold">
                      Training:{' '}
                      {selectedBuilding.queue[0].type === 'unit'
                        ? UNITS[selectedBuilding.queue[0].defId]?.name
                        : selectedBuilding.queue[0].type === 'upgrade'
                        ? UPGRADES[selectedBuilding.queue[0].defId]?.name
                        : 'Advancing Tier'}
                    </span>
                    <span className="font-mono text-slate-400">
                      Queue: {selectedBuilding.queue.length}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (selectedBuilding.queue[0].progressTime /
                            selectedBuilding.queue[0].totalTime) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic mt-2">
                  Building is idle. Select an order from the action card.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
              <span className="text-amber-300 font-cinzel font-bold text-sm mb-1">
                NO TARGET SELECTED
              </span>
              <p className="text-center text-[11px] text-slate-400 max-w-sm">
                Left-click any unit or structure to issue orders. Drag a box to command multiple
                soldiers at once.
              </p>
            </div>
          )}
        </div>

        {/* Zone 3: Command & Actions Card */}
        <div className="w-full sm:w-80 bg-slate-900/80 rounded-lg border border-slate-800/90 p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-2">
            <span className="text-[11px] font-bold font-cinzel text-amber-400 uppercase tracking-wider">
              {showBuildMenu ? 'CONSTRUCTION' : 'COMMANDS & PRODUCTION'}
            </span>
            {showBuildMenu && (
              <button
                onClick={() => setShowBuildMenu(false)}
                className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
              >
                ✕ Cancel
              </button>
            )}
          </div>

          {/* Standard Unit Commands */}
          {selectedUnits.length > 0 && !showBuildMenu && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => {
                    game.isAttackMoveMode = true;
                  }}
                  className={`p-1.5 rounded border text-[11px] font-semibold transition-colors cursor-pointer ${
                    game.isAttackMoveMode
                      ? 'bg-amber-600 text-slate-950 border-amber-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title="Hotkey: A"
                >
                  Attack (A)
                </button>
                <button
                  onClick={() => game.issueStop()}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Hotkey: S"
                >
                  Stop (S)
                </button>
                <button
                  onClick={() => game.issueHold()}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Hotkey: H"
                >
                  Hold (H)
                </button>
              </div>

              {/* Worker Construction Button */}
              {hasGatherer && (
                <button
                  onClick={() => setShowBuildMenu(true)}
                  className="w-full py-1.5 bg-amber-600/90 hover:bg-amber-500 text-slate-950 font-bold font-cinzel text-xs rounded border border-amber-400 transition-all cursor-pointer shadow-md"
                >
                  Construct Building (B)
                </button>
              )}

              {/* Hero Abilities Bar if hero is selected */}
              {heroUnit && heroUnit.abilities && (
                <div className="border-t border-slate-800 pt-1.5">
                  <span className="text-[10px] text-amber-400 font-semibold block mb-1 uppercase tracking-wider">
                    Hero Spells
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {heroUnit.abilities.map((ab, idx) => {
                      const abDef = UNITS[heroUnit.defId]?.abilities?.find((a) => a.id === ab.defId);
                      if (!abDef) return null;
                      const onCooldown = ab.currentCooldown > 0;
                      const isLocked = (heroUnit.level || 1) < abDef.unlockLevel;

                      return (
                        <button
                          key={ab.defId}
                          disabled={onCooldown || isLocked}
                          onClick={() => game.castHeroAbility(idx)}
                          className={`relative p-1 rounded border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                            isLocked
                              ? 'bg-slate-950/40 border-slate-800 text-slate-600 opacity-60'
                              : onCooldown
                              ? 'bg-slate-900 border-amber-900/60 text-slate-400'
                              : 'bg-slate-800 hover:bg-amber-900/40 border-amber-600/60 text-amber-200'
                          }`}
                          title={`${abDef.name}: ${abDef.description}`}
                        >
                          <span className="font-bold text-[10px] leading-tight font-cinzel truncate w-full">
                            {abDef.hotkey}
                          </span>
                          <span className="text-[9px] text-slate-400 truncate w-full">
                            {abDef.name.split(' ')[0]}
                          </span>
                          {onCooldown && (
                            <div className="absolute inset-0 bg-black/75 rounded flex items-center justify-center font-mono font-bold text-[10px] text-amber-400">
                              {Math.ceil(ab.currentCooldown)}s
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Construction Palette */}
          {showBuildMenu && (
            <div className="grid grid-cols-2 gap-1.5 overflow-y-auto max-h-[140px] pr-1">
              {factionBuildings.map((bDef) => {
                const canAfford = game.player.gold >= bDef.goldCost;
                const tierUnlocked = bDef.tier <= game.player.techTier;

                return (
                  <button
                    key={bDef.id}
                    disabled={!canAfford || !tierUnlocked}
                    onClick={() => {
                      game.setGhostPlacement(bDef.id);
                      setShowBuildMenu(false);
                    }}
                    className={`p-1.5 rounded border text-left flex flex-col transition-all cursor-pointer ${
                      !tierUnlocked
                        ? 'bg-slate-950 border-slate-800 text-slate-600 opacity-50'
                        : canAfford
                        ? 'bg-slate-800 hover:bg-slate-700 border-amber-600/40 text-slate-200'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                    title={bDef.description}
                  >
                    <span className="font-bold text-[11px] text-amber-200 font-cinzel truncate">
                      {bDef.name}
                    </span>
                    <div className="flex items-center justify-between text-[10px] font-mono mt-0.5">
                      <span className="text-amber-400 font-bold">{bDef.goldCost} Gold</span>
                      {!tierUnlocked && <span className="text-rose-400">T{bDef.tier} Req</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Building Production / Research Card */}
          {selectedBuilding && !selectedUnits.length && !showBuildMenu && (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[140px] pr-1">
              {/* Unit Training Buttons */}
              {selectedBuilding.defId &&
                BUILDINGS[selectedBuilding.defId]?.producesUnits?.map((unitId) => {
                  const uDef = UNITS[unitId];
                  if (!uDef) return null;
                  const canAfford = game.player.gold >= uDef.goldCost;
                  const tierUnlocked = uDef.tier <= game.player.techTier;
                  const popOk = game.player.population + uDef.popCost <= game.player.maxPopulation;

                  return (
                    <button
                      key={unitId}
                      disabled={!canAfford || !tierUnlocked || !popOk}
                      onClick={() => game.trainUnit(selectedBuilding, unitId)}
                      className={`p-1.5 rounded border flex items-center justify-between transition-all cursor-pointer ${
                        !tierUnlocked || !popOk
                          ? 'bg-slate-950 border-slate-800 text-slate-600 opacity-60'
                          : canAfford
                          ? 'bg-slate-800 hover:bg-slate-700 border-amber-600/40 text-slate-200'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                      title={uDef.description}
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-[11px] text-amber-200 font-cinzel">
                          {uDef.name}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          Pop: {uDef.popCost} | {uDef.role}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-amber-400">
                        {uDef.goldCost}g
                      </span>
                    </button>
                  );
                })}

              {/* Upgrades */}
              {selectedBuilding.category === 'barracks' && (
                <div className="flex flex-col gap-1 border-t border-slate-800 pt-1">
                  <span className="text-[10px] text-amber-400 font-semibold font-cinzel">
                    Upgrades
                  </span>
                  {game.player.upgrades.weapons < 2 && (
                    <button
                      onClick={() =>
                        game.researchUpgrade(
                          selectedBuilding,
                          game.player.upgrades.weapons === 0 ? 'weapons_1' : 'weapons_2'
                        )
                      }
                      disabled={game.player.gold < (game.player.upgrades.weapons === 0 ? 150 : 250)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-200 flex justify-between cursor-pointer"
                    >
                      <span>Weapons {game.player.upgrades.weapons + 1} (+10% Atk)</span>
                      <span className="font-mono text-amber-400">
                        {game.player.upgrades.weapons === 0 ? '150g' : '250g'}
                      </span>
                    </button>
                  )}
                  {game.player.upgrades.armor < 2 && (
                    <button
                      onClick={() =>
                        game.researchUpgrade(
                          selectedBuilding,
                          game.player.upgrades.armor === 0 ? 'armor_1' : 'armor_2'
                        )
                      }
                      disabled={game.player.gold < (game.player.upgrades.armor === 0 ? 150 : 250)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-200 flex justify-between cursor-pointer"
                    >
                      <span>Armor {game.player.upgrades.armor + 1} (+1 Def)</span>
                      <span className="font-mono text-amber-400">
                        {game.player.upgrades.armor === 0 ? '150g' : '250g'}
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* Main Hall Tech Tier Advance */}
              {selectedBuilding.category === 'main_hall' && game.player.techTier < 3 && (
                <div className="border-t border-slate-800 pt-1">
                  <button
                    onClick={() =>
                      game.advanceTier(
                        selectedBuilding,
                        game.player.techTier === 1 ? 'tier_2' : 'tier_3'
                      )
                    }
                    disabled={game.player.gold < (game.player.techTier === 1 ? 250 : 350)}
                    className="w-full py-1.5 bg-amber-700 hover:bg-amber-600 text-slate-950 font-bold font-cinzel text-[11px] rounded border border-amber-400 transition-colors cursor-pointer flex justify-between px-2"
                  >
                    <span>Advance to Tier {game.player.techTier + 1}</span>
                    <span className="font-mono">{game.player.techTier === 1 ? '250g' : '350g'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Idle Prompt */}
          {!selectedUnits.length && !selectedBuilding && !showBuildMenu && (
            <p className="text-center text-[11px] text-slate-500 py-3 italic">
              Awaiting commander orders...
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};
