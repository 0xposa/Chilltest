// Kuru API Client for MON_USDC Trades (REST + WebSocket)
// Follows Binance-style trade formats

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
}

export const KURU_REST_URL = 'https://exchange.kuru.io/api/v3/trades?symbol=MON_USDC&limit=50';
export const KURU_PROXY_URL = '/api/v3/trades?symbol=MON_USDC&limit=50';
export const KURU_WS_URL = 'wss://exchange.kuru.io/ws';

// Parser helper untuk harga Kuru (mengonversi format wei 1e18 jika diperlukan)
export function parseKuruPrice(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return 0;
  // Jika dalam wei (misal 29117000000000000 -> 0.029117)
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
  const id = (raw.t as string | number) ?? (raw.id as string | number) ?? `trade-${Date.now()}-${Math.random()}`;
  const rawPrice = (raw.p as string | number) ?? (raw.price as string | number) ?? 0;
  const rawQty = (raw.q as string | number) ?? (raw.qty as string | number) ?? 0;
  const rawTime = (raw.T as number) ?? (raw.E as number) ?? (raw.time as number) ?? Date.now();
  
  // Format Binance: m = isBuyerMaker. Jika isBuyerMaker = true -> Sell, selain itu Buy
  const isBuyerMaker = (raw.m as boolean) ?? (raw.isBuyerMaker as boolean) ?? false;
  const type: 'Buy' | 'Sell' = isBuyerMaker ? 'Sell' : 'Buy';

  const price = parseKuruPrice(rawPrice);
  const qty = parseKuruQty(rawQty);
  const total = Number((price * qty).toFixed(6));

  // Ambil trader dan tx hanya jika tersedia di respons
  const trader = (raw.trader as string) || (raw.maker as string) || (raw.taker as string) || undefined;
  const tx = (raw.tx as string) || (raw.txHash as string) || (raw.hash as string) || undefined;

  const rowKey = `${id}-${rawTime}-${rawPrice}-${rawQty}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    id,
    rowKey,
    price,
    qty,
    total,
    time: rawTime,
    timeFormatted: formatTradeTime(rawTime),
    isBuyerMaker,
    type,
    trader,
    tx,
  };
}

export type WsStatus = 'connecting' | 'connected' | 'offline';

export class KuruTradeFeed {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private trades: KuruTradeItem[] = [];
  private onTradesUpdate: ((trades: KuruTradeItem[]) => void) | null = null;
  private onStatusChange: ((status: WsStatus) => void) | null = null;
  private onErrorChange: ((hasError: boolean) => void) | null = null;
  private rawMessageCount = 0;
  private isDestroyed = false;

  constructor(
    onTrades: (trades: KuruTradeItem[]) => void,
    onStatus: (status: WsStatus) => void,
    onError: (hasError: boolean) => void
  ) {
    this.onTradesUpdate = onTrades;
    this.onStatusChange = onStatus;
    this.onErrorChange = onError;

    this.init();
  }

  private async init() {
    this.onStatusChange?.('connecting');
    await this.fetchInitialTrades();
    if (!this.isDestroyed) {
      this.connectWs();
    }
  }

  // 1. Isi awal: GET https://exchange.kuru.io/api/v3/trades?symbol=MON_USDC&limit=50
  public async fetchInitialTrades() {
    let data: unknown = null;

    // Coba langsung ke Kuru REST URL
    try {
      const res = await fetch(KURU_REST_URL);
      if (res.ok) {
        data = await res.json();
      }
    } catch {
      // Abaikan error CORS awal, lanjutkan ke local proxy
    }

    // Jika gagal (misalnya karena pembatasan CORS di browser), gunakan proxy Vite
    if (!data) {
      try {
        const proxyRes = await fetch(KURU_PROXY_URL);
        if (proxyRes.ok) {
          data = await proxyRes.json();
        }
      } catch (err) {
        console.error('[KuruApi] REST error via proxy:', err);
      }
    }

    if (Array.isArray(data)) {
      // Cetak 3 pesan mentah pertama jika belum mencapai limit
      for (let i = 0; i < Math.min(3, data.length); i++) {
        if (this.rawMessageCount < 3) {
          console.log(`[Kuru Raw Message ${this.rawMessageCount + 1} (REST)]:`, data[i]);
          this.rawMessageCount++;
        }
      }

      const normalized = data.map((item: Record<string, unknown>) => normalizeKuruTrade(item));
      this.trades = normalized.slice(0, 100);
      this.onTradesUpdate?.([...this.trades]);
      this.onErrorChange?.(false);
    } else {
      if (this.trades.length === 0) {
        this.onErrorChange?.(true);
      }
    }
  }

  // 2. Live: WebSocket wss://exchange.kuru.io/ws
  private connectWs() {
    if (this.isDestroyed) return;

    try {
      this.ws = new WebSocket(KURU_WS_URL);

      this.ws.onopen = () => {
        if (this.isDestroyed) {
          this.ws?.close();
          return;
        }
        this.onStatusChange?.('connected');
        this.onErrorChange?.(false);

        // Kirim subscribe request
        const subMsg = JSON.stringify({
          method: 'SUBSCRIBE',
          params: ['mon_usdc@trade'],
          id: 1,
        });
        this.ws?.send(subMsg);
      };

      this.ws.onmessage = async (event) => {
        if (this.isDestroyed) return;

        try {
          // Ambil raw string baik saat event.data berupa string, Blob, maupun ArrayBuffer
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

          // Cetak 3 pesan mentah pertama ke console.log
          if (this.rawMessageCount < 3) {
            console.log(`[Kuru Raw Message ${this.rawMessageCount + 1} (WS)]:`, rawText);
            this.rawMessageCount++;
          }

          const parsed = JSON.parse(rawText);

          // Jika format data berupa trade event (e === 'trade' atau memiliki p/price)
          if (parsed && (parsed.e === 'trade' || parsed.p !== undefined || parsed.price !== undefined)) {
            const newTrade = normalizeKuruTrade(parsed);

            // Tambahkan di baris paling atas, simpan maksimal 100 baris
            this.trades = [newTrade, ...this.trades].slice(0, 100);
            this.onTradesUpdate?.([...this.trades]);
            this.onErrorChange?.(false);
          }
        } catch (err) {
          console.error('[KuruApi] WS message parse error:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[KuruApi] WebSocket error:', err);
        this.onStatusChange?.('offline');
        if (this.trades.length === 0) {
          this.onErrorChange?.(true);
        }
      };

      this.ws.onclose = () => {
        this.onStatusChange?.('offline');
        if (!this.isDestroyed) {
          // Sambung ulang otomatis kalau WebSocket putus
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.error('[KuruApi] WebSocket connection failed:', err);
      this.onStatusChange?.('offline');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isDestroyed) {
        this.connectWs();
      }
    }, 3000);
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
  }
}
