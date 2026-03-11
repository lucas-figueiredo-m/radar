/**
 * Deduplication mechanism for fetch + XHR interception in React Native.
 *
 * In RN, fetch() is a polyfill built on XMLHttpRequest. When both patchFetch
 * and patchXHR are active, a single fetch() call would be intercepted twice.
 *
 * How it works:
 * 1. patchFetch sets `active = true` before calling the original fetch
 * 2. The original fetch synchronously creates an XHR and calls open() + send()
 * 3. patchXHR.open() checks the flag and marks that XHR instance in `instances`
 * 4. patchXHR.send() skips interception for marked instances
 * 5. patchFetch resets `active = false` after the synchronous call returns
 */

let active = false;
const instances = new WeakSet<XMLHttpRequest>();

export const fetchFlag = {
  set: () => {
    active = true;
  },
  reset: () => {
    active = false;
  },
  markIfActive: (xhr: XMLHttpRequest) => {
    if (active) instances.add(xhr);
  },
  isFromFetch: (xhr: XMLHttpRequest): boolean => instances.has(xhr),
};
