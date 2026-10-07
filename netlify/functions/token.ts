import { AccessToken } from 'livekit-server-sdk'
import type { Config } from '@netlify/functions'

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

/**
 * Netlify Function: firma un token de acceso de LiveKit.
 * El API secret NUNCA viaja al navegador; solo se entrega el token de corta vida.
 */
export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405)
  }

  let payload: { room?: string; name?: string }
  try {
    payload = (await req.json()) as { room?: string; name?: string }
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }

  const room = (payload.room ?? '').trim()
  const name = (payload.name ?? '').trim()
  if (!room || !name) {
    return json({ error: 'Faltan los campos "room" o "name"' }, 400)
  }

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const url = process.env.LIVEKIT_URL
  if (!apiKey || !apiSecret || !url) {
    return json(
      { error: 'El servidor no tiene configuradas LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET' },
      500,
    )
  }

  // Identidad única por participante (así un mismo nombre puede entrar varias veces).
  const identity = `${name}-${Math.random().toString(36).slice(2, 8)}`

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    ttl: '2h',
  })
  at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true })

  const token = await at.toJwt()

  return json({ token, url, room, identity })
}

export const config: Config = {
  path: '/api/token',
}
