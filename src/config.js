// Signaling server. Override at build/deploy time with VITE_SIGNAL_URL.
export const SIGNAL_URL = import.meta.env.VITE_SIGNAL_URL || 'ws://localhost:8000/ws'

// STUN/TURN. Add TURN creds via env when crossing networks.
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  ...(import.meta.env.VITE_TURN_URL
    ? [{
        urls: import.meta.env.VITE_TURN_URL,
        username: import.meta.env.VITE_TURN_USER,
        credential: import.meta.env.VITE_TURN_PASS
      }]
    : [])
]
