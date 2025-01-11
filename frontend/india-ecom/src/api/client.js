const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

let token = localStorage.getItem("token") || null;
export const setToken = (t) => {
  token = t;
  localStorage.setItem("token", t);
};
export async function api(path, opts = {}) {
  const headers = { 
    'Content-Type': 'application/json', 
    ...(opts.headers || {}) 
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  
  try {
    const res = await fetch(`${BASE}${path}`, { 
      credentials: 'include', // Use 'include' for cross-origin cookie support
      ...opts, 
      headers 
    });
    
    // Handle non-2xx responses before parsing
    if (!res.ok) {
      const error = await res.json().catch(() => ({ 
        message: res.statusText 
      }));
      throw error;
    }
    
    return await res.json();
  } catch (error) {
    // Network errors or parse failures
    if (!error.message) {
      throw { message: 'Network request failed' };
    }
    throw error;
  }
}