import { useState, useMemo } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

export interface UseWalletResult {
  isLoggedIn: boolean;
  address: string | null;
  isDemo: boolean;
  login: () => void;
  logout: () => Promise<void> | void;
}

const DEMO_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

export function useWallet(): UseWalletResult {
  const isDemo = useMemo(() => {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  }, []);

  const [demoLoggedIn, setDemoLoggedIn] = useState(false);

  const { authenticated, user, login: privyLogin, logout: privyLogout } = usePrivy();
  const { wallets } = useWallets();

  if (isDemo) {
    return {
      isLoggedIn: demoLoggedIn,
      address: demoLoggedIn ? DEMO_ADDRESS : null,
      isDemo: true,
      login: () => setDemoLoggedIn(true),
      logout: () => {
        setDemoLoggedIn(false);
      },
    };
  }

  const embeddedWallet = wallets.find(
    (w) => w.walletClientType === 'privy'
  );
  const address =
    user?.wallet?.address ||
    embeddedWallet?.address ||
    wallets[0]?.address ||
    null;

  return {
    isLoggedIn: authenticated,
    address,
    isDemo: false,
    login: privyLogin,
    logout: privyLogout,
  };
}
