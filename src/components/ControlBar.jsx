import './ControlBar.css'

export default function ControlBar({ visible, onGlobalAction, onToggleFullscreen, onDisconnect }) {
  return (
    <div className={`control-bar ${visible ? 'control-bar--visible' : ''}`}>
      <button className="control-bar__btn" onClick={() => onGlobalAction('back')} title="Back">
        ‹
      </button>
      <button className="control-bar__btn" onClick={() => onGlobalAction('home')} title="Home">
        ●
      </button>
      <button className="control-bar__btn" onClick={() => onGlobalAction('recents')} title="Recents">
        ▢
      </button>
      <span className="control-bar__divider" />
      <button className="control-bar__btn" onClick={() => onGlobalAction('rotate_portrait')} title="Force portrait">
        ⬍
      </button>
      <button className="control-bar__btn" onClick={() => onGlobalAction('rotate_landscape')} title="Force landscape">
        ⬌
      </button>
      <span className="control-bar__divider" />
      <button className="control-bar__btn" onClick={onToggleFullscreen} title="Fullscreen">
        ⛶
      </button>
      <button className="control-bar__btn control-bar__btn--danger" onClick={onDisconnect} title="Disconnect">
        ✕
      </button>
    </div>
  )
}