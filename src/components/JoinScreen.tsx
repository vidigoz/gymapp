import { useState, type FormEvent } from 'react'
import { fetchToken, type JoinCredentials } from '../livekit/useToken'

interface JoinScreenProps {
  onJoin: (credentials: JoinCredentials, name: string) => void
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function JoinScreen({ onJoin }: JoinScreenProps) {
  const [name, setName] = useState(() => localStorage.getItem('gym-name') ?? '')
  const [room, setRoom] = useState(() => localStorage.getItem('gym-room') ?? 'gym')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const cleanName = name.trim()
    const cleanRoom = slugify(room) || 'gym'

    if (!cleanName) {
      setError('Escribe tu nombre para entrar')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const credentials = await fetchToken(cleanRoom, cleanName)
      localStorage.setItem('gym-name', cleanName)
      localStorage.setItem('gym-room', cleanRoom)
      onJoin(credentials, cleanName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al entrar al lobby')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="join-screen" onSubmit={handleSubmit}>
      <div className="card">
        <h1>🎧 Gym Audio Lobby</h1>
        <p className="subtitle">
          Entra a una sala de voz y habla con tu banda mientras entrenan.
        </p>

        <label className="field">
          <span>Tu nombre</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej: Andrés"
            maxLength={24}
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span>Lobby</span>
          <input
            value={room}
            onChange={(event) => setRoom(event.target.value)}
            placeholder="Ej: gym"
            maxLength={32}
            autoComplete="off"
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Conectando…' : 'Entrar al lobby'}
        </button>

        <p className="hint">
          Comparte el mismo nombre de lobby con tus compañeros para quedar en la
          misma sala.
        </p>
      </div>
    </form>
  )
}
