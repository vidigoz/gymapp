import { useCallback, useState } from 'react'
import { JoinScreen } from './components/JoinScreen'
import { LobbyRoom } from './components/LobbyRoom'
import type { JoinCredentials } from './livekit/useToken'

interface Session {
  credentials: JoinCredentials
  displayName: string
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)

  const handleJoin = useCallback((credentials: JoinCredentials, displayName: string) => {
    setSession({ credentials, displayName })
  }, [])

  const handleLeave = useCallback(() => {
    setSession(null)
  }, [])

  return (
    <div className="app">
      {session ? (
        <LobbyRoom
          serverUrl={session.credentials.url}
          token={session.credentials.token}
          roomName={session.credentials.room}
          displayName={session.displayName}
          onLeave={handleLeave}
        />
      ) : (
        <JoinScreen onJoin={handleJoin} />
      )}
    </div>
  )
}
