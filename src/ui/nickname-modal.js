import { t } from '../i18n/i18n.js'

export function showNicknameModal(roomId) {
  return new Promise((resolve) => {
    const container = document.getElementById('modal-container')
    container.classList.add('active')

    container.innerHTML = `
      <div class="glass-modal text-center">
        <h1 class="text-2xl font-bold text-gray-800 mb-1">${t('app.title')}</h1>
        <p class="text-sm text-gray-500 mb-6">${t('modal.roomLabel')}: <span class="font-mono font-bold text-gray-700">${roomId}</span></p>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-600 mb-2 text-left">${t('modal.nickname')}</label>
          <input
            id="nickname-input"
            type="text"
            placeholder="${t('modal.nicknamePlaceholder')}"
            maxlength="20"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-gray-800 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition"
            autocomplete="off"
            autofocus
          />
        </div>

        <button
          id="enter-btn"
          class="w-full px-6 py-3 bg-gray-800 text-white rounded-xl font-medium text-lg hover:bg-gray-700 active:bg-gray-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
          disabled
        >
          ${t('modal.enter')}
        </button>
      </div>
    `

    const input = document.getElementById('nickname-input')
    const btn = document.getElementById('enter-btn')

    input.addEventListener('input', () => {
      btn.disabled = !input.value.trim()
    })

    function submit() {
      const name = input.value.trim()
      if (!name) return
      container.classList.remove('active')
      container.innerHTML = ''
      resolve(name)
    }

    btn.addEventListener('click', submit)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit()
    })

    // Focus after animation
    setTimeout(() => input.focus(), 100)
  })
}
