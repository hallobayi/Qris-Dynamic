import type { ApiResponse, QrisDynamicResponse } from 'shared'

// In dev, Vite proxies /api -> http://localhost:3000 (see vite.config.ts).
// In production, the Hono server serves the static client and the API from
// the same origin, so a relative path also works.
const API_BASE = import.meta.env.VITE_SERVER_URL ?? ''

export async function generateDynamicQrisRequest(qris: string, amount: number): Promise<string> {
  const res = await fetch(`${API_BASE}/api/qris/dynamic`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ qris, amount }),
  })
  const json = (await res.json()) as ApiResponse<QrisDynamicResponse>
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error ?? `Request failed with status ${res.status}`)
  }
  return json.data.qris
}
