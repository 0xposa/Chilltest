interface OrderBookPanelProps {
  className?: string;
}

export default function OrderBookPanel({ className = '' }: OrderBookPanelProps) {
  return (
    <div
      className={`h-full w-full rounded-[8px] border border-[#23232f] bg-[#0f0f16] ${className}`}
    />
  );
}
