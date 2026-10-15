import { PetSpeciesId } from '../types/game';
import { PET_SPECIES_MAP } from '../data/petSpecies';

class SoundManager {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Plays a distinct 8-bit chiptune vocal cry tailored to each pet species or animal kingdom family
   */
  public playSpeciesCry(
    speciesId: PetSpeciesId,
    mood: 'normal' | 'happy' | 'weak' = 'normal'
  ) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const pitchMult = mood === 'happy' ? 1.15 : mood === 'weak' ? 0.78 : 1.0;

    const speciesCfg = PET_SPECIES_MAP[speciesId];
    const cryCat = speciesCfg?.cryCategory || 'bark';

    if (speciesId === 'ignis_rex' || cryCat === 'mythic_ignis') {
      const freqs = [280, 420, 360, 580, 510].map((f) => f * pitchMult);
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i % 2 === 0 ? 'sawtooth' : 'square';
        const start = now + i * 0.055;
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.18, start + 0.05);
        gain.gain.setValueAtTime(0.06, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.095);
      });
      return;
    }

    if (speciesId === 'terradon' || cryCat === 'mythic_terradon') {
      const notes = [196.0, 246.94, 293.66, 261.63].map((f) => f * pitchMult);
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const start = now + i * 0.085;
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.linearRampToValueAtTime(freq * 0.96, start + 0.11);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.15);
      });
      return;
    }

    if (speciesId === 'aegis_wolf' || cryCat === 'mythic_aegis') {
      const scannerBeeps = [880, 1174.66, 1567.98].map((f) => f * pitchMult);
      scannerBeeps.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        const start = now + i * 0.04;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.045, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.045);
      });

      const howl = ctx.createOscillator();
      const howlGain = ctx.createGain();
      howl.type = 'sawtooth';
      const howlStart = now + 0.13;
      howl.frequency.setValueAtTime(310 * pitchMult, howlStart);
      howl.frequency.exponentialRampToValueAtTime(
        680 * pitchMult,
        howlStart + 0.16
      );
      howl.frequency.exponentialRampToValueAtTime(
        520 * pitchMult,
        howlStart + 0.28
      );
      howlGain.gain.setValueAtTime(0.06, howlStart);
      howlGain.gain.exponentialRampToValueAtTime(0.001, howlStart + 0.3);
      howl.connect(howlGain);
      howlGain.connect(ctx.destination);
      howl.start(howlStart);
      howl.stop(howlStart + 0.31);
      return;
    }

    if (speciesId === 'celestia' || cryCat === 'mythic_celestia') {
      const chimes = [659.25, 783.99, 987.77, 1318.51, 1567.98].map(
        (f) => f * pitchMult
      );
      chimes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = now + i * 0.048;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.065, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.17);
      });
      return;
    }

    if (speciesId === 'obsidian_titan' || cryCat === 'mythic_obsidian') {
      const roar = ctx.createOscillator();
      const roarGain = ctx.createGain();
      roar.type = 'sawtooth';
      roar.frequency.setValueAtTime(135 * pitchMult, now);
      roar.frequency.linearRampToValueAtTime(92 * pitchMult, now + 0.22);
      roar.frequency.linearRampToValueAtTime(148 * pitchMult, now + 0.32);
      roarGain.gain.setValueAtTime(0.085, now);
      roarGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      roar.connect(roarGain);
      roarGain.connect(ctx.destination);
      roar.start(now);
      roar.stop(now + 0.39);
      return;
    }

    // Real-World Animal Kingdom Cries
    if (cryCat === 'bark') {
      // Double Canine Bark (Woof-Woof!)
      [0, 0.14].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const start = now + offset;
        const base = (idx === 0 ? 320 : 380) * pitchMult;
        osc.frequency.setValueAtTime(base * 0.8, start);
        osc.frequency.exponentialRampToValueAtTime(base * 1.35, start + 0.045);
        osc.frequency.exponentialRampToValueAtTime(base * 0.7, start + 0.1);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.11);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.12);
      });
      return;
    }

    if (cryCat === 'meow') {
      // Melodic Feline Meow (Rising then gently dipping sine/triangle glide)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480 * pitchMult, now);
      osc.frequency.exponentialRampToValueAtTime(780 * pitchMult, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(540 * pitchMult, now + 0.28);
      gain.gain.setValueAtTime(0.075, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.31);
      return;
    }

    if (cryCat === 'chirp') {
      // Bird / Songbird / Eagle / Parrot Triple Tweet-Chirp
      [780, 1046, 1318].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = now + idx * 0.055;
        osc.frequency.setValueAtTime(f * pitchMult, start);
        osc.frequency.exponentialRampToValueAtTime(
          f * 1.25 * pitchMult,
          start + 0.04
        );
        gain.gain.setValueAtTime(0.065, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.055);
      });
      return;
    }

    if (cryCat === 'quack') {
      // Duck / Penguin / Waterfowl Double Quack
      [0, 0.12].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        const start = now + offset;
        osc.frequency.setValueAtTime(410 * pitchMult, start);
        osc.frequency.linearRampToValueAtTime(310 * pitchMult, start + 0.09);
        gain.gain.setValueAtTime(0.055, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.095);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.1);
      });
      return;
    }

    if (cryCat === 'farm_low') {
      // Cow / Sheep / Goat / Horse / Deer / Giraffe / Elephant Brass Call
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(195 * pitchMult, now);
      osc.frequency.linearRampToValueAtTime(245 * pitchMult, now + 0.15);
      osc.frequency.linearRampToValueAtTime(180 * pitchMult, now + 0.32);
      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
      return;
    }

    if (cryCat === 'squeak') {
      // Rabbit / Squirrel / Hedgehog / Koala / Red Panda Cute High Squeak
      [920, 1180].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const start = now + idx * 0.06;
        osc.frequency.setValueAtTime(f * pitchMult, start);
        osc.frequency.exponentialRampToValueAtTime(
          f * 1.18 * pitchMult,
          start + 0.045
        );
        gain.gain.setValueAtTime(0.06, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.055);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.06);
      });
      return;
    }

    if (cryCat === 'splash') {
      // Dolphin / Axolotl / Chameleon Bubbly Aquatic Whistle
      [520, 680, 880, 1046].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = now + idx * 0.045;
        osc.frequency.setValueAtTime(f * pitchMult, start);
        gain.gain.setValueAtTime(0.06, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.075);
      });
      return;
    }

    // Default 'roar' (Lion, Tiger, Grizzly Bear, Gorilla, Hippo, Rhino, Shark)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160 * pitchMult, now);
    osc.frequency.exponentialRampToValueAtTime(240 * pitchMult, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(115 * pitchMult, now + 0.28);
    gain.gain.setValueAtTime(0.075, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.31);
  }

  public playTaskComplete() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.06, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.2);
    });
  }

  public playTimerStart() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [440, 587.33, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.06, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.13);
    });
  }

  public playTimerAlarmComplete() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [587.33, 783.99, 987.77, 1174.66, 1567.98];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.065);
      gain.gain.setValueAtTime(0.065, now + idx * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.065);
      osc.stop(now + idx * 0.065 + 0.24);
    });
  }

  public playEvolution() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.075);
      gain.gain.setValueAtTime(0.07, now + idx * 0.075);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.075 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.075);
      osc.stop(now + idx * 0.075 + 0.38);
    });
  }

  public playPenaltyBuzzer() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [180, 130];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);
      gain.gain.setValueAtTime(0.08, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.22);
    });
  }

  public playCoinSpend() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.05, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.17);
    });
  }

  public playTickle() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [659.25, 783.99, 659.25, 880, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.045, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.09);
    });
  }

  public playFallOver() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.28);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.33);

    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'square';
    thud.frequency.setValueAtTime(95, now + 0.26);
    thud.frequency.exponentialRampToValueAtTime(48, now + 0.42);
    thudGain.gain.setValueAtTime(0.09, now + 0.26);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(now + 0.26);
    thud.stop(now + 0.45);
  }

  public playJumpFlip() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.22);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.05);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }
}

export const soundFX = new SoundManager();
