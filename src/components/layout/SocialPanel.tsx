interface SocialPanelProps {
  className?: string;
}

export default function SocialPanel({ className = '' }: SocialPanelProps) {
  return (
    <div
      className={`h-full w-full rounded-[8px] border border-[#23232f] bg-[#0f0f16] ${className}`}
    />
  );
}
