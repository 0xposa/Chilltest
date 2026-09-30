import { useEffect, useRef } from 'react';

interface ProfileMenuProps {
  address: string;
  isDemo?: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function ProfileMenu({
  address,
  isDemo = false,
  onClose,
  onLogout,
}: ProfileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const shortenedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const avatarInitials = address ? address.slice(0, 2).toUpperCase() : '0X';

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 z-50 w-[280px] overflow-hidden rounded-[16px] border border-[#23232f] bg-[#12121a] shadow-2xl"
    >
      {/* Area banner: tinggi 80px, gradasi gelap (placeholder) */}
      <div className="h-[80px] w-full bg-gradient-to-r from-[#171724] via-[#212133] to-[#14141e] border-b border-[#23232f]/40" />

      {/* Avatar bulat 56px menimpa tepi bawah banner */}
      <div className="relative px-4">
        <div className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#12121a] bg-gradient-to-tr from-[#22d3ee] to-[#a855f7] text-base font-bold text-white shadow-md">
          {avatarInitials}
        </div>
      </div>

      {/* Alamat wallet singkat (0x1234...abcd) */}
      <div className="flex items-center gap-2 px-4 pt-2">
        <span className="font-mono text-xs text-zinc-300">
          {shortenedAddress}
        </span>
        {isDemo && (
          <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-400 border border-yellow-500/30">
            DEMO
          </span>
        )}
      </div>

      {/* Ruang kosong */}
      <div className="h-6" />

      {/* Garis pemisah, lalu tombol "Log out" selebar penuh di PALING BAWAH */}
      <div className="border-t border-[#23232f] p-3">
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-lg bg-zinc-900/90 py-2 px-3 text-center text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white cursor-pointer"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
