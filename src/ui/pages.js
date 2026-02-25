import { t } from '../i18n/i18n.js'

export function createPagesUI(containerEl, { onPageSwitch, onPageCreate }) {
  let el = document.createElement('div')
  el.className = 'flex items-center gap-1'
  containerEl.appendChild(el)

  let activePageId = null

  function render(pageIds, currentPageId) {
    activePageId = currentPageId
    el.innerHTML = ''

    for (let i = 0; i < pageIds.length; i++) {
      const pageId = pageIds[i]
      const tab = document.createElement('button')
      const isActive = pageId === currentPageId
      tab.className = `px-3 py-1 text-xs font-medium rounded-lg transition ${
        isActive
          ? 'bg-gray-800 text-white shadow-sm'
          : 'bg-white/50 text-gray-600 hover:bg-white/80'
      }`
      tab.textContent = `P${i + 1}`
      tab.title = pageId
      tab.addEventListener('click', () => onPageSwitch(pageId))
      el.appendChild(tab)
    }

    // Add page button
    const addBtn = document.createElement('button')
    addBtn.className = 'w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition text-lg'
    addBtn.textContent = '+'
    addBtn.title = t('toolbar.addPage')
    addBtn.addEventListener('click', onPageCreate)
    el.appendChild(addBtn)
  }

  return { render, el }
}
