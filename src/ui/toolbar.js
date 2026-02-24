import { t, toggleLocale, onLocaleChange, getLocale } from '../i18n/i18n.js'
import { getCurrentTool, setTool, onToolChange } from '../canvas/tools.js'
import { createMembersUI } from './members.js'
import { createPagesUI } from './pages.js'

export function createToolbar(containerEl, {
  roomId,
  onPageSwitch,
  onPageCreate,
  onVoiceToggle,
  onReplay,
  onClear
}) {
  const toolbar = document.createElement('div')
  toolbar.className = 'glass-toolbar flex items-center gap-3 flex-wrap'
  containerEl.appendChild(toolbar)

  // Sections
  const roomSection = document.createElement('div')
  roomSection.className = 'flex items-center gap-2'

  const membersSection = document.createElement('div')
  membersSection.className = 'flex items-center gap-1'

  const sep1 = createSep()

  const pagesSection = document.createElement('div')
  pagesSection.className = 'flex items-center gap-1'

  const sep2 = createSep()

  const toolsSection = document.createElement('div')
  toolsSection.className = 'flex items-center gap-1'

  const sep3 = createSep()

  const actionsSection = document.createElement('div')
  actionsSection.className = 'flex items-center gap-1'

  const sep4 = createSep()

  const statusSection = document.createElement('div')
  statusSection.className = 'flex items-center gap-2 ml-auto'

  toolbar.append(roomSection, membersSection, sep1, pagesSection, sep2, toolsSection, sep3, actionsSection, sep4, statusSection)

  // Room info
  const logo = document.createElement('span')
  logo.className = 'text-base font-bold text-gray-800'
  logo.textContent = 'SI'

  const roomLabel = document.createElement('span')
  roomLabel.className = 'text-xs text-gray-500 font-mono'

  const copyBtn = document.createElement('button')
  copyBtn.className = 'text-xs text-blue-500 hover:text-blue-700 transition'

  roomSection.append(logo, roomLabel, copyBtn)

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href)
    copyBtn.textContent = t('toolbar.linkCopied')
    setTimeout(() => updateRoomLabel(), 1500)
  })

  function updateRoomLabel() {
    roomLabel.textContent = roomId
    copyBtn.textContent = t('toolbar.copyLink')
  }

  // Members UI
  const members = createMembersUI(membersSection)

  // Pages UI
  const pages = createPagesUI(pagesSection, { onPageSwitch, onPageCreate })

  // Tool buttons
  const penBtn = createToolBtn('pen', t('toolbar.pen'), '✏️')
  const laserBtn = createToolBtn('laser', t('toolbar.laser'), '🔴')
  toolsSection.append(penBtn, laserBtn)

  function updateToolBtns() {
    const active = getCurrentTool()
    penBtn.className = toolBtnClass(active === 'pen')
    laserBtn.className = toolBtnClass(active === 'laser')
  }

  penBtn.addEventListener('click', () => setTool('pen'))
  laserBtn.addEventListener('click', () => setTool('laser'))
  onToolChange(updateToolBtns)
  updateToolBtns()

  // Action buttons
  const micBtn = document.createElement('button')
  micBtn.className = 'p-1.5 rounded-lg text-sm hover:bg-white/50 transition'
  micBtn.textContent = '🎤'
  micBtn.title = t('toolbar.mic')
  let micOn = false
  micBtn.addEventListener('click', () => {
    micOn = !micOn
    micBtn.className = `p-1.5 rounded-lg text-sm transition ${micOn ? 'bg-red-100 ring-2 ring-red-300' : 'hover:bg-white/50'}`
    if (onVoiceToggle) onVoiceToggle(micOn)
  })

  const replayBtn = document.createElement('button')
  replayBtn.className = 'p-1.5 rounded-lg text-sm hover:bg-white/50 transition'
  replayBtn.textContent = '▶'
  replayBtn.title = t('toolbar.replay')
  replayBtn.addEventListener('click', () => { if (onReplay) onReplay() })

  const clearBtn = document.createElement('button')
  clearBtn.className = 'p-1.5 rounded-lg text-sm hover:bg-white/50 transition text-red-400 hover:text-red-600'
  clearBtn.textContent = '🗑'
  clearBtn.title = t('toolbar.clear')
  clearBtn.addEventListener('click', () => { if (onClear) onClear() })

  actionsSection.append(micBtn, replayBtn, clearBtn)

  // Status + Language
  const statusDot = document.createElement('span')
  statusDot.className = 'w-2 h-2 rounded-full bg-yellow-400'

  const statusText = document.createElement('span')
  statusText.className = 'text-xs text-gray-500'
  statusText.textContent = t('toolbar.connecting')

  const langBtn = document.createElement('button')
  langBtn.className = 'text-xs text-gray-400 hover:text-gray-600 transition font-medium'
  langBtn.textContent = t('lang.switch')
  langBtn.addEventListener('click', toggleLocale)

  statusSection.append(statusDot, statusText, langBtn)

  // Locale change handler
  onLocaleChange(() => {
    updateRoomLabel()
    penBtn.title = t('toolbar.pen')
    laserBtn.title = t('toolbar.laser')
    micBtn.title = micOn ? t('toolbar.micOn') : t('toolbar.micOff')
    replayBtn.title = t('toolbar.replay')
    clearBtn.title = t('toolbar.clear')
    langBtn.textContent = t('lang.switch')
    updateStatus(statusDot.dataset.status || 'connecting')
  })

  updateRoomLabel()

  function updateStatus(status) {
    const s = status || 'connecting'
    statusDot.dataset.status = s
    const colors = {
      connected: 'bg-green-400',
      connecting: 'bg-yellow-400',
      disconnected: 'bg-red-400'
    }
    statusDot.className = `w-2 h-2 rounded-full ${colors[s] || colors.connecting}`
    const label = t(`toolbar.${s}`)
    statusText.textContent = label !== `toolbar.${s}` ? label : s
  }

  function createSep() {
    const sep = document.createElement('div')
    sep.className = 'w-px h-6 bg-gray-200'
    return sep
  }

  function createToolBtn(tool, title, icon) {
    const btn = document.createElement('button')
    btn.className = toolBtnClass(false)
    btn.textContent = icon
    btn.title = title
    return btn
  }

  function toolBtnClass(active) {
    return `p-1.5 rounded-lg text-sm transition ${
      active ? 'bg-gray-800 text-white shadow-sm' : 'hover:bg-white/50'
    }`
  }

  return {
    updateStatus,
    updateMembers: members.render,
    updatePages: pages.render,
    toolbar
  }
}
