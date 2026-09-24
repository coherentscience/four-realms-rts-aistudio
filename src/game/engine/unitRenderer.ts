/**
 * Specialized unit renderer providing distinct silhouettes, body structures,
 * equipment, proportions, and visual roles for every single unit in Four Realms.
 */
import { FactionId, Unit } from '../types';

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  unit: Unit;
  primaryColor: string;
  secondaryColor: string;
  isHit: boolean;
}

export function drawUnitSilhouette(
  ctx: CanvasRenderingContext2D,
  unit: Unit,
  primaryColor: string,
  secondaryColor: string
) {
  const isHit = unit.isHitFlash > 0;
  const rc: RenderContext = { ctx, unit, primaryColor, secondaryColor, isHit };

  ctx.save();
  // Rotate so unit faces towards facingAngle (facingAngle = 0 points to the right)
  ctx.rotate(unit.facingAngle);

  // Dispatch to unit-specific silhouette renderer
  const renderer = UNIT_RENDERERS[unit.defId] || DEFAULT_RENDERERS[unit.role] || drawGenericUnit;
  renderer(rc);

  ctx.restore();
}

type UnitRenderFn = (rc: RenderContext) => void;

// =========================================================================
// KINGDOMS SILHOUETTES
// =========================================================================

function drawKingdomsPeasant({ ctx, isHit }: RenderContext) {
  // Civilian: simple tunic, canvas tool belt, wooden pickaxe/hoe, humble cap
  ctx.fillStyle = isHit ? '#ffffff' : '#b45309'; // rustic leather tunic
  ctx.beginPath();
  ctx.ellipse(-1, 0, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head with simple work cap
  ctx.fillStyle = isHit ? '#ffffff' : '#f5d0a9';
  ctx.beginPath();
  ctx.arc(3, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Cap rim
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(2, 0, 5, -Math.PI / 2, Math.PI / 2);
  ctx.fill();

  // Backpack / gathering pouch on back
  ctx.fillStyle = '#92400e';
  ctx.fillRect(-9, -4, 5, 8);

  // Wooden pickaxe / tool held forward
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(8, 7);
  ctx.stroke();

  // Pickaxe iron head
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(6, 4);
  ctx.lineTo(10, 10);
  ctx.stroke();
}

function drawKingdomsSwordsman({ ctx, primaryColor, isHit }: RenderContext) {
  // Infantry: medium armor, steel helmet, sword & heater shield, broad defensive silhouette
  // Broad shoulders & armor
  ctx.fillStyle = isHit ? '#ffffff' : '#475569';
  ctx.beginPath();
  ctx.ellipse(-1, 0, 11, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Full iron kettle helmet with visor slit
  ctx.fillStyle = isHit ? '#ffffff' : '#94a3b8';
  ctx.beginPath();
  ctx.arc(2, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(4, -1, 3, 2);

  // Left arm: Sturdy Heater Shield with faction color
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.moveTo(-1, -11);
  ctx.lineTo(8, -10);
  ctx.lineTo(6, -4);
  ctx.lineTo(-2, -5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Right arm: Broadsword blade extending forward
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(4, 5);
  ctx.lineTo(16, 7);
  ctx.stroke();

  // Crossguard & pommel
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(3, 2);
  ctx.lineTo(5, 8);
  ctx.stroke();
}

function drawKingdomsKnight({ ctx, primaryColor, isHit }: RenderContext) {
  // Heavy cavalry / vanguard tank: much larger armored silhouette, mounted warhorse appearance
  // Horse body (elongated oval)
  ctx.fillStyle = isHit ? '#ffffff' : '#334155';
  ctx.beginPath();
  ctx.ellipse(-3, 0, 16, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Horse head & neck extending forward
  ctx.fillStyle = isHit ? '#ffffff' : '#1e293b';
  ctx.beginPath();
  ctx.moveTo(8, -4);
  ctx.lineTo(18, -2);
  ctx.lineTo(16, 3);
  ctx.lineTo(6, 4);
  ctx.closePath();
  ctx.fill();

  // Horse barded armor plate with faction trim
  ctx.fillStyle = primaryColor;
  ctx.fillRect(-8, -8, 12, 16);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-8, -8, 12, 16);

  // Armored knight torso seated on saddle
  ctx.fillStyle = isHit ? '#ffffff' : '#94a3b8';
  ctx.beginPath();
  ctx.arc(-2, 0, 7, 0, Math.PI * 2);
  ctx.fill();

  // Knight crested greathelm with flowing plume
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#dc2626'; // Red tournament plume
  ctx.beginPath();
  ctx.moveTo(-5, -2);
  ctx.lineTo(-12, -5);
  ctx.lineTo(-6, 2);
  ctx.closePath();
  ctx.fill();

  // Heavy steel lance / broadsword forward
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(2, 6);
  ctx.lineTo(22, 6);
  ctx.stroke();

  // Large round knight shield
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.ellipse(0, -9, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawKingdomsArcher({ ctx, primaryColor, isHit }: RenderContext) {
  // Slim silhouette, lighter armor, bow in hands, quiver with arrows
  // Body
  ctx.fillStyle = isHit ? '#ffffff' : primaryColor;
  ctx.beginPath();
  ctx.ellipse(-1, 0, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hooded head
  ctx.fillStyle = isHit ? '#ffffff' : '#1e3a8a';
  ctx.beginPath();
  ctx.arc(2, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Leather quiver on back
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-9, -3, 4, 7);
  // Arrow fletchings sticking out
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-9, -2);
  ctx.lineTo(-13, -3);
  ctx.moveTo(-9, 1);
  ctx.lineTo(-13, 0);
  ctx.stroke();

  // Drawn curved bow in hands
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(8, 0, 8, -Math.PI / 2.5, Math.PI / 2.5);
  ctx.stroke();

  // Bowstring
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(8, -7);
  ctx.lineTo(4, 0);
  ctx.lineTo(8, 7);
  ctx.stroke();
}

function drawKingdomsBattlemage({ ctx, isHit }: RenderContext) {
  // Flowing arcane robes, magical staff with crackling orb, fire aura
  ctx.fillStyle = isHit ? '#ffffff' : '#312e81'; // deep indigo robes
  ctx.beginPath();
  ctx.ellipse(-2, 0, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hooded wizard mantle
  ctx.fillStyle = isHit ? '#ffffff' : '#4338ca';
  ctx.beginPath();
  ctx.arc(1, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Arcane staff
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(2, 6);
  ctx.lineTo(16, 6);
  ctx.stroke();

  // Glowing flaming orb at staff head
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(17, 6, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(17, 6, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawKingdomsPriest({ ctx, isHit }: RenderContext) {
  // Ceremonial vestments, miter cowl, golden cross holy symbol, warm light aura
  ctx.fillStyle = isHit ? '#ffffff' : '#f8fafc'; // white ceremonial robes
  ctx.beginPath();
  ctx.ellipse(-1, 0, 9, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Golden vestment stole
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, -3);
  ctx.lineTo(4, 0);
  ctx.lineTo(-6, 3);
  ctx.stroke();

  // Head with bishop miter
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(2, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Holy book / cross in hand
  ctx.fillStyle = '#eab308';
  ctx.fillRect(7, -3, 5, 6);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(9, -2);
  ctx.lineTo(9, 2);
  ctx.moveTo(8, -1);
  ctx.lineTo(10, -1);
  ctx.stroke();
}

function drawKingdomsPaladin({ ctx, isHit }: RenderContext) {
  // Hero: imposing golden plate armor, large radiant sunblade/hammer, flowing blue cape
  // Flowing royal blue cape billowing behind
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.moveTo(-4, -8);
  ctx.lineTo(-16, -11);
  ctx.lineTo(-18, 0);
  ctx.lineTo(-16, 11);
  ctx.lineTo(-4, 8);
  ctx.closePath();
  ctx.fill();

  // Golden plate torso
  ctx.fillStyle = isHit ? '#ffffff' : '#eab308';
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Golden helmet with winged crest
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(3, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  // Wings on helm
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(1, -6);
  ctx.lineTo(-4, -10);
  ctx.lineTo(2, -7);
  ctx.moveTo(1, 6);
  ctx.lineTo(-4, 10);
  ctx.lineTo(2, 7);
  ctx.fill();

  // Giant radiant sun hammer / greatsword
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(4, 6);
  ctx.lineTo(19, 7);
  ctx.stroke();

  // Heavy hammer head
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(16, 3, 5, 8);
}

function drawKingdomsCannon({ ctx, isHit }: RenderContext) {
  // Siege engine: heavy iron barrel, wooden carriage, large spoke wheels
  // Wooden carriage
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-10, -8, 18, 16);

  // Large side wheels
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-8, -11, 14, 3);
  ctx.fillRect(-8, 8, 14, 3);

  // Heavy cast iron cannon barrel pointing forward
  ctx.fillStyle = isHit ? '#ffffff' : '#334155';
  ctx.beginPath();
  ctx.moveTo(-6, -5);
  ctx.lineTo(16, -4);
  ctx.lineTo(16, 4);
  ctx.lineTo(-6, 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Muzzle band
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(14, -5, 3, 10);
}

function drawKingdomsRoyalGuard({ ctx, isHit }: RenderContext) {
  // Elite: ornate armor, towering plumed helm, long polearm halberd
  ctx.fillStyle = isHit ? '#ffffff' : '#1e3a8a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gilded breastplate
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Towering crested helmet
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(3, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3b82f6'; // Bright blue plume
  ctx.fillRect(-2, -2, 4, 4);

  // Halberd shaft
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-2, 7);
  ctx.lineTo(21, 7);
  ctx.stroke();

  // Halberd axe blade + spear tip
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(17, 7);
  ctx.lineTo(24, 7); // Spear tip
  ctx.lineTo(18, 2); // Axe blade
  ctx.lineTo(16, 7);
  ctx.lineTo(18, 11);
  ctx.closePath();
  ctx.fill();
}

// =========================================================================
// HORDE SILHOUETTES
// =========================================================================

function drawHordePeon({ ctx, isHit }: RenderContext) {
  // Small primitive worker, rough leather harness, bulging sack, iron pick
  ctx.fillStyle = isHit ? '#ffffff' : '#65a30d'; // orc skin
  ctx.beginPath();
  ctx.ellipse(-1, 0, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Leather straps
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-5, -6);
  ctx.lineTo(5, 6);
  ctx.stroke();

  // Big orc head
  ctx.fillStyle = isHit ? '#ffffff' : '#4d7c0f';
  ctx.beginPath();
  ctx.arc(4, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  // Pickaxe forward
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.lineTo(9, 7);
  ctx.stroke();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(7, 3);
  ctx.lineTo(11, 10);
  ctx.stroke();
}

function drawHordeGrunt({ ctx, isHit }: RenderContext) {
  // Basic warrior: heavy muscular body, jagged spiked shoulder armor, massive double axe
  ctx.fillStyle = isHit ? '#ffffff' : '#65a30d';
  ctx.beginPath();
  ctx.ellipse(-1, 0, 13, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Heavy spiked pauldrons
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.arc(-2, -9, 4, 0, Math.PI * 2);
  ctx.arc(-2, 9, 4, 0, Math.PI * 2);
  ctx.fill();

  // Spikes on pauldrons
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-2, -9);
  ctx.lineTo(-4, -13);
  ctx.moveTo(-2, 9);
  ctx.lineTo(-4, 13);
  ctx.stroke();

  // Orc head with tusks
  ctx.fillStyle = isHit ? '#ffffff' : '#4d7c0f';
  ctx.beginPath();
  ctx.arc(4, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  // Tusks
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(7, -3, 3, 2);
  ctx.fillRect(7, 1, 3, 2);

  // Massive double-bitted battleaxe
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(4, 6);
  ctx.lineTo(18, 6);
  ctx.stroke();
  // Double axe blades
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(14, 1);
  ctx.lineTo(19, 0);
  ctx.lineTo(15, 6);
  ctx.lineTo(19, 12);
  ctx.lineTo(14, 11);
  ctx.closePath();
  ctx.fill();
}

function drawHordeOgre({ ctx, isHit }: RenderContext) {
  // Dramatically massive tank body, enormous spiked club, huge silhouette
  ctx.fillStyle = isHit ? '#ffffff' : '#84cc16'; // thick ogre flesh
  ctx.beginPath();
  ctx.ellipse(-2, 0, 19, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Two ogre heads or massive head with horn
  ctx.fillStyle = isHit ? '#ffffff' : '#65a30d';
  ctx.beginPath();
  ctx.arc(8, -5, 6.5, 0, Math.PI * 2);
  ctx.arc(8, 5, 6.5, 0, Math.PI * 2);
  ctx.fill();

  // Iron gut plate
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.ellipse(-1, 0, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Colossal tree trunk spiked club
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(6, 9);
  ctx.lineTo(24, 11);
  ctx.lineTo(22, 17);
  ctx.lineTo(4, 12);
  ctx.closePath();
  ctx.fill();
  // Spikes on club
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(18, 7, 3, 3);
  ctx.fillRect(23, 10, 3, 3);
  ctx.fillRect(19, 16, 3, 3);
}

function drawHordeTrollHunter({ ctx, isHit }: RenderContext) {
  // Tall, lanky, slender troll body, long barbed spear, tall mohawk
  ctx.fillStyle = isHit ? '#ffffff' : '#06b6d4'; // teal troll skin
  ctx.beginPath();
  ctx.ellipse(-2, 0, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Troll head
  ctx.fillStyle = isHit ? '#ffffff' : '#0891b2';
  ctx.beginPath();
  ctx.arc(4, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Tall bright orange mohawk hair
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.moveTo(-1, 0);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-2, -4);
  ctx.closePath();
  ctx.fill();

  // Long barbed throwing spear
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-3, 6);
  ctx.lineTo(22, 6);
  ctx.stroke();

  // Barbed spearhead
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(18, 4);
  ctx.lineTo(25, 6);
  ctx.lineTo(18, 8);
  ctx.lineTo(20, 6);
  ctx.closePath();
  ctx.fill();
}

function drawHordeSpiritShaman({ ctx, isHit }: RenderContext) {
  // Wolf skull headdress, ritual totems on back, lightning sparks
  ctx.fillStyle = isHit ? '#ffffff' : '#b45309'; // ritual hide robes
  ctx.beginPath();
  ctx.ellipse(-2, 0, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Back totems
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-10, -9, 4, 6);
  ctx.fillRect(-10, 3, 4, 6);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-9, -8, 2, 4);
  ctx.fillRect(-9, 4, 2, 4);

  // Wolf skull helm
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(3, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Ritual rattle staff
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(2, 6);
  ctx.lineTo(16, 6);
  ctx.stroke();
  // Totemic orb with lightning
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(17, 6, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawHordeWolfRider({ ctx, isHit }: RenderContext) {
  // Mobile cavalry: snarling dire wolf + orc rider with scimitar
  // Dire wolf body (muscular canine)
  ctx.fillStyle = isHit ? '#ffffff' : '#475569'; // dark wolf fur
  ctx.beginPath();
  ctx.ellipse(-2, 0, 16, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wolf head pointing forward with snout & ears
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(8, -5);
  ctx.lineTo(18, 0); // Snout
  ctx.lineTo(8, 5);
  ctx.closePath();
  ctx.fill();

  // Wolf ears
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(6, -6);
  ctx.lineTo(4, -10);
  ctx.lineTo(9, -6);
  ctx.moveTo(6, 6);
  ctx.lineTo(4, 10);
  ctx.lineTo(9, 6);
  ctx.fill();

  // Orc rider on back
  ctx.fillStyle = '#65a30d';
  ctx.beginPath();
  ctx.arc(-2, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  // Curved scimitar
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(5, 8, 8, -Math.PI / 4, Math.PI / 3);
  ctx.stroke();
}

function drawHordeBlademaster({ ctx, isHit }: RenderContext) {
  // Hero: iconic back banner (sashimono), two-handed burning nodachi, topknot
  // Sashimono banner extending back
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(-16, -12, 10, 8);
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, -4);
  ctx.lineTo(-17, -13);
  ctx.stroke();

  // Muscular warrior torso
  ctx.fillStyle = isHit ? '#ffffff' : '#ea580c';
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Heroic topknot head
  ctx.fillStyle = '#65a30d';
  ctx.beginPath();
  ctx.arc(3, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Enormous glowing two-handed Nodachi / Katana
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(2, 6);
  ctx.lineTo(24, 7);
  ctx.stroke();
  // Burning orange edge
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(5, 5);
  ctx.lineTo(23, 6);
  ctx.stroke();
}

function drawHordeCatapult({ ctx, isHit }: RenderContext) {
  // Wooden siege cart, spiked iron-rim wheels, giant counterweight throwing arm
  ctx.fillStyle = isHit ? '#ffffff' : '#78350f';
  ctx.fillRect(-10, -9, 19, 18);

  // Spiked wheels
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(-8, -12, 14, 4);
  ctx.fillRect(-8, 8, 14, 4);

  // Throwing arm loaded with flaming rock
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(14, 0);
  ctx.stroke();

  // Flaming tar boulder bucket
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.arc(14, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(14, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawHordeBerserker({ ctx, isHit }: RenderContext) {
  // Ripped muscular berserker, dual axes, furious aggressive posture
  ctx.fillStyle = isHit ? '#ffffff' : '#84cc16';
  ctx.beginPath();
  ctx.ellipse(-1, 0, 11, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // War paint stripes
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-4, -4);
  ctx.lineTo(2, -2);
  ctx.moveTo(-4, 4);
  ctx.lineTo(2, 2);
  ctx.stroke();

  // Head
  ctx.fillStyle = '#65a30d';
  ctx.beginPath();
  ctx.arc(3, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  // Dual bloody axes in both hands
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(3, -6);
  ctx.lineTo(15, -9);
  ctx.moveTo(3, 6);
  ctx.lineTo(15, 9);
  ctx.stroke();

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(13, -12, 5, 6);
  ctx.fillRect(13, 6, 5, 6);
}

// =========================================================================
// UNDEAD SILHOUETTES
// =========================================================================

function drawUndeadAcolyte({ ctx, isHit }: RenderContext) {
  // Cultist in ragged dark cowl, glowing eyes, ritual dagger & urn
  ctx.fillStyle = isHit ? '#ffffff' : '#1e1b4b'; // dark violet cowl
  ctx.beginPath();
  ctx.ellipse(-1, 0, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cowled head
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(3, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Glowing eyes in the darkness of the cowl
  ctx.fillStyle = '#a855f7';
  ctx.fillRect(4, -2, 2, 1.5);
  ctx.fillRect(4, 1, 2, 1.5);

  // Curved ritual blade
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(6, 5, 5, 0, Math.PI / 2);
  ctx.stroke();
}

function drawUndeadGhoul({ ctx, isHit }: RenderContext) {
  // Hunched posture, exposed skeletal spine, razor-sharp claws
  ctx.fillStyle = isHit ? '#ffffff' : '#64748b'; // rotting grey flesh
  ctx.beginPath();
  ctx.ellipse(-3, 0, 11, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Exposed white spinal vertebrae
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.lineTo(1, 0);
  ctx.stroke();

  // Feral skull head
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(4, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  // Long bloody razor claws on both hands
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(3, -7);
  ctx.lineTo(14, -8);
  ctx.moveTo(3, 7);
  ctx.lineTo(14, 8);
  ctx.stroke();
}

function drawUndeadAbomination({ ctx, isHit }: RenderContext) {
  // Enormous stitched corpse, third vestigial limb, meat cleaver & sickle hook
  ctx.fillStyle = isHit ? '#ffffff' : '#475569'; // stitched necrotic flesh
  ctx.beginPath();
  ctx.ellipse(-2, 0, 20, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  // Thick sutures & stitches
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, -12);
  ctx.lineTo(4, 12);
  ctx.stroke();

  // Horrific stitched face
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(9, 0, 7.5, 0, Math.PI * 2);
  ctx.fill();

  // Huge butcher's meat cleaver on right arm
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(10, 6, 12, 8);
  ctx.fillStyle = '#991b1b'; // Dried gore
  ctx.fillRect(18, 6, 4, 8);

  // Rusty meat hook on left arm
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(12, -9, 6, 0, Math.PI);
  ctx.stroke();
}

function drawUndeadCryptArcher({ ctx, isHit }: RenderContext) {
  // Skeletal ribcage, bone recurve bow, eerie glowing cyan eye sockets
  // Ribcage
  ctx.fillStyle = isHit ? '#ffffff' : '#e2e8f0';
  ctx.beginPath();
  ctx.ellipse(-2, 0, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-5, -2, 5, 4);

  // Skull
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(3, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // Glowing cyan eyes
  ctx.fillStyle = '#06b6d4';
  ctx.fillRect(4, -2, 2, 1.5);
  ctx.fillRect(4, 1, 2, 1.5);

  // Bone recurve bow
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(7, 0, 8, -Math.PI / 2.5, Math.PI / 2.5);
  ctx.stroke();
}

function drawUndeadNecromancer({ ctx, isHit }: RenderContext) {
  // Flowing dark cowl, skull staff with emerald flame, floating soul wisps
  ctx.fillStyle = isHit ? '#ffffff' : '#3b0764'; // deep shadow robes
  ctx.beginPath();
  ctx.ellipse(-2, 0, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Skeletal hands & head
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(2, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  // Bone staff topped with ram skull & green flame
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(1, 6);
  ctx.lineTo(16, 6);
  ctx.stroke();

  // Green cursed flame
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(17, 6, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawUndeadWraith({ ctx, isHit }: RenderContext) {
  // Translucent floating ghostly apparition, mist tail instead of legs, ghostly claws
  ctx.fillStyle = isHit ? 'rgba(255,255,255,0.8)' : 'rgba(168, 85, 247, 0.65)';
  ctx.beginPath();
  ctx.ellipse(1, 0, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Flowing ghostly vapor trail behind
  ctx.fillStyle = 'rgba(192, 132, 252, 0.4)';
  ctx.beginPath();
  ctx.moveTo(-4, -6);
  ctx.lineTo(-17, -2);
  ctx.lineTo(-13, 2);
  ctx.lineTo(-16, 5);
  ctx.lineTo(-4, 6);
  ctx.closePath();
  ctx.fill();

  // Ethereal glowing core
  ctx.fillStyle = '#f3e8ff';
  ctx.beginPath();
  ctx.arc(3, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawUndeadDeathKnight({ ctx, isHit }: RenderContext) {
  // Hero: dark spiked plate, winged horned helmet, frost-glowing runeblade
  ctx.fillStyle = isHit ? '#ffffff' : '#0f172a'; // black plate
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Spiked death helm with glowing blue eyes
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(3, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#38bdf8'; // Frost eyes
  ctx.fillRect(5, -2, 2, 1.5);
  ctx.fillRect(5, 1, 2, 1.5);

  // Massive Frost Runeblade extending forward
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(3, 7);
  ctx.lineTo(24, 7);
  ctx.stroke();
  // Glowing blue rune line
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(6, 7);
  ctx.lineTo(22, 7);
  ctx.stroke();
}

function drawUndeadBoneCatapult({ ctx, isHit }: RenderContext) {
  // Fused rib cage carriage, skeletal bone wheels, skull sling
  ctx.fillStyle = isHit ? '#ffffff' : '#e2e8f0';
  ctx.fillRect(-9, -9, 18, 18);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-6, -6, 12, 12);

  // Bone wheels
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-2, -10, 5, 0, Math.PI * 2);
  ctx.arc(-2, 10, 5, 0, Math.PI * 2);
  ctx.stroke();

  // Long spine throwing arm
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(15, 0);
  ctx.stroke();

  // Skull payload
  ctx.fillStyle = '#a855f7';
  ctx.beginPath();
  ctx.arc(15, 0, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawUndeadBoneDragon({ ctx, isHit }: RenderContext) {
  // Huge skeletal dragon: long spine, skull head with jaws, massive sweeping wings
  // Spine & ribcage
  ctx.fillStyle = isHit ? '#ffffff' : '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(-1, 0, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Skull head with gaping jaws
  ctx.beginPath();
  ctx.moveTo(12, -4);
  ctx.lineTo(26, -2);
  ctx.lineTo(22, 2);
  ctx.lineTo(26, 6);
  ctx.lineTo(12, 4);
  ctx.closePath();
  ctx.fill();

  // Massive skeletal wings
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  // Left wing
  ctx.moveTo(-2, -6);
  ctx.lineTo(-6, -26);
  ctx.lineTo(6, -20);
  ctx.lineTo(14, -14);
  // Right wing
  ctx.moveTo(-2, 6);
  ctx.lineTo(-6, 26);
  ctx.lineTo(6, 20);
  ctx.lineTo(14, 14);
  ctx.stroke();

  // Spectral green eye fire
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(17, -2, 2.5, 2);
}

function drawUndeadSkeleton({ ctx, isHit }: RenderContext) {
  // Basic summoned skeleton warrior
  ctx.fillStyle = isHit ? '#ffffff' : '#e2e8f0';
  ctx.beginPath();
  ctx.ellipse(-1, 0, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  // Rusty sword
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(2, 5);
  ctx.lineTo(12, 6);
  ctx.stroke();
}

// =========================================================================
// ELVES SILHOUETTES
// =========================================================================

function drawElvesWisp({ ctx, isHit }: RenderContext) {
  // Small floating magical spirit, orbiting light motes, no humanoid appearance
  ctx.fillStyle = isHit ? '#ffffff' : 'rgba(56, 189, 248, 0.85)';
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();

  // Bright white inner core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting light motes
  ctx.fillStyle = '#a7f3d0';
  ctx.beginPath();
  ctx.arc(-8, -4, 2, 0, Math.PI * 2);
  ctx.arc(6, -7, 2, 0, Math.PI * 2);
  ctx.arc(4, 7, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawElvesBladedancer({ ctx, isHit }: RenderContext) {
  // Slender, elegant, twin crescent blades held in agile stance
  ctx.fillStyle = isHit ? '#ffffff' : '#059669'; // emerald tunic
  ctx.beginPath();
  ctx.ellipse(-1, 0, 9, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Elegant elven head with silver hair
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(3, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Twin crescent scimitars in both hands
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(5, -6, 7, -Math.PI / 3, Math.PI / 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(5, 6, 7, -Math.PI / 3, Math.PI / 3);
  ctx.stroke();
}

function drawElvesTreant({ ctx, isHit }: RenderContext) {
  // Massive ancient living tree, gnarled bark, leafy branch canopy
  ctx.fillStyle = isHit ? '#ffffff' : '#78350f'; // oak bark
  ctx.beginPath();
  ctx.ellipse(-2, 0, 18, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lush green foliage canopy over shoulders & head
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(-5, -10, 9, 0, Math.PI * 2);
  ctx.arc(-5, 10, 9, 0, Math.PI * 2);
  ctx.arc(6, 0, 8, 0, Math.PI * 2);
  ctx.fill();

  // Amber glowing tree eyes
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(8, -3, 3, 2);
  ctx.fillRect(8, 2, 3, 2);
}

function drawElvesArcher({ ctx, isHit }: RenderContext) {
  // Tall slender marksman, long curved elven longbow, silver quiver
  ctx.fillStyle = isHit ? '#ffffff' : '#047857';
  ctx.beginPath();
  ctx.ellipse(-1, 0, 8, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head with silver hair & circlet
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(2, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Long recurve elven longbow
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(8, 0, 9, -Math.PI / 2.3, Math.PI / 2.3);
  ctx.stroke();
}

function drawElvesSorceress({ ctx, isHit }: RenderContext) {
  // Flowing silken gown, star staff with radiant cyan crystal
  ctx.fillStyle = isHit ? '#ffffff' : '#0d9488';
  ctx.beginPath();
  ctx.ellipse(-2, 0, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head with golden circlet
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(2, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Elegant wooden staff
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(1, 5);
  ctx.lineTo(16, 5);
  ctx.stroke();

  // Radiant cyan crystal star
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(17, 5, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawElvesHippogriffRider({ ctx, isHit }: RenderContext) {
  // Eagle head + talons in front, feathered sweeping wings, lion body behind
  ctx.fillStyle = isHit ? '#ffffff' : '#d97706'; // tawny body
  ctx.beginPath();
  ctx.ellipse(-3, 0, 16, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eagle head & sharp beak pointing forward
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(8, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#eab308'; // Golden beak
  ctx.beginPath();
  ctx.moveTo(12, -2);
  ctx.lineTo(19, 0);
  ctx.lineTo(12, 2);
  ctx.closePath();
  ctx.fill();

  // Sweeping feathery wings
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.moveTo(-3, -6);
  ctx.lineTo(-6, -20);
  ctx.lineTo(6, -14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-3, 6);
  ctx.lineTo(-6, 20);
  ctx.lineTo(6, 14);
  ctx.closePath();
  ctx.fill();

  // Elven rider
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(-2, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawElvesArchdruid({ ctx, isHit }: RenderContext) {
  // Hero: magnificent stag antlers, emerald nature staff, swirling leaf aura
  ctx.fillStyle = isHit ? '#ffffff' : '#065f46';
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head with stag antlers
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(3, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Majestic branching antlers
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1, -5);
  ctx.lineTo(-4, -13);
  ctx.lineTo(-1, -16);
  ctx.moveTo(1, 5);
  ctx.lineTo(-4, 13);
  ctx.lineTo(-1, 16);
  ctx.stroke();

  // Gnarled staff with radiant green gem
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(3, 6);
  ctx.lineTo(20, 6);
  ctx.stroke();
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(21, 6, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawElvesNatureCatapult({ ctx, isHit }: RenderContext) {
  // Living root & branch trebuchet
  ctx.fillStyle = isHit ? '#ffffff' : '#78350f';
  ctx.fillRect(-9, -9, 18, 18);
  ctx.fillStyle = '#15803d'; // Leaf wrapping
  ctx.fillRect(-7, -7, 14, 14);

  // Living branch throwing arm
  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(16, 0);
  ctx.stroke();

  // Enchanted stone
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(16, 0, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawElvesAncientGuardian({ ctx, isHit }: RenderContext) {
  // Colossal stone and wood ancient construct, massive shoulder rune plates
  ctx.fillStyle = isHit ? '#ffffff' : '#475569';
  ctx.beginPath();
  ctx.ellipse(-2, 0, 20, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rune plates
  ctx.fillStyle = '#10b981';
  ctx.fillRect(-10, -14, 8, 6);
  ctx.fillRect(-10, 8, 8, 6);

  // Head with amber gaze
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(9, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#34d399';
  ctx.fillRect(10, -2, 4, 4);
}

// Fallback generic renderer
function drawGenericUnit({ ctx, unit, primaryColor, isHit }: RenderContext) {
  ctx.fillStyle = isHit ? '#ffffff' : primaryColor;
  ctx.beginPath();
  ctx.arc(0, 0, unit.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(unit.radius + 3, 0);
  ctx.stroke();
}

const DEFAULT_RENDERERS: Record<string, UnitRenderFn> = {
  gatherer: drawKingdomsPeasant,
  melee: drawKingdomsSwordsman,
  ranged: drawKingdomsArcher,
  tank: drawKingdomsKnight,
  caster: drawKingdomsBattlemage,
  siege: drawKingdomsCannon,
  hero: drawKingdomsPaladin,
};

const UNIT_RENDERERS: Record<string, UnitRenderFn> = {
  kingdoms_peasant: drawKingdomsPeasant,
  kingdoms_swordsman: drawKingdomsSwordsman,
  kingdoms_knight: drawKingdomsKnight,
  kingdoms_archer: drawKingdomsArcher,
  kingdoms_battlemage: drawKingdomsBattlemage,
  kingdoms_priest: drawKingdomsPriest,
  kingdoms_paladin: drawKingdomsPaladin,
  kingdoms_cannon: drawKingdomsCannon,
  kingdoms_royal_guard: drawKingdomsRoyalGuard,

  horde_peon: drawHordePeon,
  horde_grunt: drawHordeGrunt,
  horde_ogre: drawHordeOgre,
  horde_troll_hunter: drawHordeTrollHunter,
  horde_spirit_shaman: drawHordeSpiritShaman,
  horde_wolf_rider: drawHordeWolfRider,
  horde_blademaster: drawHordeBlademaster,
  horde_catapult: drawHordeCatapult,
  horde_berserker: drawHordeBerserker,

  undead_acolyte: drawUndeadAcolyte,
  undead_ghoul: drawUndeadGhoul,
  undead_abomination: drawUndeadAbomination,
  undead_crypt_archer: drawUndeadCryptArcher,
  undead_necromancer: drawUndeadNecromancer,
  undead_wraith: drawUndeadWraith,
  undead_death_knight: drawUndeadDeathKnight,
  undead_bone_catapult: drawUndeadBoneCatapult,
  undead_bone_dragon: drawUndeadBoneDragon,
  undead_skeleton: drawUndeadSkeleton,

  elves_wisp: drawElvesWisp,
  elves_bladedancer: drawElvesBladedancer,
  elves_treant: drawElvesTreant,
  elves_archer: drawElvesArcher,
  elves_sorceress: drawElvesSorceress,
  elves_hippogriff_rider: drawElvesHippogriffRider,
  elves_archdruid: drawElvesArchdruid,
  elves_nature_catapult: drawElvesNatureCatapult,
  elves_ancient_guardian: drawElvesAncientGuardian,
  elves_treant_summon: drawElvesTreant,
};
