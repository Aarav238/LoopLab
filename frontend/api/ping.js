/** Sanity check that Vercel deploys /api routes. GET /api/ping */
module.exports = function handler(req, res) {
  res.status(200).json({ ok: true, route: 'ping' })
}
