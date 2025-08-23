export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export const get = <T>(url: string) => api<T>(url);
export const post = <T>(url: string, body: unknown) => api<T>(url, { method: 'POST', body: JSON.stringify(body) });
export const patch = <T>(url: string, body: unknown) => api<T>(url, { method: 'PATCH', body: JSON.stringify(body) });