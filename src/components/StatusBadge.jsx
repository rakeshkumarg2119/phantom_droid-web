import './StatusBadge.css'

const LABELS = {
  idle: 'no session',
  connecting: 'establishing link',
  connected: 'live',
  error: 'link failed'
}

export default function StatusBadge({ status }) {
  return (
    <div className={`status-badge status-badge--${status}`}>
      <span className="status-badge__dot" />
      <span className="status-badge__label">{LABELS[status] || status}</span>
    </div>
  )
}
