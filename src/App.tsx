import React, { useCallback, useEffect, useState } from 'react';
import { DebugOverlay } from './components/DebugOverlay';
import { FactionSelectModal } from './components/FactionSelectModal';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { HowToPlayModal } from './components/HowToPlayModal';
import { MainMenu } from './components/MainMenu';
import { SettingsModal } from './components/SettingsModal';
import { VictoryModal } from './components/VictoryModal';
import { GameManager } from './game/engine/game';
import { FactionId, PlayerStats } from './game/types';

export default function App() {
  const [view, setView] = useState<'menu' | 'faction_select' | 'game'>('menu');
  const [playerFaction, setPlayerFaction] = useState<FactionId>('kingdoms');
  const [enemyFaction, setEnemyFaction] = useState<FactionId>('horde');
  const [game, setGame] = useState<GameManager | null>(null);
  const [, setTick] = useState(0);

  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);

  const [victoryState, setVictoryState] = useState<{
    isVictory: boolean;
    stats: PlayerStats;
    duration: number;
  } | null>(null);

  const forceRerender = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  const handleGameOver = useCallback(
    (isVictory: boolean, stats: PlayerStats, duration: number) => {
      setVictoryState({ isVictory, stats, duration });
    },
    []
  );

  const startMatch = (chosenPlayerFaction: FactionId, chosenEnemyFaction: FactionId) => {
    setPlayerFaction(chosenPlayerFaction);
    setEnemyFaction(chosenEnemyFaction);
    setVictoryState(null);

    // Stop prior game if running
    if (game) {
      game.stop();
    }

    const newGame = new GameManager(chosenPlayerFaction, chosenEnemyFaction, {
      onStateChange: forceRerender,
      onGameOver: handleGameOver,
    });
    newGame.isDebugMode = isDebugMode;

    setGame(newGame);
    setView('game');
    newGame.start();
  };

  const handleQuitMatch = () => {
    if (game) {
      game.stop();
      setGame(null);
    }
    setView('menu');
    setVictoryState(null);
  };

  const handlePlayAgain = () => {
    setVictoryState(null);
    startMatch(playerFaction, enemyFaction);
  };

  const toggleDebug = () => {
    const next = !isDebugMode;
    setIsDebugMode(next);
    if (game) {
      game.isDebugMode = next;
      if (next) {
        game.fog.visible.fill(1);
        game.fog.explored.fill(1);
      }
    }
    forceRerender();
  };

  // Clean teardown on unmount
  useEffect(() => {
    return () => {
      if (game) game.stop();
    };
  }, [game]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. Main Menu View */}
      {view === 'menu' && (
        <MainMenu
          onPlayClick={() => setView('faction_select')}
          onHowToPlayClick={() => setShowHowToPlay(true)}
          onSettingsClick={() => setShowSettings(true)}
        />
      )}

      {/* 2. Faction Selection Modal */}
      {view === 'faction_select' && (
        <FactionSelectModal
          onStartGame={(pFac, eFac) => startMatch(pFac, eFac)}
          onBack={() => setView('menu')}
        />
      )}

      {/* 3. In-Game Battle View */}
      {view === 'game' && game && (
        <>
          <GameCanvas game={game} onOpenSettings={() => setShowSettings(true)} />
          <GameHUD
            game={game}
            onOpenSettings={() => setShowSettings(true)}
            onQuitMatch={handleQuitMatch}
          />
          {isDebugMode && <DebugOverlay game={game} onRefresh={forceRerender} />}
        </>
      )}

      {/* 4. How To Play Modal */}
      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}

      {/* 5. Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          isDebugMode={isDebugMode}
          onToggleDebug={toggleDebug}
        />
      )}

      {/* 6. Victory / Defeat Modal */}
      {victoryState && (
        <VictoryModal
          isVictory={victoryState.isVictory}
          stats={victoryState.stats}
          matchDuration={victoryState.duration}
          onPlayAgain={handlePlayAgain}
          onMainMenu={handleQuitMatch}
        />
      )}
    </div>
  );
}
