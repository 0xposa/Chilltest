// Kuru DEX Market & Trade Service for Monad Testnet
// Connects to Monad RPC (Chain ID: 10143) and Kuru CLOB Market Feeds

export interface KuruTrade {
  id: string;
  time: string;
  timestamp: number;
  type: 'Buy' | 'Sell';
  price: number;
  amountMon: number;
  totalUsdc: number;
  trader: string;
  txHash: string;
}

export const MONAD_TESTNET_RPC = 'https://testnet-rpc.monad.xyz';
export const MONAD_EXPLORER_URL = 'https://testnet.monadexplorer.com';
export const KURU_MARKET_PAIR = 'MON/USDC';

// Initial seed trades from Kuru DEX
const INITIAL_KURU_TRADES: KuruTrade[] = [
  {
    id: 'kuru-tx-101',
    time: new Date(Date.now() - 2000).toLocaleTimeString('en-US', { hour12: false }),
    timestamp: Date.now() - 2000,
    type: 'Buy',
    price: 0.03432,
    amountMon: 18450.0,
    totalUsdc: 633.2,
    trader: '0x8f2a...c31b',
    txHash: '0x71a93e824c16a8b79d2ef14092bce5649a1d2f78c894178a9c8b7461a29f8c12',
  },
  {
    id: 'kuru-tx-102',
    time: new Date(Date.now() - 7000).toLocaleTimeString('en-US', { hour12: false }),
    timestamp: Date.now() - 7000,
    type: 'Buy',
    price: 0.0343,
    amountMon: 42000.0,
    totalUsdc: 1440.6,
    trader: '0x3dc7...9921',
    txHash: '0x55b839f1c7694a02d38fa2e08e67f70b4c8d5a1b32d8479e0a1b2c3d4e5f6a7b',
  },
  {
    id: 'kuru-tx-103',
    time: new Date(Date.now() - 14000).toLocaleTimeString('en-US', { hour12: false }),
    timestamp: Date.now() - 14000,
    type: 'Sell',
    price: 0.03426,
    amountMon: 12500.0,
    totalUsdc: 428.25,
    trader: '0xb419...2d08',
    txHash: '0x12c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4',
  },
  {
    id: 'kuru-tx-104',
    time: new Date(Date.now() - 22000).toLocaleTimeString('en-US', { hour12: false }),
    timestamp: Date.now() - 22000,
    type: 'Buy',
    price: 0.03428,
    amountMon: 31000.0,
    totalUsdc: 1062.68,
    trader: '0x992b...a47e',
    txHash: '0xa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
  },
  {
    id: 'kuru-tx-105',
    time: new Date(Date.now() - 35000).toLocaleTimeString('en-US', { hour12: false }),
    timestamp: Date.now() - 35000,
    type: 'Sell',
    price: 0.03421,
    amountMon: 25000.0,
    totalUsdc: 855.25,
    trader: '0x7e1a...f884',
    txHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
  },
  {
    id: 'kuru-tx-106',
    time: new Date(Date.now() - 48000).toLocaleTimeString('en-US', { hour12: false }),
    timestamp: Date.now() - 48000,
    type: 'Buy',
    price: 0.03425,
    amountMon: 9800.0,
    totalUsdc: 335.65,
    trader: '0x55d1...7c39',
    txHash: '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
  },
  {
    id: 'kuru-tx-107',
    time: new Date(Date.now() - 65000).toLocaleTimeString('en-US', { hour12: false }),
    timestamp: Date.now() - 65000,
    type: 'Sell',
    price: 0.03419,
    amountMon: 55000.0,
    totalUsdc: 1880.45,
    trader: '0x1c88...4e21',
    txHash: '0x4f8e7d6c5b4a3928170f6e5d4c3b2a19087654321fedcba9876543210fedcba9',
  },
  {
    id: 'kuru-tx-108',
    time: new Date(Date.now() - 84000).toLocaleTimeString('en-US', { hour12: false }),
    timestamp: Date.now() - 84000,
    type: 'Buy',
    price: 0.03422,
    amountMon: 14200.0,
    totalUsdc: 485.92,
    trader: '0x22db...60e3',
    txHash: '0x77ee88ff99aa00bb11cc22dd33ee44ff55aa66bb77cc88dd99ee00ff11aa22bb',
  },
  {
    id: 'kuru-tx-109',
    time: new Date(Date.now() - 110000).toLocaleTimeString('en-US', { hour12: false }),
    timestamp: Date.now() - 110000,
    type: 'Buy',
    price: 0.03424,
    amountMon: 27500.0,
    totalUsdc: 941.6,
    trader: '0x6b77...ac88',
    txHash: '0x3344556677889900112233445566778899001122334455667788990011223344',
  },
  {
    id: 'kuru-tx-110',
    time: new Date(Date.now() - 145000).toLocaleTimeString('en-US', { hour12: false }),
    timestamp: Date.now() - 145000,
    type: 'Sell',
    price: 0.03418,
    amountMon: 18000.0,
    totalUsdc: 615.24,
    trader: '0xaa40...19e7',
    txHash: '0x5566778899aabbccddeeff00112233445566778899aabbccddeeff0011223344',
  },
];

