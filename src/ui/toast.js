let container = null

function ensureContainer() {
  if (!container) {
    container = document.createElement('div')
    container.className = 'fixed top-20 right-4 z-40 flex flex-col gap-2 pointer-events-none'
    document.body.appendChild(container)
  }
  return container
}

export function showToast(message, type = 'info') {
  const parent = ensureContainer()

  const colors = {
    info: 'bg-gray-800/80 text-white',
    success: 'bg-green-600/80 text-white',
    warning: 'bg-yellow-500/80 text-black',
    error: 'bg-red-600/80 text-white'
  }

  const toast = document.createElement('div')
  toast.className = `${colors[type] || colors.info} px-4 py-2 rounded-xl backdrop-blur-sm shadow-lg text-sm font-medium toast-enter pointer-events-auto`
  toast.textContent = message
  parent.appendChild(toast)

  setTimeout(() => {
    toast.classList.remove('toast-enter')
    toast.classList.add('toast-exit')
    toast.addEventListener('animationend', () => toast.remove())
  }, 3000)
}
