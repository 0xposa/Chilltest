import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet.ts';
import ProfileMenu from './ProfileMenu.tsx';

// MOCK DATA - replace with live Kuru data
const MOCK_PAIR = 'MON/USDC';
const MOCK_PRICE = '$0.02777';
const MOCK_CHANGE = '+0.019%';

// MOCK DATA - replace with live data
const MOCK_MON_BALANCE = '0.00';
const MOCK_PORTFOLIO_VALUE = '$0.31';
const MOCK_PORTFOLIO_CHANGE = '-$0.55';

interface TopBarProps {
  className?: string;
  onResetLayout?: () => void;
  isProfile?: boolean;
}

export default function TopBar({ className = '', onResetLayout, isProfile: isProfileProp }: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isProfile = isProfileProp ?? location.pathname.startsWith('/profile');

  const { isLoggedIn, address, isDemo, login, logout } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const avatarInitials = address ? address.slice(0, 2).toUpperCase() : '0X';

  if (isProfile) {
    return null;
  }

  return (
    <div
      className={`relative flex h-[46px] w-full shrink-0 items-center justify-between px-6 ${className}`}
    >
      <div className="flex items-center gap-3">
        <Link
          to="/app"
          className="text-base font-semibold tracking-tight text-white hover:text-zinc-300 transition"
        >
          Chill
        </Link>
        <span className="rounded-full bg-[#1a1a24] px-3 py-1 text-[14px] font-medium text-white">
          {MOCK_PAIR}
        </span>
        <span className="text-[20px] font-bold text-white">
          {MOCK_PRICE}
        </span>
        <span className="rounded-full bg-[#22c55e]/[0.12] px-2.5 py-0.5 text-[12px] font-medium text-[#22c55e]">
          {MOCK_CHANGE}
        </span>
      </div>

      {/* Search bar terpusat di tengah */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        <div className="relative flex items-center">
          <svg
            className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="h-8 w-56 sm:w-72 md:w-80 rounded-md border border-zinc-800 bg-[#14141e] pl-8 pr-3 text-xs text-white placeholder-zinc-500 transition focus:border-zinc-700 focus:bg-[#1a1a27] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-xs text-zinc-500 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onResetLayout && (
          <button
            type="button"
            onClick={onResetLayout}
            title="Reset ukuran panel ke default"
            className="hidden sm:flex items-center gap-1.5 rounded-md border border-zinc-800 bg-[#14141e] px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white cursor-pointer"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Reset Layout</span>
          </button>
        )}

        {!isLoggedIn ? (
          <button
            type="button"
            onClick={login}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 cursor-pointer"
          >
            Log in
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* Kotak saldo Monad (MON) */}
            <div className="flex h-[42px] max-h-[48px] flex-col justify-center rounded-[16px] border border-[#23232f] bg-[#12121a] px-3">
              <div className="flex items-baseline gap-1 leading-none">
                <span className="text-xs font-bold text-white">{MOCK_MON_BALANCE}</span>
                <span className="text-[11px] font-medium text-zinc-400">MON</span>
              </div>
              <button
                type="button"
                className="mt-1 text-left text-[11px] font-medium leading-none text-[#22d3ee] hover:underline cursor-pointer"
              >
                Deposit more
              </button>
            </div>

            {/* Kotak nilai & avatar */}
            <div className="relative">
              <div
                onClick={() => navigate('/profile')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate('/profile');
                  }
                }}
                title="Buka profil"
                className="flex h-[42px] max-h-[48px] items-center gap-2.5 rounded-[16px] border border-[#23232f] bg-[#12121a] pl-3 pr-1 cursor-pointer transition hover:border-[#22d3ee]/60 hover:bg-[#161622]"
              >
                <div className="flex flex-col justify-center leading-none">
                  <span className="text-xs font-bold text-white">{MOCK_PORTFOLIO_VALUE}</span>
                  <div className="mt-1 flex items-baseline gap-1 text-[11px] leading-none">
                    <span className="font-medium text-[#ef4444]">{MOCK_PORTFOLIO_CHANGE}</span>
                    <span className="text-zinc-400">24h</span>
                  </div>
                </div>
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#22d3ee] to-[#a855f7] text-xs font-bold text-white transition hover:opacity-90"
                  aria-label="Profile"
                >
                  {avatarInitials}
                </div>
              </div>

              {isProfileOpen && (
                <ProfileMenu
                  address={address || ''}
                  isDemo={isDemo}
                  onClose={() => setIsProfileOpen(false)}
                  onLogout={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
