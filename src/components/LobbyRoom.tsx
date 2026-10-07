import { useLobby } from '../livekit/useLobby'
import { ParticipantTile } from './ParticipantTile'
import { Controls } from './Controls'

interface LobbyRoomProps {
  serverUrl: string
  token: string
  roomName: string
  displayName: string
  onLeave: () => void
}

export function LobbyRoom({
  serverUrl,
  token,
  roomName,
  displayName,
  onLeave,
}: LobbyRoomProps) {
  const lobby = useLobby(serverUrl, token, onLeave)
  const { room, participants, speakingIds, status, error, canPlaybackAudio } = lobby

  const statusLabel =
    status === 'connecting'
      ? 'Conectando…'
      : status === 'connected'
        ? `${participants.length} en la sala`
        : 'Desconectado'

  return (
    <div className="lobby">
      <header className="lobby-header">
        <div className="lobby-title">
          <h2>#{roomName}</h2>
          <span className={`status status-${status}`}>{statusLabel}</span>
        </div>
        <span className="me">👤 {displayName}</span>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="grid">
        {participants.map((participant) => (
          <ParticipantTile
            key={participant.identity}
            participant={participant}
            isLocal={participant.identity === room.localParticipant.identity}
            isSpeaking={speakingIds.includes(participant.identity)}
          />
        ))}
      </div>

      {!canPlaybackAudio && (
        <button className="audio-unlock" onClick={lobby.enableAudio}>
          🔊 Toca para activar el audio
        </button>
      )}

      <Controls
        micEnabled={lobby.micEnabled}
        onToggleMic={lobby.toggleMic}
        onLeave={lobby.leave}
      />
    </div>
  )
}
