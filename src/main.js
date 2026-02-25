import './style.css'
import { getRoomFromUrl, generateRoomId, setRoomInUrl } from './utils/room.js'
import { generateUserColor } from './utils/color.js'
import { showNicknameModal } from './ui/nickname-modal.js'
import { initApp } from './app.js'

async function main() {
  // Get or generate room ID
  let roomId = getRoomFromUrl()
  if (!roomId) {
    roomId = generateRoomId()
    setRoomInUrl(roomId)
  }

  // Show nickname modal
  const nickname = await showNicknameModal(roomId)
  const userColor = generateUserColor()

  // Initialize the app
  initApp(roomId, nickname, userColor)
}

main()
