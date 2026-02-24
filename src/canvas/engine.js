import { pressureToWidth, deserializeStroke } from './stroke.js'

export function createEngine(canvas, effectsCanvas) {
  const ctx = canvas.getContext('2d', { desynchronized: true })
  const effectsCtx = effectsCanvas.getContext('2d')

  // Offscreen bitmap cache for committed strokes
  const offscreen = document.createElement('canvas')
  const offCtx = offscreen.getContext('2d')

  let dirty = true
  let strokesDirty = true
  let running = true
  let inProgressStroke = null
  let backgroundColor = '#ffffff'

  // Data sources (set externally)
  let getCommittedStrokes = () => []
  let getAwarenessStates = () => new Map()
  let currentPageId = null

  function resize() {
    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth
    const h = window.innerHeight

    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.scale(dpr, dpr)

    effectsCanvas.width = w * dpr
    effectsCanvas.height = h * dpr
    effectsCanvas.style.width = w + 'px'
    effectsCanvas.style.height = h + 'px'
    effectsCtx.scale(dpr, dpr)

    offscreen.width = w * dpr
    offscreen.height = h * dpr
    offCtx.scale(dpr, dpr)

    strokesDirty = true
    dirty = true
  }

  function drawStrokeToCtx(targetCtx, stroke) {
    const pts = stroke.points
    if (pts.length < 2) return

    targetCtx.lineCap = 'round'
    targetCtx.lineJoin = 'round'
    targetCtx.strokeStyle = stroke.color

    // Draw each segment individually for variable width (pressure)
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]
      const curr = pts[i]
      const w = pressureToWidth(stroke.width, (prev.p + curr.p) / 2)

      targetCtx.beginPath()
      targetCtx.lineWidth = w
      targetCtx.moveTo(prev.x, prev.y)
      targetCtx.lineTo(curr.x, curr.y)
      targetCtx.stroke()
    }
  }

  function drawLaser(targetCtx, laserData, now) {
    const pts = laserData.points
    if (!pts || pts.length < 2) return

    const LASER_LIFETIME = 2000

    targetCtx.lineCap = 'round'
    targetCtx.lineJoin = 'round'
    targetCtx.lineWidth = 3

    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]
      const curr = pts[i]
      const age = now - curr.t
      if (age > LASER_LIFETIME) continue

      const alpha = 1 - age / LASER_LIFETIME
      targetCtx.globalAlpha = alpha
      targetCtx.strokeStyle = laserData.color || '#FF0000'
      targetCtx.beginPath()
      targetCtx.moveTo(prev.x, prev.y)
      targetCtx.lineTo(curr.x, curr.y)
      targetCtx.stroke()
    }
    targetCtx.globalAlpha = 1
  }

  function drawCursor(targetCtx, cursor, user) {
    if (!cursor || cursor.pageId !== currentPageId) return

    // Draw cursor dot
    targetCtx.beginPath()
    targetCtx.arc(cursor.x, cursor.y, 6, 0, Math.PI * 2)
    targetCtx.fillStyle = user.color
    targetCtx.fill()
    targetCtx.strokeStyle = '#ffffff'
    targetCtx.lineWidth = 2
    targetCtx.stroke()

    // Draw name label
    targetCtx.font = '11px -apple-system, sans-serif'
    targetCtx.fillStyle = user.color
    targetCtx.fillText(user.name, cursor.x + 10, cursor.y - 10)
  }

  function renderFrame() {
    if (!running) return

    const w = window.innerWidth
    const h = window.innerHeight
    const now = Date.now()

    // Check if we need to render lasers/cursors (always dirty if awareness active)
    let hasLasers = false
    const states = getAwarenessStates()
    for (const [, state] of states) {
      if (state.laser && state.laser.points && state.laser.points.length > 0) {
        hasLasers = true
        break
      }
    }

    if (!dirty && !strokesDirty && !inProgressStroke && !hasLasers) {
      requestAnimationFrame(renderFrame)
      return
    }

    // Clear main canvas
    ctx.clearRect(0, 0, w, h)

    // Layer 1: Background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, w, h)

    // Layer 2: Committed strokes (from offscreen cache)
    if (strokesDirty) {
      offCtx.clearRect(0, 0, w, h)
      const strokes = getCommittedStrokes()
      for (const stroke of strokes) {
        drawStrokeToCtx(offCtx, stroke)
      }
      strokesDirty = false
    }
    // Reset transform to draw offscreen bitmap pixel-for-pixel (both are DPR-scaled)
    const dpr = window.devicePixelRatio || 1
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.drawImage(offscreen, 0, 0)
    ctx.restore()

    // Layer 2.5: Remote cursors and lasers
    for (const [clientId, state] of states) {
      if (state.user) {
        drawCursor(ctx, state.cursor, state.user)
      }
      if (state.laser) {
        drawLaser(ctx, state.laser, now)
      }
    }

    // Layer 3: In-progress local stroke
    if (inProgressStroke && inProgressStroke.points.length > 0) {
      drawStrokeToCtx(ctx, inProgressStroke)
    }

    dirty = false
    requestAnimationFrame(renderFrame)
  }

  // Initial setup
  resize()
  window.addEventListener('resize', resize)
  requestAnimationFrame(renderFrame)

  return {
    get ctx() { return ctx },
    get effectsCtx() { return effectsCtx },
    get width() { return window.innerWidth },
    get height() { return window.innerHeight },

    setInProgressStroke(stroke) {
      inProgressStroke = stroke
      dirty = true
    },

    setStrokeSource(fn) {
      getCommittedStrokes = fn
    },

    setAwarenessSource(fn) {
      getAwarenessStates = fn
    },

    setCurrentPage(pageId) {
      currentPageId = pageId
      strokesDirty = true
      dirty = true
    },

    setBackground(color) {
      backgroundColor = color
      dirty = true
    },

    markStrokesDirty() {
      strokesDirty = true
      dirty = true
    },

    markDirty() {
      dirty = true
    },

    destroy() {
      running = false
      window.removeEventListener('resize', resize)
    }
  }
}
