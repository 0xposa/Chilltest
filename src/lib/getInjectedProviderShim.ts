const TBA_PROVIDER_IDENTIFIER = 'isCoinbaseBrowser';

export function getInjectedProvider() {
  try {
    const injectedProvider =
      typeof window !== 'undefined'
        ? (window as unknown as { ethereum?: Record<string, unknown> }).ethereum
        : null;
    if (injectedProvider && injectedProvider[TBA_PROVIDER_IDENTIFIER]) {
      return injectedProvider;
    }
  } catch {
    // Ignore cross-origin security errors in iframe environments
  }
  return null;
}
