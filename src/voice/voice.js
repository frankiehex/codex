import { showToast } from '../ui/toast.js'

let localStream = null
const audioElements = new Map()
let muted = false

export async function startVoice(provider) {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch (err) {
    showToast('Microphone access denied', 'error')
    return false
  }

  const room = provider.room
  if (room && room.webrtcConns) {
    for (const [peerId, conn] of room.webrtcConns) {
      if (conn.peer && conn.peer.connected) {
        attachStreamToPeer(conn.peer, peerId)
      }
    }
  }

  // Listen for new peers
  if (room) {
    room.on('peers', ({ added, removed }) => {
      for (const peerId of added) {
        const conn = room.webrtcConns.get(peerId)
        if (conn && conn.peer && conn.peer.connected) {
          attachStreamToPeer(conn.peer, peerId)
        }
      }
      for (const peerId of removed) {
        removeAudio(peerId)
      }
    })
  }

  return true
}

function attachStreamToPeer(peer, peerId) {
  if (!localStream) return

  try {
    peer.addStream(localStream)
  } catch (e) {
    // Stream might already be added
  }

  peer.on('stream', (remoteStream) => {
    removeAudio(peerId) // Clean up any existing element
    const audio = document.createElement('audio')
    audio.srcObject = remoteStream
    audio.autoplay = true
    audio.id = `audio-${peerId}`
    audio.style.display = 'none'
    document.body.appendChild(audio)
    audioElements.set(peerId, audio)
  })
}

function removeAudio(peerId) {
  const audio = audioElements.get(peerId)
  if (audio) {
    audio.srcObject = null
    audio.remove()
    audioElements.delete(peerId)
  }
}

export function toggleMute() {
  muted = !muted
  if (localStream) {
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !muted
    })
  }
  return muted
}

export function isMuted() {
  return muted
}

export function stopVoice() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop())
    localStream = null
  }
  for (const [peerId] of audioElements) {
    removeAudio(peerId)
  }
  audioElements.clear()
  muted = false
}

export function isVoiceActive() {
  return localStream !== null
}
