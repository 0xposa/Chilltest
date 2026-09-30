const nativeFetch =
  typeof globalThis !== 'undefined' && globalThis.fetch
    ? globalThis.fetch.bind(globalThis)
    : typeof window !== 'undefined' && window.fetch
      ? window.fetch.bind(window)
      : fetch;

const nativeHeaders =
  typeof globalThis !== 'undefined' && globalThis.Headers
    ? globalThis.Headers
    : typeof Headers !== 'undefined'
      ? Headers
      : undefined;

const nativeRequest =
  typeof globalThis !== 'undefined' && globalThis.Request
    ? globalThis.Request
    : typeof Request !== 'undefined'
      ? Request
      : undefined;

const nativeResponse =
  typeof globalThis !== 'undefined' && globalThis.Response
    ? globalThis.Response
    : typeof Response !== 'undefined'
      ? Response
      : undefined;

export default nativeFetch;
export {
  nativeFetch as fetch,
  nativeHeaders as Headers,
  nativeRequest as Request,
  nativeResponse as Response,
};
