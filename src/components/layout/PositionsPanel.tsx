import { useState, useEffect } from 'react';
import { Globe, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import {
  KuruTradeFeed,
  getFirstRawTrade,
  type KuruTradeItem,
  type WsStatus,
} from '../../lib/kuruApi.ts';

interface PositionsPanelProps {
  className?: string;
}

type TabKey = 'Transactions' | 'Holders' | 'Bubble Map' | 'About';

// MOCK DATA - replace with live data
const ABOUT_DESCRIPTION =
  'MON is the native token of the Monad network, used to pay gas fees.';

interface HoldersData {
  numHolders: string;
  top10Holding: string;
}

const MOCK_HOLDERS_DATA: HoldersData = {
  numHolders: '142,850',
  top10Holding: '28.4%',
};

type TimeframeKey = '5M' | '1H' | '1D';

interface TransactionMetrics {
  buys: number;
  sells: number;
  buysDisplay: string;
  sellsDisplay: string;
  buyVol: number;
  sellVol: number;
  buyVolDisplay: string;
  sellVolDisplay: string;
  buyers: number;
  sellers: number;
  buyersDisplay: string;
  sellersDisplay: string;
}

const MOCK_TRANSACTIONS_DATA: Record<TimeframeKey, TransactionMetrics> = {
  '5M': {
    buys: 142,
    sells: 98,
    buysDisplay: '142',
    sellsDisplay: '98',
    buyVol: 48200,
    sellVol: 31500,
    buyVolDisplay: '$48.2K',
    sellVolDisplay: '$31.5K',
    buyers: 86,
    sellers: 64,
    buyersDisplay: '86',
    sellersDisplay: '64',
  },
  '1H': {
    buys: 1840,
    sells: 1420,
    buysDisplay: '1,840',
    sellsDisplay: '1,420',
    buyVol: 624000,
    sellVol: 480000,
    buyVolDisplay: '$624K',
    sellVolDisplay: '$480K',
    buyers: 940,
    sellers: 760,
    buyersDisplay: '940',
    sellersDisplay: '760',
  },
  '1D': {
    buys: 34200,
    sells: 28900,
    buysDisplay: '34.2K',
    sellsDisplay: '28.9K',
    buyVol: 14800000,
    sellVol: 11200000,
    buyVolDisplay: '$14.8M',
    sellVolDisplay: '$11.2M',
    buyers: 12400,
    sellers: 9800,
    buyersDisplay: '12.4K',
    sellersDisplay: '9.8K',
  },
};

interface StatItem {
  label: string;
  value: string;
}

const MOCK_STATS_DATA: StatItem[] = [
  { label: 'Market cap', value: '$3.42B' },
  { label: '24h volume', value: '$26.0M' },
  { label: 'Liquidity', value: '$84.5M' },
  { label: 'Supply', value: '100B MON' },
  { label: 'Blockchain', value: 'Monad' },
  { label: 'Contract address', value: 'Native token' },
];

export default function PositionsPanel({ className = '' }: PositionsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('Transactions');
  const [txTimeframe, setTxTimeframe] = useState<TimeframeKey>('5M');

  // State untuk Live Trades Kuru API (MON_USDC)
  const [trades, setTrades] = useState<KuruTradeItem[]>([]);
  const [wsStatus, setWsStatus] = useState<WsStatus>('offline');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Inisialisasi Kuru REST + WebSocket Trade Feed
    const feed = new KuruTradeFeed(
      (updatedTrades) => {
        setTrades(updatedTrades);
      },
      (status) => {
        setWsStatus(status);
      },
      (errorState) => {
        setHasError(errorState);
      }
    );

    return () => {
      feed.destroy();
    };
  }, []);

  // Periksa apakah ada kolom Trader pada respons data
  const hasTraderColumn = trades.some((t) => !!t.trader);

  const getTxHash = (trade: Record<string, unknown>): string | null => {
    const possible = [
      trade.txHash,
      trade.transactionHash,
      trade.tx,
      trade.hash,
      trade.tx_hash,
    ];
    for (const val of possible) {
      if (typeof val === 'string' && val.trim().length > 0) {
        return val.trim();
      }
    }
    return null;
  };

  const formatTxHash = (hash: string): string => {
    if (hash.length <= 12) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const currentTx = MOCK_TRANSACTIONS_DATA[txTimeframe];
  const buysTotal = currentTx.buys + currentTx.sells;
  const buyPct = buysTotal > 0 ? (currentTx.buys / buysTotal) * 100 : 50;
  const sellPct = 100 - buyPct;

  const volTotal = currentTx.buyVol + currentTx.sellVol;
  const buyVolPct = volTotal > 0 ? (currentTx.buyVol / volTotal) * 100 : 50;
  const sellVolPct = 100 - buyVolPct;

  const buyersTotal = currentTx.buyers + currentTx.sellers;
  const buyersPct = buyersTotal > 0 ? (currentTx.buyers / buyersTotal) * 100 : 50;
  const sellersPct = 100 - buyersPct;

  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden rounded-[8px] border border-[#23232f] bg-[#0f0f16] ${className}`}
    >
      {/* Tab bar di bagian atas panel */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[#23232f] px-3">
        <div className="flex h-full items-center gap-6">
          {(['Transactions', 'Holders', 'Bubble Map', 'About'] as const).map(
            (tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`relative flex h-full items-center text-xs font-medium cursor-pointer transition-colors ${
                    isActive ? 'text-white' : 'text-[#8b8b9a] hover:text-zinc-300'
                  }`}
                >
                  {tab}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#22d3ee]" />
                  )}
                </button>
              );
            }
          )}
        </div>

        {/* Label di kanan atas panel: titik hijau + "Live" hanya saat WebSocket tersambung; selain itu titik abu-abu + "Offline" */}
        {activeTab === 'Transactions' && (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {wsStatus === 'connected' ? (
              <div className="flex items-center gap-1.5 text-[#22c55e]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
                </span>
                <span>Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-zinc-500">
                <span className="inline-flex rounded-full h-2 w-2 bg-zinc-500" />
                <span>Offline</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Konten Tab */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'Transactions' ? (
          <div className="flex h-full w-full flex-col overflow-hidden">
            <div className="flex-1 min-h-0 w-full overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead className="sticky top-0 z-10 bg-[#0f0f16] shadow-[0_1px_0_0_#23232f]">
                  <tr className="text-[#8b8b9a]">
                    <th className="py-2 px-3 text-left font-medium">Time</th>
                    <th className="py-2 px-3 text-left font-medium">Type</th>
                    <th className="py-2 px-3 text-right font-medium">Price (USDC)</th>
                    <th className="py-2 px-3 text-right font-medium">Amount (MON)</th>
                    <th className="py-2 px-3 text-right font-medium">Total (USDC)</th>
                    {hasTraderColumn && (
                      <th className="py-2 px-3 text-right font-medium">Trader</th>
                    )}
                    <th className="py-2 px-3 text-right font-medium">Tx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#23232f]/40 font-mono">
                  {hasError && trades.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6 + (hasTraderColumn ? 1 : 0)}
                        className="py-8 text-center text-zinc-500 font-sans text-xs"
                      >
                        Failed to load live trades
                      </td>
                    </tr>
                  ) : trades.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6 + (hasTraderColumn ? 1 : 0)}
                        className="py-8 text-center text-zinc-500 font-sans text-xs"
                      >
                        Connecting to Kuru live feed...
                      </td>
                    </tr>
                  ) : (
                    trades.map((trade, idx) => {
                      const isBuy = trade.type === 'Buy';
                      const txHash = getTxHash(
                        trade as unknown as Record<string, unknown>
                      );
                      return (
                        <tr
                          key={trade.rowKey || `${trade.id}-${trade.time}-${idx}`}
                          className="hover:bg-[#161622]/60 transition-colors"
                        >
                          <td className="py-1.5 px-3 text-left text-zinc-400">
                            {trade.timeFormatted}
                          </td>
                          <td className="py-1.5 px-3 text-left">
                            <span
                              className={`inline-flex items-center gap-0.5 font-medium ${
                                isBuy ? 'text-[#22c55e]' : 'text-[#ef4444]'
                              }`}
                            >
                              {isBuy ? (
                                <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3 stroke-[2.5]" />
                              )}
                              {trade.type}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-right text-zinc-200">
                            {trade.price.toFixed(5)}
                          </td>
                          <td className="py-1.5 px-3 text-right text-zinc-200">
                            {trade.qty.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            })}
                          </td>
                          <td className="py-1.5 px-3 text-right text-zinc-200">
                            ${trade.total.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            })}
                          </td>
                          {hasTraderColumn && (
                            <td className="py-1.5 px-3 text-right text-zinc-400">
                              {trade.trader}
                            </td>
                          )}
                          <td className="py-1.5 px-3 text-right font-mono">
                            {txHash ? (
                              <a
                                href={`https://monadvision.com/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-zinc-400 hover:text-[#22d3ee] transition-colors"
                                title={txHash}
                              >
                                <span>{formatTxHash(txHash)}</span>
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            ) : (
                              <span className="text-zinc-600">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Diagnosa sementara: nama field dan isi JSON (maks 200 karakter) dari trade MENTAH pertama */}
            {(() => {
              const rawTrade =
                getFirstRawTrade() ||
                (trades[0]?._raw as Record<string, unknown> | undefined) ||
                (trades[0] as unknown as Record<string, unknown> | undefined);
              const rawFields = rawTrade ? Object.keys(rawTrade).join(', ') : 'none';
              const rawJson = rawTrade ? JSON.stringify(rawTrade).slice(0, 200) : 'none';
              return (
                <div className="shrink-0 px-3 py-1.5 text-[10px] text-zinc-500 font-mono border-t border-[#23232f]/60 bg-[#0f0f16] truncate select-all">
                  Fields: {rawFields} | JSON: {rawJson}
                </div>
              );
            })()}
          </div>
        ) : activeTab === 'About' ? (
          <div className="h-full w-full overflow-auto p-4">
            <div className="mx-auto w-full max-w-[640px] flex flex-col gap-6 pb-2">
              {/* 1. Description */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-[16px] font-bold text-white">
                    Description
                  </h3>
                  <a
                    href="https://x.com/search?q=MON"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-[#22d3ee] hover:underline"
                  >
                    Search on X
                  </a>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-[#8b8b9a]">
                  {ABOUT_DESCRIPTION}
                </p>
              </div>

              {/* 2. Dua tombol berdampingan sama lebar */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://monad.xyz"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#12121a] border border-[#23232f] text-xs font-medium text-white hover:bg-[#1a1a26] transition-colors"
                >
                  <Globe className="h-4 w-4 text-[#8b8b9a]" />
                  <span>Website</span>
                </a>
                <a
                  href="https://x.com/monad"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#12121a] border border-[#23232f] text-xs font-medium text-white hover:bg-[#1a1a26] transition-colors"
                >
                  <svg
                    className="h-3.5 w-3.5 fill-current text-white"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>X</span>
                </a>
              </div>

              {/* 3. Transactions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-white">
                    Transactions
                  </h3>
                  <div className="flex items-center gap-1 rounded-[6px] bg-[#12121a] p-0.5 border border-[#23232f]">
                    {(['5M', '1H', '1D'] as const).map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => setTxTimeframe(tf)}
                        className={`px-2 py-0.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                          txTimeframe === tf
                            ? 'bg-[#23232f] text-white'
                            : 'text-[#8b8b9a] hover:text-zinc-200'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Baris 1: buys / sells */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-[#22c55e]">
                        {currentTx.buysDisplay} Buys
                      </span>
                      <span className="text-[#ef4444]">
                        {currentTx.sellsDisplay} Sells
                      </span>
                    </div>
                    <div className="flex h-1 w-full gap-1 items-center">
                      <div
                        style={{ width: `${buyPct}%` }}
                        className="h-[4px] rounded-full bg-[#22c55e] transition-all duration-300"
                      />
                      <div
                        style={{ width: `${sellPct}%` }}
                        className="h-[4px] rounded-full bg-[#ef4444] transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Baris 2: vol. */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-[#22c55e]">
                        {currentTx.buyVolDisplay}
                      </span>
                      <span className="text-[11px] text-[#8b8b9a] font-sans">
                        Vol.
                      </span>
                      <span className="text-[#ef4444]">
                        {currentTx.sellVolDisplay}
                      </span>
                    </div>
                    <div className="flex h-1 w-full gap-1 items-center">
                      <div
                        style={{ width: `${buyVolPct}%` }}
                        className="h-[4px] rounded-full bg-[#22c55e] transition-all duration-300"
                      />
                      <div
                        style={{ width: `${sellVolPct}%` }}
                        className="h-[4px] rounded-full bg-[#ef4444] transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Baris 3: buyers / sellers */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-[#22c55e]">
                        {currentTx.buyersDisplay} Buyers
                      </span>
                      <span className="text-[#ef4444]">
                        {currentTx.sellersDisplay} Sellers
                      </span>
                    </div>
                    <div className="flex h-1 w-full gap-1 items-center">
                      <div
                        style={{ width: `${buyersPct}%` }}
                        className="h-[4px] rounded-full bg-[#22c55e] transition-all duration-300"
                      />
                      <div
                        style={{ width: `${sellersPct}%` }}
                        className="h-[4px] rounded-full bg-[#ef4444] transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Holders dengan garis titik-titik */}
              <div>
                <h3 className="text-[16px] font-bold text-white mb-3">
                  Holders
                </h3>
                <div className="space-y-3 text-[13px]">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[#8b8b9a] shrink-0">
                      Number of holders
                    </span>
                    <span className="mx-2 flex-1 border-b border-dotted border-[#2a2a36] self-center" />
                    <span className="font-mono text-white text-right shrink-0">
                      {MOCK_HOLDERS_DATA.numHolders}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[#8b8b9a] shrink-0">
                      Top 10 Holding
                    </span>
                    <span className="mx-2 flex-1 border-b border-dotted border-[#2a2a36] self-center" />
                    <span className="font-mono text-white text-right shrink-0">
                      {MOCK_HOLDERS_DATA.top10Holding}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Stats dengan garis titik-titik */}
              <div>
                <h3 className="text-[16px] font-bold text-white mb-3">
                  Stats
                </h3>
                <div className="space-y-3">
                  {MOCK_STATS_DATA.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-baseline justify-between text-[13px]"
                    >
                      <span className="text-[#8b8b9a] shrink-0">
                        {item.label}
                      </span>
                      <span className="mx-2 flex-1 border-b border-dotted border-[#2a2a36] self-center" />
                      <span className="font-mono text-white text-right shrink-0">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Area kosong untuk tab Holders dan Bubble Map tanpa teks */
          <div className="h-full w-full" />
        )}
      </div>
    </div>
  );
}
