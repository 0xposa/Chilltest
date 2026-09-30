import { useState, useRef, useEffect } from 'react';
import TopBar from '../components/layout/TopBar.tsx';
import SocialPanel from '../components/layout/SocialPanel.tsx';
import ChartPanel from '../components/layout/ChartPanel.tsx';
import PositionsPanel from '../components/layout/PositionsPanel.tsx';
import TradePanel from '../components/layout/TradePanel.tsx';

type DragType = 'left' | 'right' | 'center-v' | null;

const DEFAULT_LEFT_WIDTH = 300;
const DEFAULT_RIGHT_WIDTH = 320;
const DEFAULT_CENTER_SPLIT = 60;

export default function HomePage() {
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    const saved = localStorage.getItem('jaring_layout_left_width');
    return saved ? Math.max(140, Math.min(500, Number(saved))) : DEFAULT_LEFT_WIDTH;
  });

  const [rightWidth, setRightWidth] = useState<number>(() => {
    const saved = localStorage.getItem('jaring_layout_right_width');
    return saved ? Math.max(160, Math.min(500, Number(saved))) : DEFAULT_RIGHT_WIDTH;
  });

  const [centerSplit, setCenterSplit] = useState<number>(() => {
    const saved = localStorage.getItem('jaring_layout_center_split');
    return saved ? Math.max(15, Math.min(85, Number(saved))) : DEFAULT_CENTER_SPLIT;
  });

  const [dragging, setDragging] = useState<DragType>(null);

  // Simpan nilai terbaru di ref untuk performa halus tanpa re-bind listener berulang
  const leftWidthRef = useRef(leftWidth);
  const rightWidthRef = useRef(rightWidth);
  const draggingRef = useRef(dragging);

  leftWidthRef.current = leftWidth;
  rightWidthRef.current = rightWidth;
  draggingRef.current = dragging;

  const containerRef = useRef<HTMLDivElement>(null);
  const centerColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  const startDragging = (type: DragType) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Abaikan jika pointer capture tidak didukung browser tertentu
    }
    setDragging(type);
  };

  useEffect(() => {
    if (!dragging) return;

    const onPointerMove = (e: PointerEvent) => {
      const activeDrag = draggingRef.current;
      if (!activeDrag || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;

      if (activeDrag === 'left') {
        const newWidth = e.clientX - containerRect.left;
        const maxLeft = Math.max(160, containerWidth - rightWidthRef.current - 220);
        const clamped = Math.max(140, Math.min(maxLeft, newWidth));
        setLeftWidth(clamped);
        localStorage.setItem('jaring_layout_left_width', clamped.toString());
      } else if (activeDrag === 'right') {
        const newWidth = containerRect.right - e.clientX;
        const maxRight = Math.max(180, containerWidth - leftWidthRef.current - 220);
        const clamped = Math.max(160, Math.min(maxRight, newWidth));
        setRightWidth(clamped);
        localStorage.setItem('jaring_layout_right_width', clamped.toString());
      } else if (activeDrag === 'center-v' && centerColRef.current) {
        const rect = centerColRef.current.getBoundingClientRect();
        const ratio = ((e.clientY - rect.top) / rect.height) * 100;
        const clamped = Math.max(15, Math.min(85, ratio));
        setCenterSplit(clamped);
        localStorage.setItem('jaring_layout_center_split', clamped.toString());
      }
    };

    const onPointerUp = () => {
      setDragging(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [dragging]);

  const resetLayout = () => {
    setLeftWidth(DEFAULT_LEFT_WIDTH);
    setRightWidth(DEFAULT_RIGHT_WIDTH);
    setCenterSplit(DEFAULT_CENTER_SPLIT);
    localStorage.removeItem('jaring_layout_left_width');
    localStorage.removeItem('jaring_layout_right_width');
    localStorage.removeItem('jaring_layout_center_split');
  };

  const getCursorClass = () => {
    if (dragging === 'left' || dragging === 'right') return 'cursor-col-resize select-none';
    if (dragging === 'center-v') return 'cursor-row-resize select-none';
    return '';
  };

  return (
    <div
      className={`relative flex h-screen w-full flex-col gap-2 overflow-hidden bg-[#0b0b10] py-2 ${
        dragging ? 'select-none [&_iframe]:pointer-events-none' : ''
      } ${getCursorClass()}`}
    >
      {/* Overlay pelindung saat dragging agar iframe TradingView tidak menelan event mouse/touch */}
      {dragging && (
        <div
          className="fixed inset-0 z-[9999]"
          style={{
            cursor: dragging === 'center-v' ? 'row-resize' : 'col-resize',
            touchAction: 'none',
          }}
        />
      )}

      {/* Bar atas */}
      <TopBar onResetLayout={resetLayout} />

      {/* Area utama tiga kolom interaktif yang bisa diubah ukurannya */}
      <div ref={containerRef} className="flex min-h-0 flex-1 px-6">
        {/* Kolom kiri: lebar fleksibel dengan dragging */}
        <div
          className="h-full shrink-0 overflow-hidden"
          style={{ width: `${leftWidth}px` }}
        >
          <SocialPanel />
        </div>

        {/* Divider pemisah Kolom Kiri dan Tengah */}
        <div
          role="separator"
          aria-orientation="vertical"
          onPointerDown={startDragging('left')}
          onDoubleClick={() => setLeftWidth(DEFAULT_LEFT_WIDTH)}
          title="Geser untuk mengubah ukuran kolom kiri (Klik 2x untuk reset)"
          style={{ touchAction: 'none' }}
          className={`group relative z-20 flex w-3 shrink-0 cursor-col-resize select-none items-center justify-center transition-all ${
            dragging === 'left' ? 'bg-lime-400/30' : 'hover:bg-lime-400/20 active:bg-lime-400/40'
          }`}
        >
          {/* Target sentuh diperlebar (touch target buffer) untuk kemudahan jari di tablet */}
          <div className="absolute -inset-x-3 inset-y-0" />
          <div
            className={`h-8 w-1 rounded-full pointer-events-none transition-colors ${
              dragging === 'left' ? 'bg-lime-400' : 'bg-zinc-700 group-hover:bg-lime-400'
            }`}
          />
        </div>

        {/* Kolom tengah: atas dan bawah bisa diubah perbandingannya */}
        <div ref={centerColRef} className="flex h-full min-w-0 flex-1 flex-col">
          <div
            className="min-h-0 w-full overflow-hidden"
            style={{ height: `calc(${centerSplit}% - 4px)` }}
          >
            <ChartPanel />
          </div>

          {/* Divider vertikal pemisah Chart & Positions */}
          <div
            role="separator"
            aria-orientation="horizontal"
            onPointerDown={startDragging('center-v')}
            onDoubleClick={() => setCenterSplit(DEFAULT_CENTER_SPLIT)}
            title="Geser untuk mengubah ukuran vertikal (Klik 2x untuk reset)"
            style={{ touchAction: 'none' }}
            className={`group relative z-20 flex h-3 shrink-0 cursor-row-resize select-none items-center justify-center transition-all ${
              dragging === 'center-v' ? 'bg-lime-400/30' : 'hover:bg-lime-400/20 active:bg-lime-400/40'
            }`}
          >
            {/* Target sentuh diperlebar (touch target buffer) untuk kemudahan jari di tablet */}
            <div className="absolute -inset-y-3 inset-x-0" />
            <div
              className={`h-1 w-8 rounded-full pointer-events-none transition-colors ${
                dragging === 'center-v' ? 'bg-lime-400' : 'bg-zinc-700 group-hover:bg-lime-400'
              }`}
            />
          </div>

          <div
            className="min-h-0 w-full overflow-hidden"
            style={{ height: `calc(${100 - centerSplit}% - 4px)` }}
          >
            <PositionsPanel />
          </div>
        </div>

        {/* Divider pemisah Kolom Tengah dan Kanan */}
        <div
          role="separator"
          aria-orientation="vertical"
          onPointerDown={startDragging('right')}
          onDoubleClick={() => setRightWidth(DEFAULT_RIGHT_WIDTH)}
          title="Geser untuk mengubah ukuran kolom kanan (Klik 2x untuk reset)"
          style={{ touchAction: 'none' }}
          className={`group relative z-20 flex w-3 shrink-0 cursor-col-resize select-none items-center justify-center transition-all ${
            dragging === 'right' ? 'bg-lime-400/30' : 'hover:bg-lime-400/20 active:bg-lime-400/40'
          }`}
        >
          {/* Target sentuh diperlebar (touch target buffer) untuk kemudahan jari di tablet */}
          <div className="absolute -inset-x-3 inset-y-0" />
          <div
            className={`h-8 w-1 rounded-full pointer-events-none transition-colors ${
              dragging === 'right' ? 'bg-lime-400' : 'bg-zinc-700 group-hover:bg-lime-400'
            }`}
          />
        </div>

        {/* Kolom kanan: satu panel penuh terpadu */}
        <div
          ref={rightColRef}
          className="h-full shrink-0 overflow-hidden"
          style={{ width: `${rightWidth}px` }}
        >
          <TradePanel />
        </div>
      </div>
    </div>
  );
}
