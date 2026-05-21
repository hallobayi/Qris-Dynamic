import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'
import {
  generateDynamicQris,
  QrisError,
  type ApiResponse,
  type QrisDynamicRequest,
  type QrisDynamicResponse,
} from 'shared'

const app = new Hono()

app.use('*', cors())

app.get('/healthz', (c) => c.json({ ok: true }))

app.get('/api', (c) => {
  const res: ApiResponse = { success: true, message: 'qris-dynamic API' }
  return c.json(res)
})

app.post('/api/qris/dynamic', async (c) => {
  let body: Partial<QrisDynamicRequest>
  try {
    body = await c.req.json<Partial<QrisDynamicRequest>>()
  } catch {
    const res: ApiResponse = { success: false, error: 'Invalid JSON body' }
    return c.json(res, 400)
  }

  const qris = typeof body.qris === 'string' ? body.qris.trim() : ''
  const amount = Number(body.amount)
  if (!qris) {
    const res: ApiResponse = { success: false, error: 'qris field is required' }
    return c.json(res, 400)
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    const res: ApiResponse = { success: false, error: 'amount must be a positive number' }
    return c.json(res, 400)
  }

  try {
    const dynamic = generateDynamicQris(qris, amount)
    const data: QrisDynamicResponse = { qris: dynamic, amount }
    const res: ApiResponse<QrisDynamicResponse> = { success: true, data }
    return c.json(res)
  } catch (err) {
    const message = err instanceof QrisError ? err.message : 'Failed to generate dynamic QRIS'
    const res: ApiResponse = { success: false, error: message }
    return c.json(res, 422)
  }
})

// Serve the built Vite client in production. The Docker image copies
// client/dist into ./public next to the server bundle.
const CLIENT_DIR = process.env.CLIENT_DIST_DIR ?? './public'
app.use('/*', serveStatic({ root: CLIENT_DIR }))
app.use('/*', serveStatic({ path: `${CLIENT_DIR}/index.html` }))

const port = Number(process.env.PORT ?? 3000)

export default {
  port,
  fetch: app.fetch,
}
