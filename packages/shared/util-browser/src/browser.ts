const window = globalThis;

export namespace browser {
  type Params = Record<string, string | null> | null;

  export function changeParams(params: Params) {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);

    if (params === null) {
      // Remove all search params
      url.search = '';
    } else {
      // Update or remove only the keys explicitly provided
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          url.searchParams.delete(key);
        } else {
          url.searchParams.set(key, value);
        }
      });
    }

    // Update URL without reload
    const finalUrl =
      url.searchParams.toString().length > 0
        ? url.toString()
        : `${url.origin}${url.pathname}`;

    window.history.replaceState({}, '', finalUrl);
  }

  export function appendParams(params: string) {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const newParams = new URLSearchParams(params);

    newParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    window.history.replaceState({}, '', url.toString());
  }

  export function changePath(path: string) {
    if (typeof window === 'undefined') return;

    const url = new URL(path, window.location.origin);
    window.history.replaceState({}, '', url.toString());
  }
}
