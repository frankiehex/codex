export function setupAwareness(awareness, { name, color, id }) {
  // Set local user info
  awareness.setLocalStateField('user', { name, color, id })
  awareness.setLocalStateField('cursor', null)
  awareness.setLocalStateField('laser', null)

  const listeners = []

  awareness.on('change', () => {
    listeners.forEach(fn => fn(getOnlineUsers()))
  })

  function getOnlineUsers() {
    const users = []
    awareness.getStates().forEach((state, clientId) => {
      if (state.user) {
        users.push({
          clientId,
          ...state.user,
          cursor: state.cursor,
          laser: state.laser,
          isLocal: clientId === awareness.clientID
        })
      }
    })
    return users
  }

  function updateCursor(x, y, pageId) {
    awareness.setLocalStateField('cursor', { x, y, pageId })
  }

  function onUsersChange(fn) {
    listeners.push(fn)
    return () => {
      const idx = listeners.indexOf(fn)
      if (idx !== -1) listeners.splice(idx, 1)
    }
  }

  return {
    awareness,
    getOnlineUsers,
    updateCursor,
    onUsersChange,

    getStates() {
      return awareness.getStates()
    },

    destroy() {
      listeners.length = 0
    }
  }
}
