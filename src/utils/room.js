import { generateId } from './id.js'

export function getRoomFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get('room') || null
}

export function generateRoomId() {
  return generateId(6).toUpperCase()
}

export function setRoomInUrl(roomId) {
  const url = new URL(window.location.href)
  url.searchParams.set('room', roomId)
  history.replaceState(null, '', url.toString())
}
