import { useEffect, useRef } from 'react';
import { init, dispose, type Chart } from 'klinecharts';
import { mockCandles } from '../../lib/mockCandles.ts';

interface ChartPanelProps {
  className?: string;
}

export default function ChartPanel({ className = '' }: ChartPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Ambil harga terakhir dari mockCandles untuk ditampilkan di header
  const lastCandle = mockCandles[mockCandles.length - 1];
  const lastPrice = lastCandle ? lastCandle.close : 0.02777;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Inisialisasi KLineChart dengan gaya gelap transparan
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

    // Atur simbol dan presisi
    chart.setSymbol({ ticker: 'MON/USDC', pricePrecision: 5, volumePrecision: 2 });
    chart.setPeriod({ type: 'hour', span: 1 });

    // Muat data lilin contoh
    chart.setDataLoader({
      getBars: ({ callback }) => {
        callback(mockCandles, false);
      },
    });

    // Indikator: MA di panel utama, VOL di panel bawah
    chart.createIndicator({ name: 'MA', paneId: 'candle_pane' }, false);
    chart.createIndicator('VOL', false);

    // Otomatis menyesuaikan ukuran panel saat kontainer berubah (ResizeObserver)
    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      dispose(container);
      chartInstanceRef.current = null;
    };
  }, []);

  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden rounded-[8px] border border-[#23232f] bg-transparent ${className}`}
    >
      {/* Header kecil di atas grafik: pasangan MON/USDC, harga, dan label "Demo data" berwarna kuning */}
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
          </div>

          <div className="h-3.5 w-[1px] bg-[#1c1c26]" />

          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-xs font-bold text-white">
              ${lastPrice.toFixed(5)}
            </span>
            <span className="text-[11px] font-medium text-[#22c55e]">
              +0.019%
            </span>
          </div>
        </div>

        {/* Label "Demo data" berwarna kuning */}
        <div className="flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
          <span>Demo data</span>
        </div>
      </div>

      {/* Grafik candlestick KLineChart yang memenuhi sisa tinggi dan lebar panel */}
      <div className="relative flex-1 min-h-0 min-w-0 w-full overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
