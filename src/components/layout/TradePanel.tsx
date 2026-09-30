interface TradePanelProps {
  className?: string;
}

export default function TradePanel({ className = '' }: TradePanelProps) {
  return (
    <div
      className={`h-full w-full rounded-[8px] border border-[#23232f] bg-[#0f0f16] ${className}`}
    />
  );
}
