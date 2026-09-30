// Shim for @coinbase/wallet-sdk/dist/util/provider.js to prevent cross-origin window.top access in iframes

export async function fetchRPCRequest(request: any, rpcUrl: string) {
  const requestBody = {
    ...request,
    jsonrpc: '2.0',
    id: crypto.randomUUID(),
  };
  const res = await window.fetch(rpcUrl, {
    method: 'POST',
    body: JSON.stringify(requestBody),
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'X-Cbw-Sdk-Version': '4.0.0',
      'X-Cbw-Sdk-Platform': 'CoinbaseWalletSDK',
    },
  });
  const { result, error } = await res.json();
  if (error) throw error;
  return result;
}

function getCoinbaseInjectedLegacyProvider() {
  try {
    const w = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
    return w?.coinbaseWalletExtension;
  } catch {
    return undefined;
  }
}

function getInjectedEthereum() {
  try {
    // Only check window.ethereum on current frame, NEVER touch window.top or window.parent in iframe
    const w = typeof window !== 'undefined' ? (window as any) : (globalThis as any);
    return w?.ethereum;
  } catch {
    return undefined;
  }
}

export function getCoinbaseInjectedProvider({ metadata, preference }: any) {
  try {
    const { appName, appLogoUrl, appChainIds } = metadata || {};
    if (preference?.options !== 'smartWalletOnly') {
      const extension = getCoinbaseInjectedLegacyProvider();
      if (extension) {
        extension.setAppInfo?.(appName, appLogoUrl, appChainIds, preference);
        return extension;
      }
    }
    const ethereum = getInjectedEthereum();
    if (ethereum?.isCoinbaseBrowser) {
      ethereum.setAppInfo?.(appName, appLogoUrl, appChainIds, preference);
      return ethereum;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function checkErrorForInvalidRequestArgs(args: any) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    throw new Error('Expected a single, non-array, object argument.');
  }
  const { method, params } = args;
  if (typeof method !== 'string' || method.length === 0) {
    throw new Error("'args.method' must be a non-empty string.");
  }
  if (
    params !== undefined &&
    !Array.isArray(params) &&
    (typeof params !== 'object' || params === null)
  ) {
    throw new Error("'args.params' must be an object or array if provided.");
  }
  switch (method) {
    case 'eth_sign':
    case 'eth_signTypedData_v2':
    case 'eth_subscribe':
    case 'eth_unsubscribe':
      throw new Error('Unsupported method');
  }
}
