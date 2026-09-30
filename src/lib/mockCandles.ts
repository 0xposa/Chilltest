// Kuru DEX MON/USDC Candle Generator calibrated to Kuru.io market
import type { KLineData } from 'klinecharts';

function createRng(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateKuruCandles(count = 120): KLineData[] {
  const rng = createRng(42069);
  const oneHourMs = 60 * 60 * 1000;
  const now = Date.now();
  const startTime = now - count * oneHourMs;

  const candles: KLineData[] = [];
  let price = 0.0252;

  for (let i = 0; i < count; i++) {
    const timestamp = startTime + i * oneHourMs;

    // Menghasilkan pola pergerakan seperti di screenshot Kuru:
    // Fase 1: Sideways konsolidasi (0.025 - 0.0265)
    // Fase 2: Breakout reli ke 0.0289 - 0.0292
    // Fase 3: Retest / pullback ke 0.0268
    // Fase 4: Rebound stabil ke 0.02777
    let target = 0.02777;
    const progress = i / count;
    if (progress < 0.35) {
      target = 0.0256 + Math.sin(i * 0.3) * 0.0008;
    } else if (progress < 0.65) {
      target = 0.0286 + Math.sin(i * 0.4) * 0.0009;
    } else if (progress < 0.85) {
      target = 0.0266 + Math.sin(i * 0.5) * 0.0006;
    } else {
      target = 0.02777;
    }

    const drift = (target - price) * 0.12;
    const change = (rng() - 0.48) * 0.0007 + drift;

    const open = Number(price.toFixed(5));
    let close = Number((open + change).toFixed(5));
    if (close < 0.024) close = 0.024;

    const wickSpread = 0.0002 + rng() * 0.0004;
    const high = Number((Math.max(open, close) + wickSpread).toFixed(5));
    const low = Number((Math.max(0.023, Math.min(open, close) - wickSpread)).toFixed(5));

    const volume = Math.round(25000 + rng() * 180000);

    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    });

    price = close;
  }

  // Set candle terakhir persis seperti screenshot Kuru:
  // O 0.02741  H 0.02789  L 0.02738  C 0.02777
  const last = candles[candles.length - 1];
  if (last) {
    last.open = 0.02741;
    last.high = 0.02789;
    last.low = 0.02738;
    last.close = 0.02777;
  }

  return candles;
}

export const mockCandles = generateKuruCandles(120);
