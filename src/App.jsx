import { useCallback, useRef, useState } from 'react'
import RoomJoin from './components/RoomJoin.jsx'
import VideoStream from './components/VideoStream.jsx'
import SignalingClient from './services/SignalingClient.js'
import WebRTCClient from './services/WebRTCClient.js'
import { SIGNAL_URL } from './config.js'
import './App.css'

export default function App() {
  const [status, setStatus] = useState('idle') // idle | connecting | connected | error
  const [error, setError] = useState(null)
  const [stream, setStream] = useState(null)
  const [remoteResolution, setRemoteResolution] = useState({ width: 1080, height: 2400 })

  const signalingRef = useRef(null)
  const webrtcRef = useRef(null)

  const teardown = useCallback(() => {
    webrtcRef.current?.close()
    signalingRef.current?.close()
    webrtcRef.current = null
    signalingRef.current = null
    setStream(null)
    setStatus('idle')
    setError(null)
  }, [])

  const handleJoin = useCallback(async (code) => {
    setStatus('connecting')
    setError(null)

    const signaling = new SignalingClient(SIGNAL_URL)
    signalingRef.current = signaling

    signaling.on('error', (msg) => {
      setStatus('error')
      setError(msg.message || 'room not found')
    })

    signaling.on('peer-left', () => {
      teardown()
    })

    signaling.on('closed', () => {
      setStatus((prev) => (prev === 'connected' ? 'error' : prev))
    })

    try {
      await signaling.connect()
    } catch {
      setStatus('error')
      setError('could not reach signaling server')
      return
    }

    const webrtc = new WebRTCClient(signaling)
    webrtcRef.current = webrtc

    webrtc.onTrack = (remoteStream) => {
      setStream(remoteStream)
      setStatus('connected')
    }

    webrtc.onRemoteResolution = (resolution) => {
      setRemoteResolution(resolution)
    }

    webrtc.onConnectionState = (state) => {
      if (state === 'failed' || state === 'disconnected') {
        setStatus('error')
        setError('link dropped')
      }
    }

    signaling.joinRoom(code)
  }, [teardown])

  return (
    <div className="app">
      {status === 'connected' && stream ? (
        <VideoStream
          stream={stream}
          remoteResolution={remoteResolution}
          webrtcClient={webrtcRef.current}
          onDisconnect={teardown}
        />
      ) : (
        <RoomJoin status={status} error={error} onJoin={handleJoin} />
      )}
    </div>
  )
}
