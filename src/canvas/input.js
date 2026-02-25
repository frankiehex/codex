import { createStroke, addPoint } from './stroke.js'
import { getCurrentTool } from './tools.js'
import { generateId } from '../utils/id.js'

export function createInput(canvas, { userId, userColor, onStrokeComplete, onLaserUpdate, engine }) {
  let activeStroke = null
  let startTime = 0
  let laserPoints = []
  const BASE_WIDTH = 3

  // Edge tap detection for explosion
  const edgeTaps = { left: [], right: [] }
  const EDGE_ZONE = 60
  const TAP_WINDOW = 3000
  const REQUIRED_TAPS = 5
  let onExplosionTrigger = null

  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  function handlePointerDown(e) {
    // Only pen and mouse can draw; touch is ignored for drawing
    if (e.pointerType === 'touch') {
      checkEdgeTap(e)
      return
    }

    e.preventDefault()
    try { canvas.setPointerCapture(e.pointerId) } catch (_) {}

    const pos = getCanvasPos(e)
    const tool = getCurrentTool()

    if (tool === 'pen') {
      startTime = Date.now()
      activeStroke = createStroke({
        id: generateId(),
        userId,
        color: userColor,
        width: BASE_WIDTH,
        tool: 'pen'
      })
      addPoint(activeStroke, pos.x, pos.y, e.pressure || 0.5, startTime)
      engine.setInProgressStroke(activeStroke)
    } else if (tool === 'laser') {
      laserPoints = [{ x: pos.x, y: pos.y, t: Date.now() }]
      if (onLaserUpdate) onLaserUpdate(laserPoints)
    }
  }

  function handlePointerMove(e) {
    if (e.pointerType === 'touch') return
    e.preventDefault()

    const pos = getCanvasPos(e)
    const tool = getCurrentTool()

    if (tool === 'pen' && activeStroke) {
      addPoint(activeStroke, pos.x, pos.y, e.pressure || 0.5, startTime)
      engine.markDirty()
    } else if (tool === 'laser' && laserPoints.length > 0) {
      laserPoints.push({ x: pos.x, y: pos.y, t: Date.now() })
      if (onLaserUpdate) onLaserUpdate([...laserPoints])
    }
  }

  function handlePointerUp(e) {
    if (e.pointerType === 'touch') return
    e.preventDefault()

    const tool = getCurrentTool()

    if (tool === 'pen' && activeStroke) {
      const pos = getCanvasPos(e)
      addPoint(activeStroke, pos.x, pos.y, e.pressure || 0.5, startTime)

      if (onStrokeComplete) {
        onStrokeComplete(activeStroke)
      }

      activeStroke = null
      engine.setInProgressStroke(null)
    } else if (tool === 'laser') {
      // Laser points fade naturally, no need to clear immediately
      laserPoints = []
    }
  }

  function handlePointerCancel(e) {
    activeStroke = null
    laserPoints = []
    engine.setInProgressStroke(null)
  }

  function checkEdgeTap(e) {
    const x = e.clientX
    const now = Date.now()

    if (x < EDGE_ZONE) {
      edgeTaps.left.push(now)
      edgeTaps.left = edgeTaps.left.filter(t => now - t < TAP_WINDOW)
    } else if (x > window.innerWidth - EDGE_ZONE) {
      edgeTaps.right.push(now)
      edgeTaps.right = edgeTaps.right.filter(t => now - t < TAP_WINDOW)
    }

    if (edgeTaps.left.length >= REQUIRED_TAPS && edgeTaps.right.length >= REQUIRED_TAPS) {
      if (onExplosionTrigger) onExplosionTrigger()
      edgeTaps.left = []
      edgeTaps.right = []
    }
  }

  canvas.addEventListener('pointerdown', handlePointerDown)
  canvas.addEventListener('pointermove', handlePointerMove)
  canvas.addEventListener('pointerup', handlePointerUp)
  canvas.addEventListener('pointercancel', handlePointerCancel)

  // Prevent default touch behavior
  canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false })
  canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false })

  return {
    setExplosionTrigger(fn) {
      onExplosionTrigger = fn
    },

    setUserColor(color) {
      userColor = color
    },

    destroy() {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerCancel)
    }
  }
}
