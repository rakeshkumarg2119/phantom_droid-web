import { ICE_SERVERS } from '../config.js'

// Browser is always the answerer — the phone creates the room and offers.
export default class WebRTCClient {
  constructor(signaling) {
    this.signaling = signaling
    this.pc = null
    this.dataChannel = null
    this.onTrack = null // (MediaStream) => void
    this.onDataChannelOpen = null // () => void
    this.onRemoteResolution = null // ({ width, height }) => void
    this.onConnectionState = null // (state) => void

    this.signaling.on('offer', (msg) => this._handleOffer(msg.sdp))
    this.signaling.on('ice-candidate', (msg) => this._handleRemoteIce(msg.candidate))
  }

  _createPeerConnection() {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.sendIceCandidate(event.candidate)
      }
    }

    pc.ontrack = (event) => {
      if (this.onTrack) this.onTrack(event.streams[0])
    }

    pc.ondatachannel = (event) => {
      this._bindDataChannel(event.channel)
    }

    pc.onconnectionstatechange = () => {
      if (this.onConnectionState) this.onConnectionState(pc.connectionState)
    }

    this.pc = pc
    return pc
  }

  _bindDataChannel(channel) {
    this.dataChannel = channel
    channel.onopen = () => {
      if (this.onDataChannelOpen) this.onDataChannelOpen()
    }
    channel.onmessage = (event) => {
      let msg
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }
      if (msg.type === 'resolution' && this.onRemoteResolution) {
        this.onRemoteResolution({ width: msg.width, height: msg.height })
      }
    }
  }

  async _handleOffer(sdp) {
    const pc = this._createPeerConnection()
    await pc.setRemoteDescription(new RTCSessionDescription(sdp))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    this.signaling.sendAnswer(pc.localDescription)
  }

  async _handleRemoteIce(candidate) {
    if (!candidate || !this.pc) return
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch {
      // candidate arrived before remote description — safe to drop
    }
  }

  // Sends an input event to the phone. Schema is consumed by
  // android-app/lib/input_handler.dart.
  sendInput(event) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(event))
    }
  }

  close() {
    if (this.dataChannel) this.dataChannel.close()
    if (this.pc) this.pc.close()
    this.pc = null
    this.dataChannel = null
  }
}