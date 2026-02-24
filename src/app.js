import { createProvider } from './collaboration/provider.js'
import { setupAwareness } from './collaboration/awareness.js'
import {
  initDocument, getPageIds, getPageStrokes, createPage,
  addStroke, clearPageStrokes, triggerExplosion, triggerChaos,
  getMeta
} from './collaboration/schema.js'
import { deserializeStroke } from './canvas/stroke.js'
import { createEngine } from './canvas/engine.js'
import { createInput } from './canvas/input.js'
import { createLaserManager } from './canvas/laser.js'
import { createToolbar } from './ui/toolbar.js'
import { playExplosion, playChaos } from './ui/effects.js'
import { showToast } from './ui/toast.js'
import { startVoice, stopVoice, toggleMute, isVoiceActive } from './voice/voice.js'
import { t } from './i18n/i18n.js'
import { generateId } from './utils/id.js'

export function initApp(roomId, nickname, userColor) {
  const userId = generateId()

  // 1. Setup collaboration
  const collab = createProvider(roomId)
  const { ydoc, provider, awareness } = collab

  // Initialize Y.js document schema
  initDocument(ydoc)

  // Setup awareness
  const awarenessManager = setupAwareness(awareness, {
    name: nickname,
    color: userColor,
    id: userId
  })

  // 2. Setup canvas
  const canvas = document.getElementById('whiteboard')
  const effectsCanvas = document.getElementById('effects-overlay')
  const engine = createEngine(canvas, effectsCanvas)

  // Current page state
  let currentPageId = getPageIds(ydoc)[0] || 'p1'
  engine.setCurrentPage(currentPageId)

  // Provide stroke data source to engine
  engine.setStrokeSource(() => {
    const strokes = getPageStrokes(ydoc, currentPageId)
    if (!strokes) return []
    const result = []
    for (let i = 0; i < strokes.length; i++) {
      result.push(deserializeStroke(strokes.get(i)))
    }
    return result
  })

  // Provide awareness data source to engine
  engine.setAwarenessSource(() => {
    const states = new Map()
    awareness.getStates().forEach((state, clientId) => {
      if (clientId !== awareness.clientID) {
        states.set(clientId, state)
      }
    })
    return states
  })

  // Observe Y.js stroke changes → re-render
  function observeCurrentPage() {
    const strokes = getPageStrokes(ydoc, currentPageId)
    if (strokes) {
      strokes.observe(() => {
        engine.markStrokesDirty()
      })
    }
  }
  observeCurrentPage()

  // Observe awareness changes → re-render
  awareness.on('change', () => {
    engine.markDirty()
  })

  // 3. Setup laser manager
  const laserManager = createLaserManager(awareness, userId)
  laserManager.start()

  // 4. Setup input handler
  const input = createInput(canvas, {
    userId,
    userColor,
    onStrokeComplete(stroke) {
      addStroke(ydoc, currentPageId, stroke)
    },
    onLaserUpdate(points) {
      laserManager.updatePoints(points, userColor)
    },
    engine
  })

  // 5. Setup toolbar
  const toolbarContainer = document.getElementById('toolbar-container')
  const toolbar = createToolbar(toolbarContainer, {
    roomId,
    onPageSwitch(pageId) {
      switchPage(pageId)
    },
    onPageCreate() {
      const newPageId = createPage(ydoc)
      switchPage(newPageId)
      showToast(t('toast.pageCreated'), 'success')
    },
    onVoiceToggle(enabled) {
      if (enabled) {
        startVoice(provider)
      } else {
        stopVoice()
      }
    },
    onReplay() {
      replayStrokes()
    },
    onClear() {
      triggerChaos(ydoc)
    }
  })

  // Connection status
  collab.onStatusChange((status) => {
    toolbar.updateStatus(status)
    if (status === 'connected') {
      showToast(t('toast.connected'), 'success')
    } else if (status === 'disconnected') {
      showToast(t('toast.disconnected'), 'error')
    }
  })

  // Track users joining/leaving
  let previousUsers = new Set()
  awarenessManager.onUsersChange((users) => {
    toolbar.updateMembers(users)

    const currentUserIds = new Set(users.map(u => u.id))
    for (const user of users) {
      if (!previousUsers.has(user.id) && !user.isLocal) {
        showToast(t('toast.userJoined', { name: user.name }), 'info')
      }
    }
    for (const id of previousUsers) {
      if (!currentUserIds.has(id)) {
        // User left — we don't have their name anymore, so just mark it
      }
    }
    previousUsers = currentUserIds
  })

  // Update pages UI
  function updatePagesUI() {
    const pageIds = getPageIds(ydoc)
    toolbar.updatePages(pageIds, currentPageId)
  }

  // Observe page order changes
  const pageOrder = ydoc.getMap('pages').get('pageOrder')
  if (pageOrder) {
    pageOrder.observe(updatePagesUI)
  }
  updatePagesUI()

  // Initialize members display
  toolbar.updateMembers(awarenessManager.getOnlineUsers())

  // 6. Page switching
  function switchPage(pageId) {
    currentPageId = pageId
    engine.setCurrentPage(pageId)
    observeCurrentPage()
    updatePagesUI()
    awarenessManager.updateCursor(null, null, pageId)
  }

  // 7. Special effects: observe meta changes
  const meta = getMeta(ydoc)
  let lastExplosion = meta.get('explosionTrigger') || 0
  let lastChaos = meta.get('chaosTrigger') || 0

  meta.observe(() => {
    const newExplosion = meta.get('explosionTrigger') || 0
    const newChaos = meta.get('chaosTrigger') || 0

    if (newExplosion > lastExplosion) {
      lastExplosion = newExplosion
      showToast(t('toast.explosion'), 'warning')
      playExplosion(engine.effectsCtx, engine.width, engine.height)
    }

    if (newChaos > lastChaos) {
      lastChaos = newChaos
      showToast(t('toast.chaos'), 'warning')
      playChaos(engine.effectsCtx, engine.width, engine.height, () => {
        clearPageStrokes(ydoc, currentPageId)
      })
    }
  })

  // Explosion trigger from edge taps
  input.setExplosionTrigger(() => {
    triggerExplosion(ydoc)
  })

  // 8. Stroke replay
  function replayStrokes() {
    const strokes = getPageStrokes(ydoc, currentPageId)
    if (!strokes || strokes.length === 0) return

    showToast(t('toast.replaying'), 'info')

    const allStrokes = []
    for (let i = 0; i < strokes.length; i++) {
      allStrokes.push(deserializeStroke(strokes.get(i)))
    }

    // Sort by timestamp
    allStrokes.sort((a, b) => a.timestamp - b.timestamp)

    const originalSource = engine.setStrokeSource
    let replayIndex = 0

    // Override stroke source to show progressive replay
    engine.setStrokeSource(() => allStrokes.slice(0, replayIndex))
    engine.markStrokesDirty()

    const interval = setInterval(() => {
      replayIndex++
      engine.markStrokesDirty()

      if (replayIndex > allStrokes.length) {
        clearInterval(interval)
        // Restore normal stroke source
        engine.setStrokeSource(() => {
          const s = getPageStrokes(ydoc, currentPageId)
          if (!s) return []
          const result = []
          for (let i = 0; i < s.length; i++) {
            result.push(deserializeStroke(s.get(i)))
          }
          return result
        })
        engine.markStrokesDirty()
      }
    }, 300)
  }

  // Cursor tracking
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return
    const rect = canvas.getBoundingClientRect()
    awarenessManager.updateCursor(
      e.clientX - rect.left,
      e.clientY - rect.top,
      currentPageId
    )
  })

  return {
    destroy() {
      input.destroy()
      laserManager.destroy()
      engine.destroy()
      awarenessManager.destroy()
      stopVoice()
      collab.destroy()
    }
  }
}
