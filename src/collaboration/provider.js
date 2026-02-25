import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { WebrtcProvider } from 'y-webrtc'

const WS_URL = 'wss://demos.yjs.dev/ws'
const SIGNALING_SERVERS = ['wss://signaling.yjs.dev']

export function createProvider(roomId) {
  const ydoc = new Y.Doc()
  const roomName = `syncink-${roomId}`

  // Primary: WebSocket provider (reliable, works cross-browser/cross-network)
  const wsProvider = new WebsocketProvider(WS_URL, roomName, ydoc)
  const awareness = wsProvider.awareness

  // Secondary: WebRTC provider (P2P, lower latency when available)
  // Uses the SAME ydoc and awareness so both providers sync the same data
  let rtcProvider = null
  try {
    rtcProvider = new WebrtcProvider(roomName, ydoc, {
      signaling: SIGNALING_SERVERS,
      awareness,
      maxConns: 20,
      filterBcConns: true
    })
  } catch (e) {
    console.warn('WebRTC provider failed to initialize:', e)
  }

  // Connection status tracking
  let status = 'connecting'
  const statusListeners = []
  let synced = false
  const syncListeners = []

  function setStatus(newStatus) {
    if (status === newStatus) return
    // Don't downgrade from connected
    if (status === 'connected' && newStatus === 'connecting') return
    status = newStatus
    statusListeners.forEach(fn => fn(status))
  }

  function markSynced() {
    if (synced) return
    synced = true
    setStatus('connected')
    syncListeners.forEach(fn => fn())
    syncListeners.length = 0
  }

  // WebSocket status events
  wsProvider.on('status', (event) => {
    if (event.status === 'connected') {
      setStatus('connected')
    }
  })

  wsProvider.on('sync', (isSynced) => {
    if (isSynced) markSynced()
  })

  // WebRTC synced as bonus
  if (rtcProvider) {
    rtcProvider.on('synced', (s) => {
      const ok = typeof s === 'boolean' ? s : s && s.synced !== false
      if (ok) markSynced()
    })
  }

  return {
    ydoc,
    provider: wsProvider,
    rtcProvider,
    awareness,

    get status() { return status },
    get synced() { return synced },

    onStatusChange(fn) {
      statusListeners.push(fn)
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
      wsProvider.destroy()
      if (rtcProvider) rtcProvider.destroy()
      ydoc.destroy()
    }
  }
}
