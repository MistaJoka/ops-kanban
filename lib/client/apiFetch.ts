export type ApiFetchResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; code?: string; status: number };

let sessionRedirectHandler: ((nextPath: string) => void) | null = null;

export function registerSessionRedirect(handler: (nextPath: string) => void) {
  sessionRedirectHandler = handler;
}

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const next = `${window.location.pathname}${window.location.search}`;
  if (sessionRedirectHandler) {
    sessionRedirectHandler(next);
    return;
  }
  window.location.href = `/login?next=${encodeURIComponent(next)}`;
}

export async function apiFetch<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<ApiFetchResult<T>> {
  try {
    const response = await fetch(input, init);
    let payload: { data?: T; error?: string; code?: string } = {};

    try {
      payload = (await response.json()) as { data?: T; error?: string; code?: string };
    } catch {
      if (!response.ok) {
        return {
          ok: false,
          error: 'Request failed.',
          status: response.status,
        };
      }
    }

    if (response.status === 401 && payload.code === 'UNAUTHORIZED') {
      redirectToLogin();
      return {
        ok: false,
        error: 'Session expired. Please sign in again.',
        code: 'UNAUTHORIZED',
        status: 401,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: payload.error ?? 'Request failed.',
        code: payload.code,
        status: response.status,
      };
    }

    return { ok: true, data: payload.data as T, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error.',
      status: 0,
    };
  }
}
