interface ControlsProps {
  micEnabled: boolean
  onToggleMic: () => void
  onLeave: () => void
}

export function Controls({ micEnabled, onToggleMic, onLeave }: ControlsProps) {
  return (
    <div className="controls">
      <button
        className={`ctrl ${micEnabled ? 'ctrl-on' : 'ctrl-off'}`}
        onClick={onToggleMic}
        type="button"
      >
        {micEnabled ? '🎙️ Micrófono ON' : '🔇 Micrófono OFF'}
      </button>
      <button className="ctrl ctrl-leave" onClick={onLeave} type="button">
        📴 Salir
      </button>
    </div>
  )
}