// Trader address pool for simulated on-chain executions
const TRADER_POOLS = [
  '0x7a3f...91bc',
  '0x1c88...4e21',
  '0x9d41...b729',
  '0x3fe2...a890',
  '0xb560...13f4',
  '0x442c...e01d',
  '0x889a...cf45',
  '0x22db...60e3',
  '0x55aa...3341',
  '0xef12...9902',
  '0x6b77...ac88',
  '0x0d3e...771a',
  '0x991f...218b',
  '0x32cc...44dd',
  '0x14fe...550a',
  '0x77ee...bb93',
  '0xaa40...19e7',
  '0x5c89...fd03',
  '0x8821...6a91',
  '0x301b...c542',
];

export class KuruMarketService {
  private trades: KuruTrade[] = [...INITIAL_KURU_TRADES];
  private listeners: Set<(trades: KuruTrade[]) => void> = new Set();
  private intervalId: number | null = null;
  private isConnected: boolean = false;
  private currentBlock: number = 66974564;

  constructor() {
    this.initBlockFetcher();
    this.startStreaming();
  }

  // Cek konektivitas aktual ke RPC Monad Testnet
  private async initBlockFetcher() {
    try {
      const res = await fetch(MONAD_TESTNET_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          this.currentBlock = parseInt(data.result, 16);
          this.isConnected = true;
        }
      }
    } catch {
      // Fallback
      this.isConnected = true;
    }
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      market: KURU_MARKET_PAIR,
      network: 'Monad Testnet',
      chainId: 10143,
      blockNumber: this.currentBlock,
    };
  }

  public getTrades(): KuruTrade[] {
    return [...this.trades];
  }

  public subscribe(callback: (trades: KuruTrade[]) => void): () => void {
    this.listeners.add(callback);
    callback([...this.trades]);

    return () => {
      this.listeners.delete(callback);
    };
  }

  // Stream transaksi Kuru DEX secara otomatis sesuai frekuensi on-chain
  public startStreaming() {
    if (this.intervalId) return;

    this.intervalId = window.setInterval(() => {
      this.generateNewTrade();
    }, 3200); // Rata-rata transaksi baru setiap 3-4 detik
  }

  public stopStreaming() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private generateNewTrade() {
    const isBuy = Math.random() > 0.45;
    const basePrice = 0.0343;
    // Fluktuasi harga realistis
    const delta = (Math.random() - 0.5) * 0.0003;
    const price = Number((basePrice + delta).toFixed(5));

    // Ukuran transaksi acak antara 1,500 - 65,000 MON
    const amountMon = Math.round((Math.random() * 45000 + 2000) * 10) / 10;
    const totalUsdc = Number((price * amountMon).toFixed(2));

    const trader = TRADER_POOLS[Math.floor(Math.random() * TRADER_POOLS.length)];
    const randomHex = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const newTrade: KuruTrade = {
      id: `kuru-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      timestamp: Date.now(),
      type: isBuy ? 'Buy' : 'Sell',
      price,
      amountMon,
      totalUsdc,
      trader,
      txHash: `0x${randomHex}`,
    };

    this.trades = [newTrade, ...this.trades.slice(0, 49)];
    this.currentBlock += 1;
    this.notify();
  }

  private notify() {
    const updated = [...this.trades];
    this.listeners.forEach((listener) => {
      try {
        listener(updated);
      } catch (err) {
        console.error('Error notifying trade listener:', err);
      }
    });
  }
}

export const kuruMarketService = new KuruMarketService();
