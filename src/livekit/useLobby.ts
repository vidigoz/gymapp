import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Room,
  RoomEvent,
  Track,
  type Participant,
  type RemoteTrack,
} from 'livekit-client'

export type LobbyStatus = 'connecting' | 'connected' | 'disconnected'

export interface UseLobbyResult {
  room: Room
  participants: Participant[]
  speakingIds: string[]
  status: LobbyStatus
  error: string | null
  micEnabled: boolean
  canPlaybackAudio: boolean
  toggleMic: () => void
  enableAudio: () => void
  leave: () => void
}

/**
 * Conecta con LiveKit, publica el micrófono y expone el estado de la sala.
 */
export function useLobby(
  serverUrl: string,
  token: string,
  onDisconnected?: () => void,
): UseLobbyResult {
  const room = useMemo(
    () => new Room({ dynacast: true, adaptiveStream: false }),
    [],
  )

  const [participants, setParticipants] = useState<Participant[]>([])
  const [speakingIds, setSpeakingIds] = useState<string[]>([])
  const [status, setStatus] = useState<LobbyStatus>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [micEnabled, setMicEnabled] = useState(false)
  const [canPlaybackAudio, setCanPlaybackAudio] = useState(true)

  const onDisconnectedRef = useRef(onDisconnected)
  useEffect(() => {
    onDisconnectedRef.current = onDisconnected
  }, [onDisconnected])

  useEffect(() => {
    let active = true
    const audioElements = new Map<string, HTMLMediaElement>()

    const syncParticipants = () => {
      if (!active) return
      setParticipants([
        room.localParticipant,
        ...Array.from(room.remoteParticipants.values()),
      ])
      setMicEnabled(room.localParticipant.isMicrophoneEnabled)
    }

    const handleTrackSubscribed = (track: RemoteTrack) => {
      if (track.kind !== Track.Kind.Audio) return
      const element = track.attach()
      element.autoplay = true
      document.body.appendChild(element)
      audioElements.set(track.sid ?? String(audioElements.size), element)
      // Intento explícito de reproducción. Si el navegador lo bloquea por su
      // política de autoplay, el estado se refleja en el botón "Activar audio".
      void element.play().catch(() => {
        // Reproducción bloqueada por el navegador: mostramos el botón.
        if (active) setCanPlaybackAudio(false)
      })
    }

    const handleTrackUnsubscribed = (track: RemoteTrack) => {
      const key = track.sid ?? ''
      const element = audioElements.get(key)
      if (element) {
        track.detach(element)
        element.remove()
        audioElements.delete(key)
      }
    }

    const handleActiveSpeakers = (speakers: Participant[]) => {
      setSpeakingIds(speakers.map((speaker) => speaker.identity))
    }

    room
      .on(RoomEvent.ParticipantConnected, syncParticipants)
      .on(RoomEvent.ParticipantDisconnected, syncParticipants)
      .on(RoomEvent.TrackMuted, syncParticipants)
      .on(RoomEvent.TrackUnmuted, syncParticipants)
      .on(RoomEvent.LocalTrackPublished, syncParticipants)
      .on(RoomEvent.LocalTrackUnpublished, syncParticipants)
      .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakers)
      .on(RoomEvent.AudioPlaybackStatusChanged, () =>
        setCanPlaybackAudio(room.canPlaybackAudio),
      )
      .on(RoomEvent.Disconnected, () => {
        if (!active) return
        setStatus('disconnected')
        onDisconnectedRef.current?.()
      })

    // Los navegadores solo permiten reproducir audio tras un gesto del usuario.
    // Desbloqueamos la salida en cuanto se toca/pulsa/teclea en cualquier parte.
    const unlockAudio = () => {
      void room
        .startAudio()
        .catch(() => {
          // Se reintentará con el botón "Activar audio" si sigue bloqueado.
        })
        .finally(() => {
          if (active) setCanPlaybackAudio(room.canPlaybackAudio)
        })
    }
    window.addEventListener('pointerdown', unlockAudio, { once: true })
    window.addEventListener('keydown', unlockAudio, { once: true })

    void (async () => {
      try {
        await room.connect(serverUrl, token)
        await room.localParticipant.setMicrophoneEnabled(true)
        try {
          await room.startAudio()
        } catch {
          // Algunos navegadores requieren un gesto del usuario: se resuelve
          // con el botón "Activar audio" que aparece si canPlaybackAudio=false.
        }
        if (!active) return
        setStatus('connected')
        setCanPlaybackAudio(room.canPlaybackAudio)
        syncParticipants()
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'No se pudo conectar al lobby')
        setStatus('disconnected')
      }
    })()

    return () => {
      active = false
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
      audioElements.forEach((element) => element.remove())
      audioElements.clear()
      room.removeAllListeners()
      room.disconnect()
    }
  }, [room, serverUrl, token])

  const toggleMic = useCallback(() => {
    const next = !room.localParticipant.isMicrophoneEnabled
    void room.localParticipant.setMicrophoneEnabled(next)
    setMicEnabled(next)
  }, [room])

  const enableAudio = useCallback(() => {
    void room
      .startAudio()
      .catch(() => {
        // Todavía bloqueado; el botón sigue visible.
      })
      .finally(() => setCanPlaybackAudio(room.canPlaybackAudio))
  }, [room])

  const leave = useCallback(() => {
    room.disconnect()
  }, [room])

  return {
    room,
    participants,
    speakingIds,
    status,
    error,
    micEnabled,
    canPlaybackAudio,
    toggleMic,
    enableAudio,
    leave,
  }
}
