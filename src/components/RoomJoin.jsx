import { useState } from 'react'
import StatusBadge from './StatusBadge.jsx'
import './RoomJoin.css'

export default function RoomJoin({ status, error, onJoin }) {
  const [code, setCode] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length > 0) onJoin(trimmed)
  }

  return (
    <div className="room-join">
      <div className="room-join__scanlines" aria-hidden="true" />
      <div className="room-join__panel">
        <div className="room-join__mark">👻</div>
        <h1 className="room-join__title">PHANTOM DROID</h1>
        <p className="room-join__tagline">control what you can't see</p>

        <form className="room-join__form" onSubmit={submit}>
          <label className="room-join__label" htmlFor="room-code">room code</label>
          <input
            id="room-code"
            className="room-join__input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="4F9K2"
            maxLength={8}
            autoFocus
            autoComplete="off"
            spellCheck="false"
            disabled={status === 'connecting'}
          />
          <button
            className="room-join__submit"
            type="submit"
            disabled={status === 'connecting' || code.trim().length === 0}
          >
            {status === 'connecting' ? 'connecting…' : 'connect'}
          </button>
        </form>

        <StatusBadge status={status} />

        {error && <p className="room-join__error">{error}</p>}

        <p className="room-join__hint">
          find the code on the phone's screen before it goes dark.
        </p>
      </div>
    </div>
  )
}
