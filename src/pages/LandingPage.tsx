import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-[#0b0b10] text-white">
      {/* Container utama lebar penuh dengan padding 24px */}
      <div className="flex w-full flex-1 flex-col px-6">
        {/* 1. Bar Atas */}
        <header className="flex h-20 w-full items-center justify-between">
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xl font-semibold tracking-tight text-white hover:text-zinc-300 transition cursor-pointer"
          >
            Chill
          </Link>
          <Link
            to="/app"
            className="rounded-lg border border-[#23232f] bg-[#0f0f16] px-4 py-2 text-sm font-medium text-white transition hover:border-[#22d3ee]/50 hover:bg-[#161622]"
          >
            Launch App
          </Link>
        </header>

        {/* 2. Hero */}
        <main className="flex w-full flex-1 flex-col justify-center py-16 md:py-24">
          <div className="max-w-[720px]">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Cast a net. Catch the dip.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-400 sm:text-xl">
              Place a ladder of limit orders on Kuru with a single slider, then
              follow and copy the nets of other traders.
            </p>
            <div className="mt-8">
              <Link
                to="/app"
                className="inline-block rounded-lg bg-lime-400 px-6 py-3 text-base font-semibold text-[#0b0b10] transition hover:bg-lime-300"
              >
                Launch App
              </Link>
            </div>
          </div>

          {/* 3. Tiga blok fitur berdampingan */}
          <div className="mt-20 grid w-full grid-cols-1 gap-6 md:grid-cols-3 md:mt-28">
            <div className="rounded-xl border border-[#23232f] bg-[#0f0f16] p-6">
              <h2 className="text-lg font-semibold text-white">
                One-slide limit ladders
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Spread several buy orders across price levels at once and let the
                market come to you.
              </p>
            </div>

            <div className="rounded-xl border border-[#23232f] bg-[#0f0f16] p-6">
              <h2 className="text-lg font-semibold text-white">
                Live Kuru order book
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Trade directly against Kuru&apos;s on-chain central limit order book
                on Monad.
              </p>
            </div>

            <div className="rounded-xl border border-[#23232f] bg-[#0f0f16] p-6">
              <h2 className="text-lg font-semibold text-white">
                Social trading
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                See what other traders are placing and copy their setup with one
                click.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* 4. Footer */}
      <footer className="w-full border-t border-[#23232f]/40 py-6 px-6">
        <div className="w-full text-center text-xs text-zinc-500">
          Built on Monad. Trading involves risk.
        </div>
      </footer>
    </div>
  );
}
