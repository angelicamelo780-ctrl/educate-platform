// Sonidos cortos de la plataforma, sintetizados con Web Audio API (sin
// archivos). Un solo AudioContext para toda la app.

let sharedCtx: AudioContext | null = null;
let lastSquashAt = 0;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedCtx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      sharedCtx = new Ctx();
    }
    if (sharedCtx.state === "suspended") void sharedCtx.resume();
    return sharedCtx;
  } catch {
    return null;
  }
}

// "Splat + pip-pop" al aplastar un mosquito: sutil, divertido y corto.
// Solo se llama desde un clic/tap (así el navegador permite el audio) y se
// limita a 1 sonido cada ~150 ms para que los clics rápidos no lo saturen.
export function playSquashSound() {
  const nowMs = Date.now();
  if (nowMs - lastSquashAt < 150) return;
  lastSquashAt = nowMs;

  const ctx = getCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);

    // a) "splat": ráfaga de ruido con pasa-banda que baja de 1400 a 300 Hz
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(1400, now);
    bp.frequency.exponentialRampToValueAtTime(300, now + 0.12);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.5, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    noise.connect(bp).connect(ng).connect(master);
    noise.start(now);

    // b) "pip-pop": dos notas cortas ascendentes (G5 → C6)
    (
      [
        [784, 0.07],
        [1047, 0.15],
      ] as const
    ).forEach(([f, t]) => {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now + t);
      g.gain.exponentialRampToValueAtTime(0.25, now + t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.09);
      o.connect(g).connect(master);
      o.start(now + t);
      o.stop(now + t + 0.1);
    });
  } catch {
    // Si el navegador bloquea el audio, simplemente no suena.
  }
}
