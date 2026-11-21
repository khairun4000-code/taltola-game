/**
 * Khulna Alia Kamil Madrasah — Principal's Office Live PA Microphone & Campus Echo System.
 * Requests browser microphone permission on [M] near the Principal's desk and routes the
 * user's live voice through an authentic PA Horn EQ + multi-tap courtyard echo/reverb chain
 * so every spoken word echoes across the entire Alia Madrasah campus.
 */
import { VOICE_BUS } from './voice-clips.js';

export function createAliaPrincipalMic({ onStatusToast } = {}) {
  let audioCtx = null;
  let mediaStream = null;
  let sourceNode = null;
  let analyserNode = null;
  let masterOut = null;
  let freqData = null;
  let active = false;
  let pending = false;

  function ensureAudioContext() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playPaChime(turningOn = true) {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = turningOn ? [659.25, 880.0, 1046.5] : [659.25, 440.0];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.085);
        g.gain.setValueAtTime(0.0001, now + idx * 0.085);
        g.gain.exponentialRampToValueAtTime(0.11, now + idx * 0.085 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.085 + 0.24);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + idx * 0.085);
        osc.stop(now + idx * 0.085 + 0.26);
      });
    } catch {}
  }

  function disconnectGraph() {
    try { sourceNode?.disconnect(); } catch {}
    try { masterOut?.disconnect(); } catch {}
    sourceNode = null;
    analyserNode = null;
    masterOut = null;
    freqData = null;
    if (mediaStream) {
      for (const track of mediaStream.getTracks()) {
        try { track.stop(); } catch {}
      }
      mediaStream = null;
    }
  }

  async function start() {
    if (active || pending) return active;
    if (!navigator.mediaDevices?.getUserMedia) {
      onStatusToast?.('⚠️ এই ব্রাউজারে মাইক্রোফোন সাপোর্ট নেই।');
      return false;
    }
    pending = true;
    try {
      VOICE_BUS.stopAll();
      const ctx = ensureAudioContext();
      if (!ctx) {
        onStatusToast?.('⚠️ Web Audio API চালু করা যায়নি।');
        return false;
      }
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      sourceNode = ctx.createMediaStreamSource(mediaStream);

      // Live level analyser for 3D mic LED pulse
      analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.65;
      freqData = new Uint8Array(analyserNode.frequencyBinCount);

      // Authentic Bangladeshi Madrasah PA Horn EQ (Ahuja-style crisp vocal presence)
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 210;

      const presence = ctx.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.value = 1850;
      presence.Q.value = 1.15;
      presence.gain.value = 5.5;

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 4400;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 14;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.14;

      masterOut = ctx.createGain();
      masterOut.gain.value = 0.92;

      // Direct PA broadcast signal
      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.86;

      // Tap 1: Short veranda/hall slap echo (210ms)
      const delay1 = ctx.createDelay(1.5);
      delay1.delayTime.value = 0.21;
      const tap1Filter = ctx.createBiquadFilter();
      tap1Filter.type = 'lowpass';
      tap1Filter.frequency.value = 3000;
      const tap1Gain = ctx.createGain();
      tap1Gain.gain.value = 0.44;

      // Tap 2: Main Alia Madrasah courtyard echo with warm feedback loop (460ms)
      const delay2 = ctx.createDelay(1.5);
      delay2.delayTime.value = 0.46;
      const tap2Filter = ctx.createBiquadFilter();
      tap2Filter.type = 'lowpass';
      tap2Filter.frequency.value = 2300;
      const tap2Gain = ctx.createGain();
      tap2Gain.gain.value = 0.50;
      const tap2Feedback = ctx.createGain();
      tap2Feedback.gain.value = 0.42;

      // Tap 3: Distant campus & field reflection (820ms)
      const delay3 = ctx.createDelay(1.5);
      delay3.delayTime.value = 0.82;
      const tap3Filter = ctx.createBiquadFilter();
      tap3Filter.type = 'lowpass';
      tap3Filter.frequency.value = 1750;
      const tap3Gain = ctx.createGain();
      tap3Gain.gain.value = 0.30;

      // Connect vocal chain
      sourceNode.connect(analyserNode);
      sourceNode.connect(hp);
      hp.connect(presence);
      presence.connect(lp);
      lp.connect(compressor);

      // Dry path
      compressor.connect(dryGain);
      dryGain.connect(masterOut);

      // Echo tap 1
      compressor.connect(delay1);
      delay1.connect(tap1Filter);
      tap1Filter.connect(tap1Gain);
      tap1Gain.connect(masterOut);

      // Echo tap 2 (with feedback)
      compressor.connect(delay2);
      delay2.connect(tap2Filter);
      tap2Filter.connect(tap2Gain);
      tap2Gain.connect(masterOut);
      tap2Filter.connect(tap2Feedback);
      tap2Feedback.connect(delay2);

      // Echo tap 3
      compressor.connect(delay3);
      delay3.connect(tap3Filter);
      tap3Filter.connect(tap3Gain);
      tap3Gain.connect(masterOut);

      masterOut.connect(ctx.destination);

      active = true;
      playPaChime(true);
      onStatusToast?.('🎙️ প্রিন্সিপালের মাইক চালু হয়েছে! কথা বলো — পুরো আলিয়া মাদ্রাসায় ইকো শোনা যাবে ([M] বন্ধ)।');
      return true;
    } catch (err) {
      disconnectGraph();
      active = false;
      const denied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      onStatusToast?.(
        denied
          ? '🎙️ মাইকের পারমিশন দেওয়া হয়নি — ব্রাউজার থেকে Allow করে আবার [M] চাপো।'
          : '🎙️ মাইক্রোফোন চালু করা যায়নি — মাইক কানেক্ট আছে কিনা দেখে নাও।'
      );
      return false;
    } finally {
      pending = false;
    }
  }

  function stop(silent = false) {
    if (!active && !mediaStream) return;
    active = false;
    disconnectGraph();
    if (!silent) {
      playPaChime(false);
      onStatusToast?.('🔇 প্রিন্সিপালের মাইক বন্ধ করা হয়েছে।');
    }
  }

  async function toggle() {
    if (active) {
      stop(false);
      return false;
    }
    return await start();
  }

  function getLevel() {
    if (!active || !analyserNode || !freqData) return 0;
    analyserNode.getByteFrequencyData(freqData);
    let sum = 0;
    const len = Math.min(48, freqData.length);
    for (let i = 2; i < len; i++) sum += freqData[i];
    return Math.min(1, sum / (len * 95));
  }

  return {
    get active() { return active; },
    start,
    stop,
    toggle,
    getLevel,
  };
}
