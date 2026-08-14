import { useEffect, useRef, useState } from 'react'
import InputMapper from '../services/InputMapper.js'
import ControlBar from './ControlBar.jsx'
import './VideoStream.css'

const CONTROLS_IDLE_MS = 2200

export default function VideoStream({ stream, remoteResolution, webrtcClient, onDisconnect }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const mapperRef = useRef(null)
  const idleTimer = useRef(null)
  const [controlsVisible, setControlsVisible] = useState(true)

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])

  useEffect(() => {
    if (!videoRef.current) return
    const mapper = new InputMapper(videoRef.current, remoteResolution, (event) =>
      webrtcClient.sendInput(event)
    )
    mapper.attach()
    mapperRef.current = mapper
    return () => mapper.detach()
  }, [webrtcClient])

  useEffect(() => {
    if (mapperRef.current) mapperRef.current.setRemoteResolution(remoteResolution)
  }, [remoteResolution])

  useEffect(() => {
    const resetIdle = () => {
      setControlsVisible(true)
      clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => setControlsVisible(false), CONTROLS_IDLE_MS)
    }
    resetIdle()
    window.addEventListener('mousemove', resetIdle)
    return () => {
      window.removeEventListener('mousemove', resetIdle)
      clearTimeout(idleTimer.current)
    }
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  const handleGlobalAction = (action) => {
    mapperRef.current?.sendGlobalAction(action)
  }

  return (
    <div className="video-stream" ref={containerRef}>
      <video ref={videoRef} className="video-stream__video" autoPlay playsInline muted={false} />
      <ControlBar
        visible={controlsVisible}
        onGlobalAction={handleGlobalAction}
        onToggleFullscreen={toggleFullscreen}
        onDisconnect={onDisconnect}
      />
    </div>
  )
}
