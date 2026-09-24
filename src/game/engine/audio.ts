import { FactionId } from '../types';

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicVolume: number = 0.4;
  private sfxVolume: number = 0.6;
  private musicInterval: number | null = null;
  private currentFaction: FactionId = 'kingdoms';
  private isInitialized: boolean = false;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const savedMute = localStorage.getItem('four_realms_mute');
      const savedMusic = localStorage.getItem('four_realms_music_vol');
      const savedSfx = localStorage.getItem('four_realms_sfx_vol');
      if (savedMute !== null) this.isMuted = savedMute === 'true';
      if (savedMusic !== null) this.musicVolume = parseFloat(savedMusic);
      if (savedSfx !== null) this.sfxVolume = parseFloat(savedSfx);
    } catch {
      // Ignore local storage errors
    }
  }

  public saveSettings() {
    try {
      localStorage.setItem('four_realms_mute', String(this.isMuted));
      localStorage.setItem('four_realms_music_vol', String(this.musicVolume));
      localStorage.setItem('four_realms_sfx_vol', String(this.sfxVolume));
    } catch {
      // Ignore local storage errors
    }
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isInitialized = true;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.saveSettings();
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    this.saveSettings();
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    this.saveSettings();
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public startMusic(faction: FactionId) {
    this.currentFaction = faction;
    this.stopMusic();

    if (this.isMuted || this.musicVolume <= 0) return;

    // Periodic ambient fantasy procedural music bar
    let step = 0;
    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || this.musicVolume <= 0) return;
      this.playFactionAmbientBar(faction, step);
      step = (step + 1) % 8;
    }, 2800);
  }

  public stopMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, gainVal: number, delay: number = 0) {
    if (this.isMuted || !this.ctx || gainVal <= 0) return;

    try {
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    } catch {
      // Audio context might be restricted
    }
  }

  private playFactionAmbientBar(faction: FactionId, step: number) {
    const vol = this.musicVolume * 0.18;

    if (faction === 'kingdoms') {
      // Royal noble brass & string harmonies
      const notes = [220, 277.18, 329.63, 440, 554.37]; // A major
      const f1 = notes[step % notes.length];
      const f2 = notes[(step + 2) % notes.length];
      this.playTone(f1, 'sine', 2.4, vol * 0.7);
      this.playTone(f2, 'triangle', 2.0, vol * 0.5, 0.4);
    } else if (faction === 'horde') {
      // Rugged, deep, ominous rhythmic war tones
      const baseFreq = step % 2 === 0 ? 110 : 130.81;
      this.playTone(baseFreq, 'sawtooth', 0.8, vol * 0.4);
      this.playTone(baseFreq * 0.5, 'triangle', 1.2, vol * 0.8);
      if (step % 2 === 1) {
        this.playTone(196, 'sawtooth', 0.5, vol * 0.3, 0.3);
      }
    } else if (faction === 'undead') {
      // Eerie, haunting minor drones and eerie bell tones
      const notes = [146.83, 174.61, 220, 261.63, 311.13]; // D minor/diminished
      const f = notes[step % notes.length];
      this.playTone(f, 'sine', 2.8, vol * 0.6);
      this.playTone(f * 2.01, 'sine', 1.5, vol * 0.3, 0.2);
    } else {
      // Elves: Ethereal flowing pentatonic arpeggios
      const notes = [329.63, 392.00, 440.00, 493.88, 587.33, 659.25]; // E minor pentatonic
      const f1 = notes[step % notes.length];
      const f2 = notes[(step + 3) % notes.length];
      this.playTone(f1, 'sine', 2.2, vol * 0.6);
      this.playTone(f2, 'triangle', 1.8, vol * 0.4, 0.3);
    }
  }

  // ================= SFX =================

  public playSelectUnit(faction: FactionId) {
    if (this.isMuted || !this.ctx) return;
    const vol = this.sfxVolume * 0.35;
    if (faction === 'kingdoms') {
      this.playTone(392, 'sine', 0.15, vol);
      this.playTone(523.25, 'triangle', 0.2, vol * 0.8, 0.08);
    } else if (faction === 'horde') {
      this.playTone(130, 'sawtooth', 0.25, vol * 0.6);
      this.playTone(164, 'triangle', 0.2, vol * 0.5, 0.06);
    } else if (faction === 'undead') {
      this.playTone(220, 'sine', 0.3, vol * 0.6);
      this.playTone(185, 'sawtooth', 0.25, vol * 0.3, 0.1);
    } else {
      this.playTone(659.25, 'sine', 0.2, vol * 0.7);
      this.playTone(880, 'sine', 0.25, vol * 0.5, 0.06);
    }
  }

  public playCommandMove() {
    const vol = this.sfxVolume * 0.25;
    this.playTone(440, 'sine', 0.08, vol);
    this.playTone(554.37, 'sine', 0.12, vol * 0.8, 0.04);
  }

  public playCommandAttack() {
    const vol = this.sfxVolume * 0.35;
    this.playTone(330, 'triangle', 0.1, vol);
    this.playTone(220, 'sawtooth', 0.15, vol * 0.6, 0.05);
  }

  public playMeleeHit() {
    const vol = this.sfxVolume * 0.3;
    this.playTone(160, 'triangle', 0.08, vol);
    this.playTone(90, 'sawtooth', 0.12, vol * 0.5, 0.02);
  }

  public playArrowShot() {
    const vol = this.sfxVolume * 0.25;
    this.playTone(587.33, 'triangle', 0.08, vol);
    this.playTone(440, 'sine', 0.1, vol * 0.6, 0.04);
  }

  public playExplosion() {
    const vol = this.sfxVolume * 0.45;
    this.playTone(80, 'sawtooth', 0.4, vol);
    this.playTone(55, 'triangle', 0.5, vol * 0.8, 0.05);
  }

  public playSpellCast(type: string) {
    const vol = this.sfxVolume * 0.35;
    if (type === 'holy') {
      this.playTone(523.25, 'sine', 0.3, vol);
      this.playTone(783.99, 'sine', 0.4, vol * 0.8, 0.08);
      this.playTone(1046.5, 'triangle', 0.35, vol * 0.5, 0.16);
    } else if (type === 'fire') {
      this.playTone(220, 'sawtooth', 0.2, vol);
      this.playTone(146.83, 'triangle', 0.35, vol * 0.8, 0.05);
    } else if (type === 'unholy') {
      this.playTone(196, 'sawtooth', 0.3, vol * 0.7);
      this.playTone(146.83, 'sine', 0.35, vol, 0.08);
    } else {
      // Nature / wind
      this.playTone(659.25, 'sine', 0.25, vol);
      this.playTone(587.33, 'triangle', 0.3, vol * 0.8, 0.06);
    }
  }

  public playGoldDeposit() {
    const vol = this.sfxVolume * 0.3;
    this.playTone(987.77, 'sine', 0.1, vol);
    this.playTone(1318.51, 'sine', 0.15, vol * 0.8, 0.06);
  }

  public playUnitTrained() {
    const vol = this.sfxVolume * 0.35;
    this.playTone(392, 'triangle', 0.12, vol);
    this.playTone(493.88, 'triangle', 0.15, vol * 0.9, 0.08);
    this.playTone(587.33, 'sine', 0.22, vol, 0.16);
  }

  public playBuildingConstructed() {
    const vol = this.sfxVolume * 0.4;
    this.playTone(261.63, 'triangle', 0.15, vol);
    this.playTone(329.63, 'triangle', 0.18, vol, 0.1);
    this.playTone(392.00, 'sine', 0.25, vol * 0.9, 0.2);
    this.playTone(523.25, 'sine', 0.3, vol, 0.3);
  }

  public playHeroLevelUp() {
    const vol = this.sfxVolume * 0.5;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.25, vol, idx * 0.09);
    });
  }

  public playVictory() {
    const vol = this.sfxVolume * 0.6;
    const fanfare = [392, 523.25, 659.25, 783.99, 1046.5];
    fanfare.forEach((f, i) => {
      this.playTone(f, 'triangle', 0.45, vol, i * 0.14);
    });
  }

  public playDefeat() {
    const vol = this.sfxVolume * 0.6;
    const toll = [220, 207.65, 196, 174.61, 146.83];
    toll.forEach((f, i) => {
      this.playTone(f, 'sawtooth', 0.5, vol * 0.7, i * 0.2);
    });
  }
}

export const soundSystem = new SoundSystem();
