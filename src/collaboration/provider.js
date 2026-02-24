import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

const SIGNALING_SERVERS = [
  'wss://signaling.yjs.dev',
  'wss://y-webrtc-signaling-eu.herokuapp.com',
  'wss://y-webrtc-signaling-us.herokuapp.com'
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
    status = event.status
    statusListeners.forEach(fn => fn(status))
  })

  provider.on('synced', (synced) => {
    if (synced) {
      status = 'connected'
      statusListeners.forEach(fn => fn(status))
    }
  })

  return {
    ydoc,
    provider,
    awareness,

    get status() { return status },

    onStatusChange(fn) {
      statusListeners.push(fn)
      // Immediately notify with current status
      fn(status)
      return () => {
        const idx = statusListeners.indexOf(fn)
        if (idx !== -1) statusListeners.splice(idx, 1)
      }
    },

    destroy() {
      provider.destroy()
      ydoc.destroy()
    }
  }
}
