// Web Audio API Newspaper Page Flip Sound Synthesizer
// Provides realistic, crisp, zero-latency newsprint rustling sound effect

let audioCtx = null;

const getAudioContext = () => {
    if (typeof window === "undefined") return null;
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    return audioCtx;
};

/**
 * Plays a realistic, pleasant newspaper page flip / rustle sound
 */
export const playNewspaperFlipSound = () => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // 1. Noise Generator for Paper Friction & Texture
        const bufferSize = ctx.sampleRate * 0.28; // 280ms duration
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            // White noise with subtle pink falloff for natural paper grain
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        // 2. Bandpass Filter simulating paper movement & air friction
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.Q.setValueAtTime(2.2, now);
        // Frequency sweep simulating page turning across the hand
        bandpass.frequency.setValueAtTime(1100, now);
        bandpass.frequency.exponentialRampToValueAtTime(2800, now + 0.08);
        bandpass.frequency.exponentialRampToValueAtTime(850, now + 0.26);

        // 3. Gain Envelope for Paper Rustle
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.001, now);
        noiseGain.gain.linearRampToValueAtTime(0.38, now + 0.03); // crisp attack
        noiseGain.gain.exponentialRampToValueAtTime(0.18, now + 0.12);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.27); // smooth release

        whiteNoise.connect(bandpass);
        bandpass.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        // 4. Subtle Tactile Paper Snap / Low flutter (Broadsheet paper weight)
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

        oscGain.gain.setValueAtTime(0.001, now);
        oscGain.gain.linearRampToValueAtTime(0.12, now + 0.02);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        // Start both sound layers
        whiteNoise.start(now);
        osc.start(now);

        whiteNoise.stop(now + 0.28);
        osc.stop(now + 0.28);
    } catch (e) {
        console.warn("Audio synthesis note:", e);
    }
};

export default playNewspaperFlipSound;
