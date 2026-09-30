// MOCK DATA - replace with live Kuru data

export interface MarketData {
  pair: string;
  lastPrice: string;
  change24h: number;
  high24h: string;
  low24h: string;
  volume24h: string;
}

export const MARKETS_DATA: Record<string, MarketData> = {
  'MON/USDC': {
    pair: 'MON/USDC',
    lastPrice: '0.0342',
    change24h: 4.82,
    high24h: '0.0351',
    low24h: '0.0318',
    volume24h: '1.2M',
  },
  'ETH/USDC': {
    pair: 'ETH/USDC',
    lastPrice: '3120.50',
    change24h: -1.15,
    high24h: '3188.00',
    low24h: '3095.20',
    volume24h: '8.4M',
  },
  'BTC/USDC': {
    pair: 'BTC/USDC',
    lastPrice: '64210.00',
    change24h: 0.63,
    high24h: '64890.00',
    low24h: '63120.00',
    volume24h: '21.7M',
  },
};

export const MARKET_PAIRS = ['MON/USDC', 'ETH/USDC', 'BTC/USDC'] as const;
export type MarketPair = (typeof MARKET_PAIRS)[number];
