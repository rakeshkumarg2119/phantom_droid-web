// Thin wrapper around the FastAPI WebSocket relay.
// Message shape (matches server/main.py):
//   { type: 'join', room }
//   { type: 'joined', room }
//   { type: 'offer', sdp }
//   { type: 'answer', sdp }
//   { type: 'ice', candidate }
//   { type: 'peer-left' }
//   { type: 'error', message }

export default class SignalingClient {
  constructor(url) {
    this.url = url
    this.ws = null
    this.handlers = new Map()
  }

  on(type, handler) {
    this.handlers.set(type, handler)
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => resolve()
      this.ws.onerror = (err) => reject(err)

      this.ws.onmessage = (event) => {
        let msg
        try {
          msg = JSON.parse(event.data)
        } catch {
          return
        }
        const handler = this.handlers.get(msg.type)
        if (handler) handler(msg)
      }

      this.ws.onclose = () => {
        const handler = this.handlers.get('closed')
        if (handler) handler()
      }
    })
  }

  send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload))
    }
  }

  joinRoom(room) {
    this.send({ type: 'join', room, role: 'browser' })
  }

  sendAnswer(sdp) {
    this.send({ type: 'answer', sdp })
  }

  sendIceCandidate(candidate) {
    this.send({ type: 'ice-candidate', candidate })
  }

  close() {
    if (this.ws) this.ws.close()
  }
}