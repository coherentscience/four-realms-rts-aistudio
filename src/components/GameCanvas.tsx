import React, { useEffect, useRef } from 'react';
import { GameManager } from '../game/engine/game';
import { GameRenderer } from '../game/engine/renderer';
import { Vector2D } from '../game/types';

interface Props {
  game: GameManager;
  onOpenSettings: () => void;
}

export const GameCanvas: React.FC<Props> = ({ game, onOpenSettings }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMouseDownRef = useRef(false);
  const dragStartRef = useRef<Vector2D | null>(null);
  const isDraggingBoxRef = useRef(false);
  const activeKeysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new GameRenderer(ctx);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      game.camera.viewportWidth = window.innerWidth;
      game.camera.viewportHeight = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Main Canvas Render Loop
    let animId: number;
    const renderLoop = () => {
      // Process keyboard camera panning
      const panSpeed = 14;
      let dx = 0;
      let dy = 0;
      if (activeKeysRef.current['KeyW'] || activeKeysRef.current['ArrowUp']) dy -= panSpeed;
      if (activeKeysRef.current['KeyS'] || activeKeysRef.current['ArrowDown']) dy += panSpeed;
      if (activeKeysRef.current['KeyA'] || activeKeysRef.current['ArrowLeft']) dx -= panSpeed;
      if (activeKeysRef.current['KeyD'] || activeKeysRef.current['ArrowRight']) dx += panSpeed;
      if (dx !== 0 || dy !== 0) {
        game.panCamera(dx, dy);
      }

      renderer.render(
        game.units,
        game.buildings,
        game.goldMines,
        game.corpses,
        game.projectiles,
        game.particles,
        game.floatingTexts,
        game.map,
        game.fog,
        game.camera,
        { units: game.selectedUnits, building: game.selectedBuilding },
        game.dragBox,
        game.placementGhost,
        game.player
      );

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [game]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      activeKeysRef.current[e.code] = true;

      if (e.code === 'KeyA') {
        game.isAttackMoveMode = !game.isAttackMoveMode;
      } else if (e.code === 'KeyS') {
        game.issueStop();
      } else if (e.code === 'KeyH') {
        game.issueHold();
      } else if (e.code === 'KeyQ') {
        game.castHeroAbility(0);
      } else if (e.code === 'KeyW') {
        game.castHeroAbility(1);
      } else if (e.code === 'KeyE') {
        game.castHeroAbility(2);
      } else if (e.code === 'KeyR') {
        game.castHeroAbility(3);
      } else if (e.code === 'Escape') {
        if (game.placementGhost) {
          game.placementGhost = null;
        } else if (game.selectedUnits.length > 0 || game.selectedBuilding) {
          game.selectedUnits = [];
          game.selectedBuilding = null;
        } else {
          onOpenSettings();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [game, onOpenSettings]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      // Left Click: prepare selection or drag
      isMouseDownRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      isDraggingBoxRef.current = false;
    } else if (e.button === 2) {
      // Right Click: command
      game.handleRightClick(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If placing a building ghost: update ghost coordinate
    if (game.placementGhost) {
      game.updateGhostPos(e.clientX, e.clientY);
    }

    if (isMouseDownRef.current && dragStartRef.current && !game.placementGhost) {
      const dx = Math.abs(e.clientX - dragStartRef.current.x);
      const dy = Math.abs(e.clientY - dragStartRef.current.y);

      if (dx > 6 || dy > 6) {
        isDraggingBoxRef.current = true;
        game.dragBox = {
          start: dragStartRef.current,
          current: { x: e.clientX, y: e.clientY },
        };
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0 && isMouseDownRef.current) {
      if (isDraggingBoxRef.current && dragStartRef.current) {
        game.handleBoxSelect(dragStartRef.current, { x: e.clientX, y: e.clientY });
      } else {
        game.handleLeftClick(e.clientX, e.clientY);
      }
    }

    isMouseDownRef.current = false;
    dragStartRef.current = null;
    isDraggingBoxRef.current = false;
    game.dragBox = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    game.zoomCamera(e.deltaY);
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
      className="absolute inset-0 w-full h-full cursor-default select-none focus:outline-none"
    />
  );
};
