/**
 * Proxies /api/* to BACKEND_URL (e.g. ngrok) from the server.
 * Browser → same-origin /api → no CORS. Ngrok skip header is added server-side.
 */
export default async function handler(req, res) {
  const backend = process.env.BACKEND_URL
  if (!backend) {
    return res.status(500).json({
      error:
        'Set BACKEND_URL in Vercel (e.g. https://xxxx.ngrok-free.dev — no trailing slash)',
    })
  }
  const base = backend.replace(/\/$/, '')
  const target = `${base}${req.url}`

  const upstreamHeaders = {
    'ngrok-skip-browser-warning': 'true',
    accept: req.headers.accept || 'application/json',
  }
  if (req.headers['content-type']) {
    upstreamHeaders['content-type'] = req.headers['content-type']
  }

  const opts = {
    method: req.method,
    headers: upstreamHeaders,
  }

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body != null) {
    opts.body =
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    if (!upstreamHeaders['content-type']) {
      upstreamHeaders['content-type'] = 'application/json'
    }
  }

  try {
    const r = await fetch(target, opts)
    const buf = Buffer.from(await r.arrayBuffer())
    res.status(r.status)
    r.headers.forEach((value, key) => {
      const lower = key.toLowerCase()
      if (
        lower === 'transfer-encoding' ||
        lower === 'connection' ||
        lower === 'content-encoding'
      ) {
        return
      }
      res.setHeader(key, value)
    })
    res.send(buf)
  } catch (e) {
    res.status(502).json({ error: String(e?.message || e) })
  }
}
