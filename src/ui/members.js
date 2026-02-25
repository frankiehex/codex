export function createMembersUI(containerEl) {
  let el = document.createElement('div')
  el.className = 'flex items-center gap-1'
  containerEl.appendChild(el)

  function render(users) {
    el.innerHTML = ''

    const MAX_VISIBLE = 5
    const visible = users.slice(0, MAX_VISIBLE)
    const overflow = users.length - MAX_VISIBLE

    for (const user of visible) {
      const avatar = document.createElement('div')
      avatar.className = 'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-white/50 cursor-default transition-transform hover:scale-110'
      avatar.style.backgroundColor = user.color
      avatar.textContent = user.name.charAt(0).toUpperCase()
      avatar.title = user.name + (user.isLocal ? ' (you)' : '')

      if (user.isLocal) {
        avatar.classList.add('ring-2', 'ring-blue-400')
      }

      el.appendChild(avatar)
    }

    if (overflow > 0) {
      const badge = document.createElement('div')
      badge.className = 'w-7 h-7 rounded-full flex items-center justify-center bg-gray-200 text-gray-600 text-xs font-bold shadow-sm'
      badge.textContent = `+${overflow}`
      el.appendChild(badge)
    }
  }

  return { render, el }
}
