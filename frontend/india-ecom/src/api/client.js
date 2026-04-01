const BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? "http://localhost:5000" : "");

if (!BASE && import.meta.env.PROD) {
  throw new Error('VITE_API_BASE is not configured for production build');
}

const storedToken = localStorage.getItem("token");
let token = storedToken && storedToken !== 'null' && storedToken !== 'undefined' ? storedToken : null;

const isRemoteApi = Boolean(BASE) && !/localhost|127\.0\.0\.1/i.test(BASE);
let warmupInFlight = null;
export const BACKEND_WARMUP_EVENT = 'backend-warmup-status';

const notifyWarmupStatus = (status, detail = {}) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(BACKEND_WARMUP_EVENT, {
      detail: {
        status,
        ...detail,
      },
    })
  );
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const pingHealth = async (timeoutMs = 12000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BASE}/api/health`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const warmupBackend = async ({ attempts = 3 } = {}) => {
  if (!isRemoteApi) {
    return true;
  }

  if (warmupInFlight) {
    return warmupInFlight;
  }

  notifyWarmupStatus('started', { attempts });

  warmupInFlight = (async () => {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const healthy = await pingHealth();
      if (healthy) {
        notifyWarmupStatus('completed', { ok: true, attempt });
        return true;
      }

      if (attempt < attempts) {
        await delay(1000 * attempt);
      }
    }

    notifyWarmupStatus('completed', { ok: false, attempt: attempts });
    return false;
  })().finally(() => {
    warmupInFlight = null;
  });

  return warmupInFlight;
};

export const setToken = (t) => {
  token = t || null;

  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
};
export async function api(path, opts = {}) {
  const { __coldStartRetried = false, ...fetchOpts } = opts;
  const method = (fetchOpts.method || 'GET').toUpperCase();

  const headers = { 
    'Content-Type': 'application/json', 
    ...(fetchOpts.headers || {}) 
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  
  try {
    const res = await fetch(`${BASE}${path}`, { 
      credentials: 'include', // Use 'include' for cross-origin cookie support
      ...fetchOpts,
      headers 
    });
    
    // Handle non-2xx responses before parsing
    if (!res.ok) {
      if (isRemoteApi && method === 'GET' && !__coldStartRetried && [502, 503, 504].includes(res.status)) {
        await warmupBackend();
        return api(path, { ...fetchOpts, __coldStartRetried: true });
      }

      const error = await res.json().catch(() => ({ 
        message: res.statusText 
      }));
      throw error;
    }
    
    return await res.json();
  } catch (error) {
    if (isRemoteApi && method === 'GET' && !__coldStartRetried) {
      await warmupBackend();
      return api(path, { ...fetchOpts, __coldStartRetried: true });
    }

    // Network errors or parse failures
    if (!error.message) {
      throw { message: 'Network request failed' };
    }
    throw error;
  }
}