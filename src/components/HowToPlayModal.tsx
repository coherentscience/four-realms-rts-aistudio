import React from 'react';

interface Props {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-amber-600/40 rounded-xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
          <div>
            <h2 className="text-2xl font-bold font-cinzel text-amber-400 tracking-wide">
              FIELD COMMAND GUIDE
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Master the core tenets of real-time strategy warfare in Four Realms.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>

        {/* 6 Step Interactive Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Step 1 */}
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
            <span className="font-bold text-amber-300 text-sm font-cinzel">
              1. Gold Economy & Mining
            </span>
            <p className="text-slate-300 leading-relaxed">
              Gold is the single universal currency. Gold mines are infinite and never deplete.
              Right-click a mine with your faction gatherer (Peasant, Peon, Acolyte, or Wisp) to start
              an automatic loop of harvesting 10 gold and returning it to your Main Hall. Maintain 4–5
              gatherers early on.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
            <span className="font-bold text-amber-300 text-sm font-cinzel">
              2. Base Construction & Placement
            </span>
            <p className="text-slate-300 leading-relaxed">
              Select a gatherer to access the construction card. Buildings must be placed within your
              designated base territory. Construct a Barracks first to start recruiting soldiers, then
              an Archery Range and Defensive Towers to secure key choke points.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
            <span className="font-bold text-amber-300 text-sm font-cinzel">
              3. Technology Tiers (Tiers 1–3)
            </span>
            <p className="text-slate-300 leading-relaxed">
              Research Tier 2 at your Main Hall to unlock the Hero Sanctuary, Tanks, and Magic
              casters. Advance to Tier 3 to recruit deadly Siege weaponry (Cannons, Catapults) and
              formidable Elite champions (Royal Guards, Bone Dragons, Ancient Guardians).
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
            <span className="font-bold text-amber-300 text-sm font-cinzel">
              4. The Hero Vanguard
            </span>
            <p className="text-slate-300 leading-relaxed">
              Summon your faction hero at the Hero building. Heroes gain combat XP, level up from 1 to 5,
              and command 3 standard abilities (Q, W, E) plus a devastating ultimate (R). If your hero
              falls in combat, they will automatically resurrect after a brief cooldown.
            </p>
          </div>

          {/* Step 5 */}
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
            <span className="font-bold text-amber-300 text-sm font-cinzel">
              5. Combat & Faction Strengths
            </span>
            <p className="text-slate-300 leading-relaxed">
              Damage taken equals attack damage minus armor (minimum 1). Leverage your faction’s unique
              edge: Kingdoms’ defensive Rally auras, Horde’s frenzy Bloodlust on kills, Undead’s corpse
              reanimation, and Elves’ forest rejuvenation and long-range archery.
            </p>
          </div>

          {/* Step 6 */}
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
            <span className="font-bold text-amber-300 text-sm font-cinzel">
              6. Victory Condition
            </span>
            <p className="text-slate-300 leading-relaxed">
              Assemble a combined arms army of infantry, ranged support, and siege engines. March upon
              the enemy base, break their defenses, and annihilate their Main Hall to claim total
              victory!
            </p>
          </div>
        </div>

        {/* Hotkeys Table */}
        <div className="border-t border-slate-800 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 font-cinzel">
            Key Bindings & Controls
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
              <span className="font-mono text-amber-400 font-bold">Left Click / Drag</span>
              <p className="text-slate-400 mt-0.5">Select unit / Box select</p>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
              <span className="font-mono text-amber-400 font-bold">Right Click</span>
              <p className="text-slate-400 mt-0.5">Move, Attack, Mine, Build</p>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
              <span className="font-mono text-amber-400 font-bold">WASD / Arrows</span>
              <p className="text-slate-400 mt-0.5">Pan battle camera</p>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
              <span className="font-mono text-amber-400 font-bold">Mouse Wheel</span>
              <p className="text-slate-400 mt-0.5">Zoom camera in / out</p>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
              <span className="font-mono text-amber-400 font-bold">A</span>
              <p className="text-slate-400 mt-0.5">Attack-move command</p>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
              <span className="font-mono text-amber-400 font-bold">S / H</span>
              <p className="text-slate-400 mt-0.5">Stop / Hold position</p>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
              <span className="font-mono text-amber-400 font-bold">Q, W, E, R</span>
              <p className="text-slate-400 mt-0.5">Hero ability hotkeys</p>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
              <span className="font-mono text-amber-400 font-bold">B</span>
              <p className="text-slate-400 mt-0.5">Toggle build menu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
