export interface JoinCredentials {
  token: string
  url: string
  room: string
  identity: string
}

/**
 * Pide a la Netlify Function (`/api/token`) un token de acceso de LiveKit.
 * En desarrollo, el plugin de Vite emula esa función; en producción la sirve Netlify.
 */
export async function fetchToken(room: string, name: string): Promise<JoinCredentials> {
  const response = await fetch('/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room, name }),
  })

  if (!response.ok) {
    let message = `Error ${response.status}`
    try {
      const data = (await response.json()) as { error?: string }
      if (data?.error) {
        message = data.error
      }
    } catch {
      // sin cuerpo JSON: conservamos el mensaje por defecto
    }
    throw new Error(message)
  }

  return (await response.json()) as JoinCredentials
}
