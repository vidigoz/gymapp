import type { Participant } from 'livekit-client'

interface ParticipantTileProps {
  participant: Participant
  isLocal: boolean
  isSpeaking: boolean
}

export function ParticipantTile({
  participant,
  isLocal,
  isSpeaking,
}: ParticipantTileProps) {
  const label = participant.name || participant.identity
  const initials = label.slice(0, 2).toUpperCase()

  return (
    <div className={`tile ${isSpeaking ? 'speaking' : ''}`}>
      <div className="avatar">{initials}</div>
      <div className="tile-name">
        {label}
        {isLocal && <span className="you"> (tú)</span>}
      </div>
      <div className="tile-mic" aria-label={participant.isMicrophoneEnabled ? 'Micrófono activo' : 'Micrófono en silencio'}>
        {participant.isMicrophoneEnabled ? '🎙️' : '🔇'}
      </div>
    </div>
  )
}
