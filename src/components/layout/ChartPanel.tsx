import { useState, useEffect, useRef } from 'react';
import { init, dispose, type Chart } from 'klinecharts';
import { ChevronDown } from 'lucide-react';
import {
  fetchLongHistoricalTrades,
  buildCandlesFromTrades,
  updateCandlesWithLiveTrade,
  subscribeKuruLiveTrade,
  subscribeKuruStatus,
  getKlineChartPeriod,
  TIMEFRAMES,
  type ChartTimeframe,
  type KuruTradeItem,
  type KuruKLineBar,
  type WsStatus,
} from '../../lib/kuruApi.ts';

interface ChartPanelProps {
  className?: string;
}

interface DebugInfo {
  method: 'A' | 'B';
  pages: number;
  totalTrades: number;
  timeRange: string;
  lastError: string;
}

function formatDebugTime(ts: number | null): string {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false });
}

export default function ChartPanel({ className = '' }: ChartPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const candlesRef = useRef<KuruKLineBar[]>([]);
  const tradesHistoryRef = useRef<KuruTradeItem[]>([]);
  const wsBufferRef = useRef<KuruTradeItem[]>([]);
  const isHistoryLoadedRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [currentTimeframe, setCurrentTimeframe] = useState<ChartTimeframe>('1m');
  const currentTimeframeRef = useRef<ChartTimeframe>('1m');
  currentTimeframeRef.current = currentTimeframe;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [lastPrice, setLastPrice] = useState<number>(0);
  const [priceChangePct, setPriceChangePct] = useState<number>(0);
  const [wsStatus, setWsStatus] = useState<WsStatus>('offline');
  const [hasChartError, setHasChartError] = useState(false);

  // Status baris debug di bawah grafik:
  // "Metode: <A atau B>, halaman: <n>, trade: <n>, rentang: <awal> - <akhir>, error terakhir: <pesan atau ->"
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    method: 'A',
    pages: 0,
    totalTrades: 0,
    timeRange: '-',
    lastError: '-',
  });

  // Menutup dropdown saat klik di luar elemen
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isCancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    // Helper untuk menginisialisasi KLineChart setelah riwayat selesai dimuat
    const initChartOnce = () => {
      if (chartInstanceRef.current || !container) return;

      const chart = init(container, {
        styles: {
          grid: {
            show: true,
            horizontal: {
              show: true,
              size: 1,
              color: '#1c1c26',
              style: 'solid',
              dashedValue: [2, 2],
            },
            vertical: {
              show: true,
              size: 1,
              color: '#1c1c26',
              style: 'solid',
              dashedValue: [2, 2],
            },
          },
          candle: {
            bar: {
              upColor: '#22c55e',
              downColor: '#ef4444',
              noChangeColor: '#8b8b9a',
              upBorderColor: '#22c55e',
              downBorderColor: '#ef4444',
              noChangeBorderColor: '#8b8b9a',
              upWickColor: '#22c55e',
              downWickColor: '#ef4444',
              noChangeWickColor: '#8b8b9a',
            },
            priceMark: {
              high: { color: '#8b8b9a' },
              low: { color: '#8b8b9a' },
              last: {
                show: true,
                upColor: '#22c55e',
                downColor: '#ef4444',
                noChangeColor: '#8b8b9a',
                line: {
                  show: true,
                  style: 'dashed',
                  dashedValue: [3, 3],
                  size: 1,
                },
                text: {
                  show: true,
                  color: '#ffffff',
                  size: 11,
                  paddingLeft: 4,
                  paddingRight: 4,
                },
              },
            },
            tooltip: {
              title: {
                color: '#8b8b9a',
                size: 11,
              },
              legend: {
                color: '#8b8b9a',
                size: 11,
              },
            },
          },
          indicator: {
            ohlc: {
              upColor: '#22c55e',
              downColor: '#ef4444',
              noChangeColor: '#8b8b9a',
            },
            tooltip: {
              title: {
                color: '#8b8b9a',
                size: 11,
              },
              legend: {
                color: '#8b8b9a',
                size: 11,
              },
            },
          },
          xAxis: {
            axisLine: { color: '#1c1c26' },
            tickLine: { color: '#1c1c26' },
            tickText: { color: '#8b8b9a', size: 11 },
          },
          yAxis: {
            axisLine: { color: '#1c1c26' },
            tickLine: { color: '#1c1c26' },
            tickText: { color: '#8b8b9a', size: 11 },
          },
          separator: {
            size: 1,
            color: '#1c1c26',
            fill: true,
            activeBackgroundColor: '#1c1c26',
          },
          crosshair: {
            horizontal: {
              line: { color: '#38384d', style: 'dashed', dashedValue: [4, 4] },
              text: { color: '#ffffff', backgroundColor: '#1d1d2b' },
            },
            vertical: {
              line: { color: '#38384d', style: 'dashed', dashedValue: [4, 4] },
              text: { color: '#ffffff', backgroundColor: '#1d1d2b' },
            },
          },
        },
      });

      if (!chart) return;
      chartInstanceRef.current = chart;

      chart.setSymbol({ ticker: 'MON/USDC', pricePrecision: 5, volumePrecision: 2 });
      chart.setPeriod(getKlineChartPeriod(currentTimeframeRef.current));

      chart.setDataLoader({
        getBars: ({ callback }) => {
          callback(candlesRef.current, false);
        },
      });

      chart.createIndicator({ name: 'MA', paneId: 'candle_pane' }, false);
      chart.createIndicator('VOL', false);

      chart.resetData();

      resizeObserver = new ResizeObserver(() => {
        chart.resize();
      });
      resizeObserver.observe(container);
    };

    // 1. Langganan live trade dari WebSocket Kuru
    // Selama memuat, simpan ke wsBufferRef (jangan menggambar grafik)
    const unsubTrade = subscribeKuruLiveTrade((trade) => {
      if (isCancelled) return;

      if (!isHistoryLoadedRef.current) {
        wsBufferRef.current.push(trade);
        return;
      }

      // Setelah riwayat selesai, perbarui candle langsung
      tradesHistoryRef.current.push(trade);

      const { updatedCandles, latestCandle } = updateCandlesWithLiveTrade(
        candlesRef.current,
        trade,
        currentTimeframeRef.current,
        tradesHistoryRef.current
      );

      candlesRef.current = updatedCandles;
      setLastPrice(latestCandle.close);

      if (updatedCandles.length > 0) {
        const first = updatedCandles[0];
        const last = updatedCandles[updatedCandles.length - 1];
        const rangeText = `${formatDebugTime(first.timestamp)} - ${formatDebugTime(last.timestamp)}`;

        setDebugInfo((prev) => ({
          ...prev,
          totalTrades: tradesHistoryRef.current.length,
          timeRange: rangeText,
        }));

        if (first.open > 0) {
          const pct = ((last.close - first.open) / first.open) * 100;
          setPriceChangePct(pct);
        }
      }

      if (chartInstanceRef.current) {
        chartInstanceRef.current.resetData();
      }
    });

    // Langganan status WebSocket
    const unsubStatus = subscribeKuruStatus((status) => {
      if (!isCancelled) {
        setWsStatus(status);
      }
    });

    // 2. Muat riwayat transaksi (Metode A, fallback Metode B)
    const loadData = async () => {
      try {
        const result = await fetchLongHistoricalTrades();

        if (isCancelled) return;

        // Gabungkan trade dari riwayat dan trade WebSocket yang masuk selama loading (deduplikasi berdasarkan id)
        const tradeMap = new Map<string | number, KuruTradeItem>();
        for (const t of result.trades) {
          tradeMap.set(t.id, t);
        }
        for (const t of wsBufferRef.current) {
          tradeMap.set(t.id, t);
        }
        wsBufferRef.current = [];

        const combinedTrades = Array.from(tradeMap.values());
        combinedTrades.sort((a, b) => a.time - b.time);
        tradesHistoryRef.current = combinedTrades;

        // Susun candle untuk timeframe aktif
        const { candles, startTime, endTime } = buildCandlesFromTrades(
          combinedTrades,
          currentTimeframeRef.current
        );

        candlesRef.current = candles;
        setHasChartError(false);

        const rangeStr =
          startTime && endTime
            ? `${formatDebugTime(startTime)} - ${formatDebugTime(endTime)}`
            : '-';

        setDebugInfo({
          method: result.method,
          pages: result.pages,
          totalTrades: combinedTrades.length,
          timeRange: rangeStr,
          lastError: result.lastError,
        });

        if (candles.length > 0) {
          const latest = candles[candles.length - 1];
          setLastPrice(latest.close);

          const first = candles[0];
          if (first && first.open > 0) {
            const pct = ((latest.close - first.open) / first.open) * 100;
            setPriceChangePct(pct);
          }
        }

        // Tandai riwayat selesai dimuat dan gambar grafik SATU KALI
        isHistoryLoadedRef.current = true;
        setIsLoading(false);

        initChartOnce();
      } catch (err: unknown) {
        if (!isCancelled) {
          console.error('[ChartPanel] Failed to load historical data:', err);
          setHasChartError(true);
          setDebugInfo((prev) => ({
            ...prev,
            lastError: err instanceof Error ? err.message : 'Error',
          }));
          isHistoryLoadedRef.current = true;
          setIsLoading(false);
          initChartOnce();
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
      unsubTrade();
      unsubStatus();
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (container) {
        dispose(container);
      }
      chartInstanceRef.current = null;
    };
  }, []);

  // Handler saat user memilih timeframe baru dari dropdown
  // Semua timeframe disusun ulang dari trade yang sama tanpa memuat ulang dari jaringan
  const handleSelectTimeframe = (newTf: ChartTimeframe) => {
    setCurrentTimeframe(newTf);
    currentTimeframeRef.current = newTf;
    setIsDropdownOpen(false);

    const { candles, startTime, endTime } = buildCandlesFromTrades(
      tradesHistoryRef.current,
      newTf
    );

    candlesRef.current = candles;

    if (startTime && endTime) {
      setDebugInfo((prev) => ({
        ...prev,
        timeRange: `${formatDebugTime(startTime)} - ${formatDebugTime(endTime)}`,
      }));
    }

    if (chartInstanceRef.current) {
      chartInstanceRef.current.setPeriod(getKlineChartPeriod(newTf));
      chartInstanceRef.current.resetData();
    }
  };

  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden rounded-[8px] border border-[#23232f] bg-transparent ${className}`}
    >
      {/* Header di atas grafik: pasangan MON/USDC, dropdown timeframe, harga terakhir, dan badge status live */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#1c1c26] bg-transparent px-3.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#836ef9]">
              <svg className="h-3 w-3 fill-white" viewBox="0 0 24 24">
                <path d="M12 2L3 9v6l9 7 9-7V9l-9-7zm0 3.5L18 10v4l-6 4.7L6 14v-4l6-4.5z" />
              </svg>
            </div>
            <span className="font-semibold text-white text-xs tracking-tight">
              MON / USDC
            </span>

            {/* Dropdown Timeframe: 5s, 15s, 30s, 1m, 5m, 15m, 30m, 1h, all */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded bg-[#1c1c26] hover:bg-[#262635] px-2 py-0.5 text-[10px] font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer border border-[#2c2c3d]/70 active:scale-95"
                title="Pilih Timeframe"
              >
                <span>{currentTimeframe}</span>
                <ChevronDown
                  className={`h-3 w-3 text-zinc-400 transition-transform duration-150 ${
                    isDropdownOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 min-w-[80px] overflow-hidden rounded-[6px] border border-[#2c2c3d] bg-[#12121a] py-1 shadow-2xl backdrop-blur-md">
                  {TIMEFRAMES.map((tf) => {
                    const isSelected = tf.key === currentTimeframe;
                    return (
                      <button
                        key={tf.key}
                        type="button"
                        onClick={() => handleSelectTimeframe(tf.key)}
                        className={`flex w-full items-center justify-between px-2.5 py-1 text-left text-[11px] font-mono transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#22d3ee]/15 text-[#22d3ee] font-semibold'
                            : 'text-zinc-300 hover:bg-[#1c1c28] hover:text-white'
                        }`}
                      >
                        <span>{tf.label}</span>
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#22d3ee]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="h-3.5 w-[1px] bg-[#1c1c26]" />

          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-xs font-bold text-white">
              {lastPrice > 0 ? `$${lastPrice.toFixed(5)}` : '--'}
            </span>
            {lastPrice > 0 && (
              <span
                className={`text-[11px] font-medium ${
                  priceChangePct >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                }`}
              >
                {priceChangePct >= 0 ? '+' : ''}
                {priceChangePct.toFixed(2)}%
              </span>
            )}
          </div>
        </div>

        {/* Badge: titik hijau + "Live" saat WebSocket tersambung; titik abu-abu + "Offline" saat putus */}
        {wsStatus === 'connected' ? (
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-[#22c55e]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22c55e]" />
            </span>
            <span>Live</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/40 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
            <span className="inline-flex rounded-full h-1.5 w-1.5 bg-zinc-500" />
            <span>Offline</span>
          </div>
        )}
      </div>

      {/* Grafik candlestick KLineChart yang memenuhi sisa tinggi dan lebar panel */}
      <div className="relative flex-1 min-h-0 min-w-0 w-full overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />

        {/* Teks Loading chart... di tengah panel selama memuat (menghilangkan kilatan) */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f0f16] text-xs text-zinc-400 font-sans z-30 pointer-events-none">
            Loading chart...
          </div>
        )}

        {/* Tampilkan teks di tengah panel kalau fetch gagal dan tidak sedang loading */}
        {!isLoading && hasChartError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f0f16]/90 text-xs text-zinc-500 font-sans z-20 pointer-events-none">
            Failed to load chart data
          </div>
        )}
      </div>

      {/* Satu baris debug kecil di bawah grafik:
          "Metode: <A atau B>, halaman: <n>, trade: <n>, rentang: <awal> - <akhir>, error terakhir: <pesan atau ->" */}
      <div className="shrink-0 border-t border-[#1c1c26] bg-[#0c0c14] px-3 py-1.5 font-mono text-[10px] text-zinc-500 select-all">
        Metode: {debugInfo.method}, halaman: {debugInfo.pages}, trade: {debugInfo.totalTrades}, rentang: {debugInfo.timeRange}, error terakhir: {debugInfo.lastError}
      </div>
    </div>
  );
}
