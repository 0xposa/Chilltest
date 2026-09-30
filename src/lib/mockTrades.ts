// MOCK DATA - replace with live Kuru trades

export interface MockTrade {
  id: string;
  time: string;
  type: 'Buy' | 'Sell';
  price: number;
  amountMon: number;
  totalUsdc: number;
  trader: string;
}

export const mockTrades: MockTrade[] = [
  { id: 'tx-1', time: '12:08:45', type: 'Buy', price: 0.03428, amountMon: 14500, totalUsdc: 497.06, trader: '0x7a3f...91bc' },
  { id: 'tx-2', time: '12:08:12', type: 'Buy', price: 0.03425, amountMon: 32000, totalUsdc: 1096.00, trader: '0x1c88...4e21' },
  { id: 'tx-3', time: '12:07:50', type: 'Sell', price: 0.03421, amountMon: 8400, totalUsdc: 287.36, trader: '0x9d41...b729' },
  { id: 'tx-4', time: '12:07:15', type: 'Buy', price: 0.03424, amountMon: 25000, totalUsdc: 856.00, trader: '0x3fe2...a890' },
  { id: 'tx-5', time: '12:06:58', type: 'Sell', price: 0.03419, amountMon: 19500, totalUsdc: 666.71, trader: '0xb560...13f4' },
  { id: 'tx-6', time: '12:06:22', type: 'Buy', price: 0.03422, amountMon: 5000, totalUsdc: 171.10, trader: '0x442c...e01d' },
  { id: 'tx-7', time: '12:05:49', type: 'Sell', price: 0.03418, amountMon: 45000, totalUsdc: 1538.10, trader: '0x889a...cf45' },
  { id: 'tx-8', time: '12:05:10', type: 'Buy', price: 0.03426, amountMon: 11200, totalUsdc: 383.71, trader: '0x22db...60e3' },
  { id: 'tx-9', time: '12:04:41', type: 'Buy', price: 0.03423, amountMon: 6800, totalUsdc: 232.76, trader: '0x55aa...3341' },
  { id: 'tx-10', time: '12:04:05', type: 'Sell', price: 0.03417, amountMon: 15000, totalUsdc: 512.55, trader: '0xef12...9902' },
  { id: 'tx-11', time: '12:03:32', type: 'Buy', price: 0.03420, amountMon: 28500, totalUsdc: 974.70, trader: '0x6b77...ac88' },
  { id: 'tx-12', time: '12:02:59', type: 'Buy', price: 0.03422, amountMon: 9000, totalUsdc: 307.98, trader: '0x0d3e...771a' },
  { id: 'tx-13', time: '12:02:18', type: 'Sell', price: 0.03416, amountMon: 35000, totalUsdc: 1195.60, trader: '0x991f...218b' },
  { id: 'tx-14', time: '12:01:44', type: 'Buy', price: 0.03425, amountMon: 18000, totalUsdc: 616.50, trader: '0x32cc...44dd' },
  { id: 'tx-15', time: '12:01:12', type: 'Sell', price: 0.03419, amountMon: 7200, totalUsdc: 246.17, trader: '0x14fe...550a' },
  { id: 'tx-16', time: '12:00:39', type: 'Buy', price: 0.03427, amountMon: 42000, totalUsdc: 1439.34, trader: '0x77ee...bb93' },
  { id: 'tx-17', time: '12:00:01', type: 'Sell', price: 0.03418, amountMon: 13000, totalUsdc: 444.34, trader: '0xaa40...19e7' },
  { id: 'tx-18', time: '11:59:22', type: 'Buy', price: 0.03421, amountMon: 21500, totalUsdc: 735.52, trader: '0x5c89...fd03' },
  { id: 'tx-19', time: '11:58:47', type: 'Buy', price: 0.03424, amountMon: 16000, totalUsdc: 547.84, trader: '0x8821...6a91' },
  { id: 'tx-20', time: '11:58:10', type: 'Sell', price: 0.03415, amountMon: 27000, totalUsdc: 922.05, trader: '0x301b...c542' },
];
