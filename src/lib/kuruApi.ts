// Kuru API Client for MON_USDC (REST Trades, KLines + WebSocket)
// Follows Binance-style formats

export interface KuruTradeItem {
  id: string | number;
  rowKey: string;
  price: number;
  qty: number;
  total: number;
  time: number;
  timeFormatted: string;
  isBuyerMaker: boolean;
  type: 'Buy' | 'Sell';
  trader?: string;
  tx?: string;
  _raw?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface KuruKLineBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  [key: string]: unknown;
}

export interface LoadHistoryResult {
  method: 'A' | 'B';
  pages: number;
  totalTrades: number;
  trades: KuruTradeItem[];
  startTime: number | null;
  endTime: number | null;
  lastError: string;
}

export interface BuildCandlesResult {
  candles: KuruKLineBar[];
  allTrades: KuruTradeItem[];
  totalTradesLoaded: number;
  startTime: number | null;
  endTime: number | null;
}

export type ChartTimeframe =
  | '5s'
  | '15s'
  | '30s'
  | '1m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | 'all';

export const TIMEFRAMES: { key: ChartTimeframe; label: string }[] = [
  { key: '5s', label: '5s' },
  { key: '15s', label: '15s' },
  { key: '30s', label: '30s' },
  { key: '1m', label: '1m' },
  { key: '5m', label: '5m' },
  { key: '15m', label: '15m' },
  { key: '30m', label: '30m' },
  { key: '1h', label: '1h' },
  { key: 'all', label: 'all' },
];

export function getKlineChartPeriod(tf: ChartTimeframe): {
  type: 'second' | 'minute' | 'hour' | 'day';
  span: number;
} {
  switch (tf) {
    case '5s':
      return { type: 'second', span: 5 };
    case '15s':
      return { type: 'second', span: 15 };
    case '30s':
      return { type: 'second', span: 30 };
    case '1m':
      return { type: 'minute', span: 1 };
    case '5m':
      return { type: 'minute', span: 5 };
    case '15m':
      return { type: 'minute', span: 15 };
    case '30m':
      return { type: 'minute', span: 30 };
    case '1h':
      return { type: 'hour', span: 1 };
    case 'all':
      return { type: 'day', span: 1 };
    default:
      return { type: 'minute', span: 1 };
  }
}

export function getTimeframeIntervalMs(tf: ChartTimeframe, trades?: KuruTradeItem[]): number {
  switch (tf) {
    case '5s':
      return 5000;
    case '15s':
      return 15000;
    case '30s':
      return 30000;
    case '1m':
      return 60000;
    case '5m':
      return 300000;
    case '15m':
      return 900000;
    case '30m':
      return 1800000;
    case '1h':
      return 3600000;
    case 'all': {
      if (trades && trades.length > 1) {
        const span = trades[trades.length - 1].time - trades[0].time;
        if (span <= 600000) return 15000; // <= 10m: 15s
        if (span <= 3600000) return 60000; // <= 1h: 1m
        if (span <= 86400000) return 300000; // <= 24h: 5m
        return 3600000; // > 24h: 1h
      }
      return 3600000;
    }
    default:
      return 60000;
  }
}

export const KURU_REST_URL = 'https://exchange.kuru.io/api/v3/trades?symbol=MON_USDC&limit=50';
export const KURU_PROXY_URL = '/api/v3/trades?symbol=MON_USDC&limit=50';
export const KURU_WS_URL = 'wss://exchange.kuru.io/ws';

let firstRawTradeObj: Record<string, unknown> | null = null;

export function getFirstRawTrade(): Record<string, unknown> | null {
  return firstRawTradeObj;
}

// Helper normalisasi waktu: < 1e12 dikalikan 1000 (detik -> milidetik)
export function normalizeKuruTimestamp(val: number | string | undefined): number {
  if (val === undefined || val === null) return Date.now();
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num) || num <= 0) return Date.now();
  if (num < 1e12) {
    return Math.floor(num * 1000);
  }
  return Math.floor(num);
}

// Parser helper untuk harga Kuru (mengonversi format wei 1e18 jika diperlukan)
export function parseKuruPrice(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return 0;
  if (num > 1e12) {
    return num / 1e18;
  }
  return num;
}

// Parser helper untuk kuantitas token MON di Kuru (sizePrecision 10^10, base 10^12)
export function parseKuruQty(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return 0;
  if (num > 1e10) {
    return num / 1e12;
  }
  if (num > 1000) {
    return num / 1e18;
  }
  return num;
}

export function formatTradeTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-US', { hour12: false });
}

