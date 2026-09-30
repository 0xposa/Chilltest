import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet.ts';

function processImage(
  file: File,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Hanya file gambar yang diperbolehkan'));
    }
    if (file.size > 5 * 1024 * 1024) {
      return reject(new Error('Ukuran gambar maksimal 5MB'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat file gambar'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Gagal inisialisasi context canvas'));

        const targetAspect = targetWidth / targetHeight;
        const imgAspect = img.width / img.height;

        let sx = 0;
        let sy = 0;
        let sWidth = img.width;
        let sHeight = img.height;

        // Potong dari tengah (center-crop / cover fit)
        if (imgAspect > targetAspect) {
          sWidth = img.height * targetAspect;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / targetAspect;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const getStoredImage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.error('Error reading localStorage', err);
    return null;
  }
};

const setStoredImage = (key: string, dataUrl: string) => {
  try {
    localStorage.setItem(key, dataUrl);
  } catch (err) {
    console.error('Error writing to localStorage', err);
  }
};

export default function ProfilePage() {
  const { isLoggedIn, address, isDemo, logout } = useWallet();
  const navigate = useNavigate();

  const userKey = isDemo ? 'demo' : (address?.toLowerCase() || 'default');

  const [activeTab, setActiveTab] = useState<'assets' | 'nets' | 'history'>('assets');
  const [copied, setCopied] = useState(false);
  const [bio, setBio] = useState(() => {
    try {
      return localStorage.getItem('chill_user_bio') || 'DeFi & Net trader on Monad.';
    } catch {
      return 'DeFi & Net trader on Monad.';
    }
  });
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState(bio);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    return getStoredImage(`chill_avatar_${userKey}`);
  });

  const [bannerUrl, setBannerUrl] = useState<string | null>(() => {
    return getStoredImage(`chill_banner_${userKey}`);
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatarUrl(getStoredImage(`chill_avatar_${userKey}`));
    setBannerUrl(getStoredImage(`chill_banner_${userKey}`));
  }, [userKey]);

  const shortenedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : 'Not connected';

  const avatarInitials = address ? address.slice(0, 2).toUpperCase() : '0X';

  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveBio = () => {
    setBio(tempBio);
    try {
      localStorage.setItem('chill_user_bio', tempBio);
    } catch (err) {
      console.error('Error saving bio', err);
    }
    setIsEditingBio(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImage(file, 256, 256);
      setAvatarUrl(dataUrl);
      setStoredImage(`chill_avatar_${userKey}`, dataUrl);
      setUploadError(null);
    } catch (err: any) {
      setUploadError(err?.message || 'Gagal memproses gambar avatar');
      setTimeout(() => setUploadError(null), 4000);
    } finally {
      e.target.value = '';
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImage(file, 1200, 300);
      setBannerUrl(dataUrl);
      setStoredImage(`chill_banner_${userKey}`, dataUrl);
      setUploadError(null);
    } catch (err: any) {
      setUploadError(err?.message || 'Gagal memproses gambar banner');
      setTimeout(() => setUploadError(null), 4000);
    } finally {
      e.target.value = '';
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/app');
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0b10] text-white">
      <main className="w-full px-6 py-6">
        {/* Navigation Breadcrumb */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/app"
            className="group flex items-center gap-2 text-xs font-medium text-zinc-400 transition hover:text-white"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            <span>Kembali ke Trading</span>
          </Link>
          {isDemo && (
            <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-xs font-semibold text-yellow-400 border border-yellow-500/30">
              Demo Environment
            </span>
          )}
        </div>

        {/* Error notification if file upload fails */}
        {uploadError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {uploadError}
          </div>
        )}

        {/* Profile Card */}
        <div className="overflow-hidden rounded-2xl border border-[#23232f] bg-[#12121a]">
          {/* Cover Banner */}
          <div className="relative h-40 w-full overflow-hidden bg-gradient-to-r from-[#171724] via-[#212138] to-[#141424] border-b border-[#23232f]">
            {bannerUrl ? (
              <img src={bannerUrl} alt="Cover Banner" className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
            )}
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg border border-[#23232f]/90 bg-[#12121a]/80 px-2.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm transition hover:bg-[#1a1a24] hover:text-white cursor-pointer shadow"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Change banner</span>
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerChange}
            />
          </div>

          {/* Profile Header Details */}
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
              <div className="flex items-end gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[#12121a] bg-gradient-to-tr from-[#22d3ee] to-[#a855f7] text-2xl font-bold text-white shadow-xl">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      avatarInitials
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    title="Ganti avatar"
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#12121a] bg-zinc-800 text-zinc-200 shadow-md transition hover:bg-zinc-700 hover:text-white cursor-pointer"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="mb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white">Monad Trader</h1>
                    <span className="rounded-full bg-lime-400/20 px-2 py-0.5 text-[11px] font-medium text-lime-400 border border-lime-400/30">
                      Active
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-400">{shortenedAddress}</span>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                    >
                      {copied ? 'Tersalin!' : 'Salin'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingBio(!isEditingBio)}
                  className="rounded-lg border border-[#23232f] bg-[#161622] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white cursor-pointer"
                >
                  {isEditingBio ? 'Batal' : 'Edit Bio'}
                </button>
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 hover:text-red-300 cursor-pointer"
                  >
                    Log out
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            {isEditingBio ? (
              <div className="mt-3 flex max-w-xl items-center gap-2">
                <input
                  type="text"
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-700 bg-[#161622] px-3 py-1.5 text-xs text-white focus:border-[#22d3ee] focus:outline-none"
                  placeholder="Tulis bio profil Anda..."
                />
                <button
                  type="button"
                  onClick={handleSaveBio}
                  className="rounded-lg bg-[#22d3ee] px-3 py-1.5 text-xs font-semibold text-[#0b0b10] hover:bg-[#06b6d4] transition"
                >
                  Simpan
                </button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-zinc-400 max-w-2xl">{bio}</p>
            )}

            {/* Metrics Overview Cards */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-[#23232f] bg-[#161622]/80 p-3.5">
                <div className="text-[11px] text-zinc-400">Total Portfolio</div>
                <div className="mt-1 text-lg font-bold text-white">$0.31</div>
                <div className="mt-0.5 text-[11px] font-medium text-red-400">-$0.55 (24h)</div>
              </div>

              <div className="rounded-xl border border-[#23232f] bg-[#161622]/80 p-3.5">
                <div className="text-[11px] text-zinc-400">Saldo Monad</div>
                <div className="mt-1 text-lg font-bold text-white">0.00 MON</div>
                <div className="mt-0.5 text-[11px] text-[#22d3ee]">Deposit more</div>
              </div>

              <div className="rounded-xl border border-[#23232f] bg-[#161622]/80 p-3.5">
                <div className="text-[11px] text-zinc-400">Win Rate (30D)</div>
                <div className="mt-1 text-lg font-bold text-white">68.4%</div>
                <div className="mt-0.5 text-[11px] text-lime-400">19/28 trades</div>
              </div>

              <div className="rounded-xl border border-[#23232f] bg-[#161622]/80 p-3.5">
                <div className="text-[11px] text-zinc-400">Active Nets</div>
                <div className="mt-1 text-lg font-bold text-white">1 Net Aktif</div>
                <div className="mt-0.5 text-[11px] text-zinc-400">MON/USDC Ladder</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 border-b border-[#23232f]">
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('assets')}
              className={`pb-3 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'assets'
                  ? 'border-b-2 border-lime-400 text-lime-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Aset & Saldo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('nets')}
              className={`pb-3 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'nets'
                  ? 'border-b-2 border-lime-400 text-lime-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Active Nets (Ladder)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'history'
                  ? 'border-b-2 border-lime-400 text-lime-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Riwayat Transaksi
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'assets' && (
            <div className="overflow-hidden rounded-xl border border-[#23232f] bg-[#12121a]">
              <div className="divide-y divide-[#23232f]">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 font-bold text-xs">
                      M
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Monad (MON)</div>
                      <div className="text-[11px] text-zinc-400">Native Gas Token</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">0.00 MON</div>
                    <div className="text-[11px] text-zinc-400">$0.00 USD</div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs">
                      $
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">USD Coin (USDC)</div>
                      <div className="text-[11px] text-zinc-400">Stablecoin</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">0.31 USDC</div>
                    <div className="text-[11px] text-zinc-400">$0.31 USD</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nets' && (
            <div className="overflow-hidden rounded-xl border border-[#23232f] bg-[#12121a] p-4">
              <div className="flex items-center justify-between rounded-lg border border-[#23232f] bg-[#161622] p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white">MON/USDC Buy Dip Ladder</span>
                    <span className="rounded bg-lime-400/20 px-1.5 py-0.5 text-[10px] text-lime-400 font-medium">Running</span>
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">Rentang Harga: 0.0300 - 0.0340 USDC (5 Level Orders)</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white">Allocated: 50.00 USDC</div>
                  <div className="text-[11px] text-lime-400">40% Filled</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="overflow-hidden rounded-xl border border-[#23232f] bg-[#12121a]">
              <div className="divide-y divide-[#23232f] text-xs">
                <div className="flex items-center justify-between px-4 py-3 text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-green-500/20 px-2 py-0.5 text-[11px] font-semibold text-green-400">BUY</span>
                    <span className="text-white font-medium">MON/USDC</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono">1,460 MON @ 0.0342</div>
                    <div className="text-[10px] text-zinc-500">2 jam yang lalu</div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-3 text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-red-500/20 px-2 py-0.5 text-[11px] font-semibold text-red-400">SELL</span>
                    <span className="text-white font-medium">MON/USDC</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono">850 MON @ 0.0360</div>
                    <div className="text-[10px] text-zinc-500">1 hari yang lalu</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
