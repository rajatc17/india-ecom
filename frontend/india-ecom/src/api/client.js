const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

let token = localStorage.getItem("token") || null;
export const setToken = (t) => {
  token = t;
  localStorage.setItem("token", t);
};

export async function api(path, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    credentials: "same-origin",
    ...opts,
    headers,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw data || { message: res.statusText };
  return data;
}
