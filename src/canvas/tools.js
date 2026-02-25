let currentTool = 'pen'
const listeners = []

export function getCurrentTool() {
  return currentTool
}

export function setTool(tool) {
  if (tool !== currentTool) {
    currentTool = tool
    listeners.forEach(fn => fn(tool))
  }
}

export function onToolChange(fn) {
  listeners.push(fn)
  return () => {
    const idx = listeners.indexOf(fn)
    if (idx !== -1) listeners.splice(idx, 1)
  }
}
