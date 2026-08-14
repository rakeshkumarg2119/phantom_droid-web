// Converts browser DOM events into the JSON schema the Android
// AccessibilityService expects (android-app/lib/input_handler.dart).
//
// Message types sent over the data channel:
//   { type: 'tap', x, y }
//   { type: 'swipe', x1, y1, x2, y2, durationMs }
//   { type: 'scroll', x, y, deltaX, deltaY }
//   { type: 'text', value }
//   { type: 'key', code }        // ANDROID_KEYCODES below
//   { type: 'global', action }   // 'back' | 'home' | 'recents'

const ANDROID_KEYCODES = {
  Backspace: 67,
  Enter: 66,
  Escape: 111,
  ArrowUp: 19,
  ArrowDown: 20,
  ArrowLeft: 21,
  ArrowRight: 22,
  Tab: 61
}

const DRAG_THRESHOLD_PX = 6

export default class InputMapper {
  constructor(videoEl, remoteResolution, onInput) {
    this.videoEl = videoEl
    this.remoteResolution = remoteResolution // { width, height }
    this.onInput = onInput // (event) => void
    this.dragStart = null
    this.dragMoved = false

    this._onMouseDown = this._onMouseDown.bind(this)
    this._onMouseMove = this._onMouseMove.bind(this)
    this._onMouseUp = this._onMouseUp.bind(this)
    this._onWheel = this._onWheel.bind(this)
    this._onKeyDown = this._onKeyDown.bind(this)
  }

  setRemoteResolution(resolution) {
    this.remoteResolution = resolution
  }

  attach() {
    const el = this.videoEl
    el.addEventListener('mousedown', this._onMouseDown)
    window.addEventListener('mousemove', this._onMouseMove)
    window.addEventListener('mouseup', this._onMouseUp)
    el.addEventListener('wheel', this._onWheel, { passive: true })
    window.addEventListener('keydown', this._onKeyDown)
  }

  detach() {
    const el = this.videoEl
    el.removeEventListener('mousedown', this._onMouseDown)
    window.removeEventListener('mousemove', this._onMouseMove)
    window.removeEventListener('mouseup', this._onMouseUp)
    el.removeEventListener('wheel', this._onWheel)
    window.removeEventListener('keydown', this._onKeyDown)
  }

  // Maps a client-space (px) point on the <video> element to
  // phone-resolution coordinates, accounting for object-fit: contain letterboxing.
  _mapPoint(clientX, clientY) {
    const rect = this.videoEl.getBoundingClientRect()
    const { width: vw, height: vh } = this.remoteResolution || { width: rect.width, height: rect.height }

    const elementRatio = rect.width / rect.height
    const streamRatio = vw / vh

    let renderW = rect.width
    let renderH = rect.height
    let offsetX = 0
    let offsetY = 0

    if (elementRatio > streamRatio) {
      renderH = rect.height
      renderW = renderH * streamRatio
      offsetX = (rect.width - renderW) / 2
    } else {
      renderW = rect.width
      renderH = renderW / streamRatio
      offsetY = (rect.height - renderH) / 2
    }

    const localX = clientX - rect.left - offsetX
    const localY = clientY - rect.top - offsetY

    const x = Math.min(Math.max(localX / renderW, 0), 1) * vw
    const y = Math.min(Math.max(localY / renderH, 0), 1) * vh

    return { x: Math.round(x), y: Math.round(y) }
  }

  _onMouseDown(e) {
    e.preventDefault()
    this.dragStart = { clientX: e.clientX, clientY: e.clientY, time: Date.now() }
    this.dragMoved = false
  }

  _onMouseMove(e) {
    if (!this.dragStart) return
    const dx = e.clientX - this.dragStart.clientX
    const dy = e.clientY - this.dragStart.clientY
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) this.dragMoved = true
  }

  _onMouseUp(e) {
    if (!this.dragStart) return
    const start = this.dragStart
    this.dragStart = null

    if (!this.dragMoved) {
      const p = this._mapPoint(e.clientX, e.clientY)
      this.onInput({ type: 'tap', x: p.x, y: p.y })
      return
    }

    const p1 = this._mapPoint(start.clientX, start.clientY)
    const p2 = this._mapPoint(e.clientX, e.clientY)
    this.onInput({
      type: 'swipe',
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      durationMs: Math.max(Date.now() - start.time, 50)
    })
  }

  _onWheel(e) {
    const p = this._mapPoint(e.clientX, e.clientY)
    this.onInput({ type: 'scroll', x: p.x, y: p.y, deltaX: e.deltaX, deltaY: e.deltaY })
  }

  _onKeyDown(e) {
    if (ANDROID_KEYCODES[e.key] !== undefined) {
      e.preventDefault()
      this.onInput({ type: 'key', code: ANDROID_KEYCODES[e.key] })
      return
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      this.onInput({ type: 'text', value: e.key })
    }
  }

  sendGlobalAction(action) {
    this.onInput({ type: 'global', action })
  }
}