// Normalisasi pesan trade mentah (baik dari REST maupun WebSocket format Binance)
export function normalizeKuruTrade(raw: Record<string, unknown>): KuruTradeItem {
  if (!firstRawTradeObj && raw) {
    firstRawTradeObj = raw;
  }

  const id =
    (raw.a as string | number) ??
    (raw.t as string | number) ??
    (raw.id as string | number) ??
    `trade-${Date.now()}-${Math.random()}`;

  const rawPrice = (raw.p as string | number) ?? (raw.price as string | number) ?? 0;
  const rawQty = (raw.q as string | number) ?? (raw.qty as string | number) ?? 0;
  const rawTime =
    (raw.T as number) ??
    (raw.E as number) ??
    (raw.time as number) ??
    Date.now();
  const time = normalizeKuruTimestamp(rawTime);

  // Format Binance: m = isBuyerMaker. Jika isBuyerMaker = true -> Sell, selain itu Buy
  const isBuyerMaker = (raw.m as boolean) ?? (raw.isBuyerMaker as boolean) ?? false;
  const type: 'Buy' | 'Sell' = isBuyerMaker ? 'Sell' : 'Buy';

  const price = parseKuruPrice(rawPrice);
  const qty = parseKuruQty(rawQty);
  const total = Number((price * qty).toFixed(6));

  const trader = (raw.trader as string) || (raw.maker as string) || (raw.taker as string) || undefined;
  const tx =
    (raw.tx as string) ||
    (raw.txHash as string) ||
    (raw.transactionHash as string) ||
    (raw.hash as string) ||
    (raw.tx_hash as string) ||
    undefined;

  const rowKey = `${id}-${time}-${rawPrice}-${rawQty}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    ...raw,
    id,
    rowKey,
    price,
    qty,
    total,
    time,
    timeFormatted: formatTradeTime(time),
    isBuyerMaker,
    type,
    trader,
    tx,
    _raw: raw,
  };
}

// Helper fetch dengan fallback ke reverse proxy lokal jika terkena CORS browser
async function fetchEndpointWithProxy(path: string, query: string): Promise<unknown> {
  const directUrl = `https://exchange.kuru.io${path}?${query}`;
  const proxyUrl = `${path}?${query}`;

  try {
    const res = await fetch(directUrl);
    if (res.ok) {
      return await res.json();
    }
    throw new Error(`HTTP ${res.status}`);
  } catch (directErr) {
    try {
      const res = await fetch(proxyUrl);
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (proxyErr) {
      throw directErr instanceof Error ? directErr : proxyErr;
    }
  }
}

// Muat riwayat transaksi lebih panjang dengan Metode A dan fallback ke Metode B
export async function fetchLongHistoricalTrades(): Promise<LoadHistoryResult> {
  let method: 'A' | 'B' = 'A';
  let pages = 0;
  let lastError = '-';
  const tradeMap = new Map<string | number, KuruTradeItem>();
  let minId = Infinity;

  // METODE A:
  // 1. Ambil GET /api/v3/trades?symbol=MON_USDC&limit=1000
  try {
    const data = await fetchEndpointWithProxy('/api/v3/trades', 'symbol=MON_USDC&limit=1000');
    if (Array.isArray(data) && data.length > 0) {
      pages++;
      for (const item of data) {
        const t = normalizeKuruTrade(item as Record<string, unknown>);
        tradeMap.set(t.id, t);
        const idNum = Number(t.id);
        if (!isNaN(idNum) && idNum < minId) {
          minId = idNum;
        }
      }
    }
  } catch (err: unknown) {
    lastError = err instanceof Error ? err.message : 'Error';
  }

  // 2. Ulangi dengan fromId = (id terkecil - 1000) pada /api/v3/trades,
  // dan kalau tidak menambah data, pada /api/v3/historicalTrades
  while (pages < 100 && minId < Infinity) {
    await new Promise((r) => setTimeout(r, 100));
    let addedCount = 0;

    // Coba /api/v3/trades
    try {
      const data = await fetchEndpointWithProxy(
        '/api/v3/trades',
        `symbol=MON_USDC&limit=1000&fromId=${minId - 1000}`
      );
      if (Array.isArray(data)) {
        for (const item of data) {
          const t = normalizeKuruTrade(item as Record<string, unknown>);
          if (!tradeMap.has(t.id)) {
            tradeMap.set(t.id, t);
            addedCount++;
            const idNum = Number(t.id);
            if (!isNaN(idNum) && idNum < minId) {
              minId = idNum;
            }
          }
        }
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : 'Error';
      break;
    }

    if (addedCount > 0) {
      pages++;
      continue;
    }

    // Kalau tidak menambah data, coba /api/v3/historicalTrades
    try {
      const data = await fetchEndpointWithProxy(
        '/api/v3/historicalTrades',
        `symbol=MON_USDC&limit=1000&fromId=${minId - 1000}`
      );
      if (Array.isArray(data)) {
        for (const item of data) {
          const t = normalizeKuruTrade(item as Record<string, unknown>);
          if (!tradeMap.has(t.id)) {
            tradeMap.set(t.id, t);
            addedCount++;
            const idNum = Number(t.id);
            if (!isNaN(idNum) && idNum < minId) {
              minId = idNum;
            }
          }
        }
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : 'Error';
      break;
    }

    if (addedCount === 0) {
      // Tidak ada id baru lagi, berhenti
      break;
    }
    pages++;
  }

  // METODE B: kalau A tidak menambah data baru sama sekali
  if (tradeMap.size === 0) {
    method = 'B';
    pages = 0;
    lastError = '-';
    const now = Date.now();
    for (let h = 0; h < 48; h++) {
      const windowEnd = now - h * 3600000;
      const windowStart = windowEnd - 3600000;
      try {
        const data = await fetchEndpointWithProxy(
          '/api/v3/aggTrades',
          `symbol=MON_USDC&startTime=${windowStart}&endTime=${windowEnd}`
        );
        if (Array.isArray(data) && data.length > 0) {
          pages++;
          for (const item of data) {
            const t = normalizeKuruTrade(item as Record<string, unknown>);
            tradeMap.set(t.id, t);
          }
        } else {
          break;
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : 'Error';
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  const allTrades = Array.from(tradeMap.values());
  allTrades.sort((a, b) => a.time - b.time);

  return {
    method,
    pages,
    totalTrades: allTrades.length,
    trades: allTrades,
    startTime: allTrades.length > 0 ? allTrades[0].time : null,
    endTime: allTrades.length > 0 ? allTrades[allTrades.length - 1].time : null,
    lastError,
  };
}

// Bangun susunan candle dari sekumpulan trade berdasarkan timeframe pilihan
export function buildCandlesFromTrades(
  allTrades: KuruTradeItem[],
  timeframe: ChartTimeframe = '1m'
): { candles: KuruKLineBar[]; startTime: number | null; endTime: number | null } {
  if (!allTrades || allTrades.length === 0) {
    return { candles: [], startTime: null, endTime: null };
  }

  const intervalMs = getTimeframeIntervalMs(timeframe, allTrades);

  const startTime = allTrades[0].time;
  const endTime = allTrades[allTrades.length - 1].time;

  const bucketMap = new Map<number, KuruTradeItem[]>();
  for (const t of allTrades) {
    const bucket = Math.floor(t.time / intervalMs) * intervalMs;
    const list = bucketMap.get(bucket);
    if (!list) {
      bucketMap.set(bucket, [t]);
    } else {
      list.push(t);
    }
  }

  const startBucket = Math.floor(startTime / intervalMs) * intervalMs;
  const endBucket = Math.floor(endTime / intervalMs) * intervalMs;

  const candles: KuruKLineBar[] = [];
  let prevClose = allTrades[0].price;

  const maxCandles = 2500;
  const totalSlots = Math.floor((endBucket - startBucket) / intervalMs) + 1;
  const stepMs = totalSlots > maxCandles ? Math.ceil(totalSlots / maxCandles) * intervalMs : intervalMs;

  for (let m = startBucket; m <= endBucket; m += stepMs) {
    const tradesInSlot = bucketMap.get(m);
    if (tradesInSlot && tradesInSlot.length > 0) {
      const open = tradesInSlot[0].price;
      const close = tradesInSlot[tradesInSlot.length - 1].price;
      let high = tradesInSlot[0].price;
      let low = tradesInSlot[0].price;
      let volume = 0;
      for (const t of tradesInSlot) {
        if (t.price > high) high = t.price;
        if (t.price < low) low = t.price;
        volume += t.qty;
      }
      prevClose = close;
      candles.push({
        timestamp: m,
        open,
        high,
        low,
        close,
        volume: Number(volume.toFixed(6)),
      });
    } else {
      // Periode tanpa trade: candle datar (volume 0)
      candles.push({
        timestamp: m,
        open: prevClose,
        high: prevClose,
        low: prevClose,
        close: prevClose,
        volume: 0,
      });
    }
  }

  return { candles, startTime, endTime };
}

// Live: trade baru dari WebSocket memperbarui atau membuat candle untuk timeframe aktif
export function updateCandlesWithLiveTrade(
  candles: KuruKLineBar[],
  trade: KuruTradeItem,
  timeframe: ChartTimeframe = '1m',
  allTrades?: KuruTradeItem[]
): { updatedCandles: KuruKLineBar[]; latestCandle: KuruKLineBar } {
  const intervalMs = getTimeframeIntervalMs(timeframe, allTrades);
  const bucket = Math.floor(trade.time / intervalMs) * intervalMs;
  const list = [...candles];

  if (list.length === 0) {
    const first: KuruKLineBar = {
      timestamp: bucket,
      open: trade.price,
      high: trade.price,
      low: trade.price,
      close: trade.price,
      volume: trade.qty,
    };
    list.push(first);
    return { updatedCandles: list, latestCandle: first };
  }

  const lastIndex = list.length - 1;
  const last = { ...list[lastIndex] };

  if (bucket === last.timestamp) {
    last.close = trade.price;
    if (trade.price > last.high) last.high = trade.price;
    if (trade.price < last.low) last.low = trade.price;
    last.volume = Number((last.volume + trade.qty).toFixed(6));
    list[lastIndex] = last;
    return { updatedCandles: list, latestCandle: last };
  } else if (bucket > last.timestamp) {
    let currentM = last.timestamp + intervalMs;
    const maxGaps = 100;
    let gapCount = 0;
    while (currentM < bucket && gapCount < maxGaps) {
      list.push({
        timestamp: currentM,
        open: last.close,
        high: last.close,
        low: last.close,
        close: last.close,
        volume: 0,
      });
      currentM += intervalMs;
      gapCount++;
    }

    const next: KuruKLineBar = {
      timestamp: bucket,
      open: trade.price,
      high: trade.price,
      low: trade.price,
      close: trade.price,
      volume: trade.qty,
    };
    list.push(next);
    return { updatedCandles: list, latestCandle: next };
  }

  return { updatedCandles: list, latestCandle: last };
}

export async function fetchInitialTradesDirect(): Promise<KuruTradeItem[]> {
  let data: unknown = null;
  try {
    const res = await fetch(KURU_REST_URL);
    if (res.ok) data = await res.json();
  } catch {
    // fallback to proxy
  }
  if (!data) {
    try {
      const res = await fetch(KURU_PROXY_URL);
      if (res.ok) data = await res.json();
    } catch {
      // ignore
    }
  }
  if (Array.isArray(data)) {
    if (!firstRawTradeObj && data.length > 0) {
      firstRawTradeObj = data[0] as Record<string, unknown>;
    }
    return data.map((item: Record<string, unknown>) => normalizeKuruTrade(item));
  }
  return [];
}

export type WsStatus = 'connecting' | 'connected' | 'offline';

type TradeListener = (trade: KuruTradeItem) => void;
type TradesListListener = (trades: KuruTradeItem[]) => void;
type StatusListener = (status: WsStatus) => void;
type ErrorListener = (hasError: boolean) => void;

// Singleton Connection Manager agar koneksi WebSocket wss://exchange.kuru.io/ws dibagi bersama
class KuruConnectionManager {
  private static instance: KuruConnectionManager | null = null;
  private ws: WebSocket | null = null;
  private status: WsStatus = 'offline';
  private tradeListeners = new Set<TradeListener>();
  private tradesListListeners = new Set<TradesListListener>();
  private statusListeners = new Set<StatusListener>();
  private errorListeners = new Set<ErrorListener>();
  private reconnectTimer: number | null = null;
  private trades: KuruTradeItem[] = [];
  private rawMessageCount = 0;
  private hasInitializedRest = false;

  public static getInstance(): KuruConnectionManager {
    if (!KuruConnectionManager.instance) {
      KuruConnectionManager.instance = new KuruConnectionManager();
    }
    return KuruConnectionManager.instance;
  }

  constructor() {
    this.init();
  }

  private async init() {
    if (this.hasInitializedRest) return;
    this.hasInitializedRest = true;
    this.notifyStatus('connecting');
    await this.fetchInitialTrades();
    this.connectWs();
  }

  public getStatus(): WsStatus {
    return this.status;
  }

  public getTrades(): KuruTradeItem[] {
    return [...this.trades];
  }

  public subscribeTrade(listener: TradeListener): () => void {
    this.tradeListeners.add(listener);
    return () => this.tradeListeners.delete(listener);
  }

  public subscribeTradesList(listener: TradesListListener): () => void {
    this.tradesListListeners.add(listener);
    if (this.trades.length > 0) {
      listener([...this.trades]);
    }
    return () => this.tradesListListeners.delete(listener);
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  public subscribeError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  private notifyStatus(status: WsStatus) {
    this.status = status;
    this.statusListeners.forEach((fn) => fn(status));
  }

  private notifyError(hasError: boolean) {
    this.errorListeners.forEach((fn) => fn(hasError));
  }

  private async fetchInitialTrades() {
    try {
      const items = await fetchInitialTradesDirect();
      if (items.length > 0) {
        for (let i = 0; i < Math.min(3, items.length); i++) {
          if (this.rawMessageCount < 3) {
            console.log(`[Kuru Raw Message ${this.rawMessageCount + 1} (REST)]:`, items[i]);
            this.rawMessageCount++;
          }
        }

        this.trades = items.slice(0, 100);
        this.tradesListListeners.forEach((fn) => fn([...this.trades]));
        this.notifyError(false);
      }
    } catch (err) {
      console.error('[KuruApi] REST trades error:', err);
      if (this.trades.length === 0) {
        this.notifyError(true);
      }
    }
  }

  private connectWs() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(KURU_WS_URL);

      this.ws.onopen = () => {
        this.notifyStatus('connected');
        this.notifyError(false);

        const subMsg = JSON.stringify({
          method: 'SUBSCRIBE',
          params: ['mon_usdc@trade'],
          id: 1,
        });
        this.ws?.send(subMsg);
      };

      this.ws.onmessage = async (event) => {
        try {
          let rawText = '';
          if (typeof event.data === 'string') {
            rawText = event.data;
          } else if (event.data instanceof Blob) {
            rawText = await event.data.text();
          } else if (event.data instanceof ArrayBuffer) {
            rawText = new TextDecoder().decode(event.data);
          } else {
            rawText = String(event.data);
          }

          if (!rawText) return;

          if (this.rawMessageCount < 3) {
            console.log(`[Kuru Raw Message ${this.rawMessageCount + 1} (WS)]:`, rawText);
            this.rawMessageCount++;
          }

          const parsed = JSON.parse(rawText);

          if (parsed && (parsed.e === 'trade' || parsed.p !== undefined || parsed.price !== undefined)) {
            if (!firstRawTradeObj) {
              firstRawTradeObj = parsed;
            }

            const newTrade = normalizeKuruTrade(parsed);

            this.trades = [newTrade, ...this.trades].slice(0, 100);
            this.tradesListListeners.forEach((fn) => fn([...this.trades]));
            this.tradeListeners.forEach((fn) => fn(newTrade));
            this.notifyError(false);
          }
        } catch (err) {
          console.error('[KuruApi] WS message parse error:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[KuruApi] WebSocket error:', err);
        this.notifyStatus('offline');
        if (this.trades.length === 0) {
          this.notifyError(true);
        }
      };

      this.ws.onclose = () => {
        this.notifyStatus('offline');
        this.scheduleReconnect();
      };
    } catch (err) {
      console.error('[KuruApi] WebSocket connection failed:', err);
      this.notifyStatus('offline');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connectWs();
    }, 3000);
  }
}

// Fungsi helper publik untuk langganan event live Kuru
export function subscribeKuruLiveTrade(listener: TradeListener): () => void {
  return KuruConnectionManager.getInstance().subscribeTrade(listener);
}

export function subscribeKuruStatus(listener: StatusListener): () => void {
  return KuruConnectionManager.getInstance().subscribeStatus(listener);
}

export function getKuruWsStatus(): WsStatus {
  return KuruConnectionManager.getInstance().getStatus();
}

// Kompatibilitas kelas KuruTradeFeed untuk PositionsPanel
export class KuruTradeFeed {
  private unsubTrades: (() => void) | null = null;
  private unsubStatus: (() => void) | null = null;
  private unsubError: (() => void) | null = null;

  constructor(
    onTrades: (trades: KuruTradeItem[]) => void,
    onStatus: (status: WsStatus) => void,
    onError: (hasError: boolean) => void
  ) {
    const mgr = KuruConnectionManager.getInstance();
    this.unsubTrades = mgr.subscribeTradesList(onTrades);
    this.unsubStatus = mgr.subscribeStatus(onStatus);
    this.unsubError = mgr.subscribeError(onError);
  }

  public destroy() {
    this.unsubTrades?.();
    this.unsubStatus?.();
    this.unsubError?.();
  }
}
