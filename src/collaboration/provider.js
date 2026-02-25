import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

const SIGNALING_SERVERS = [
  'wss://signaling.yjs.dev'
]

export function createProvider(roomId) {
  const ydoc = new Y.Doc()
  const roomName = `syncink-${roomId}`

  const provider = new WebrtcProvider(roomName, ydoc, {
    signaling: SIGNALING_SERVERS,
    maxConns: 20,
    filterBcConns: true
  })

  const awareness = provider.awareness

  // Connection status tracking
  let status = 'connecting'
  const statusListeners = []

  provider.on('status', (event) => {
    // Don't downgrade from 'connected' to 'connecting'
    if (status === 'connected' && event.status === 'connecting') return
    status = event.status
    statusListeners.forEach(fn => fn(status))
  })

  let synced = false
  const syncListeners = []

  function markSynced() {
    if (synced) return
    synced = true
    status = 'connected'
    statusListeners.forEach(fn => fn(status))
    syncListeners.forEach(fn => fn())
    syncListeners.length = 0
  }

  // y-webrtc synced event: fires when initial sync with a peer completes
  provider.on('synced', (s) => {
    // Handle both boolean and { synced: boolean } formats
    const isSynced = typeof s === 'boolean' ? s : s && s.synced !== false
    if (isSynced) markSynced()
  })

  // Fallback: y-webrtc peers event — peer connected but synced may not fire
  provider.on('peers', () => {
    if (!synced) {
      setTimeout(() => markSynced(), 300)
    }
  })

  return {
    ydoc,
    provider,
    awareness,

    get status() { return status },
    get synced() { return synced },

    onStatusChange(fn) {
      statusListeners.push(fn)
      // Immediately notify with current status
      fn(status)
      return () => {
        const idx = statusListeners.indexOf(fn)
        if (idx !== -1) statusListeners.splice(idx, 1)
      }
    },

    onSynced(fn) {
      if (synced) {
        fn()
      } else {
        syncListeners.push(fn)
      }
    },

    destroy() {
      provider.destroy()
      ydoc.destroy()
    }
  }
}
