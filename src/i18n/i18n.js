import zhTW from './zh-TW.js'
import en from './en.js'

const locales = { 'zh-TW': zhTW, 'en': en }
let currentLocale = 'zh-TW'
const listeners = []

export function t(key, params = {}) {
  const strings = locales[currentLocale] || locales['zh-TW']
  let str = strings[key] || key

  // Replace {param} placeholders
  for (const [k, v] of Object.entries(params)) {
    str = str.replace(`{${k}}`, v)
  }

  return str
}

export function getLocale() {
  return currentLocale
}

export function setLocale(locale) {
  if (locales[locale] && locale !== currentLocale) {
    currentLocale = locale
    listeners.forEach(fn => fn(locale))
    document.dispatchEvent(new CustomEvent('locale-changed', { detail: locale }))
  }
}

export function toggleLocale() {
  setLocale(currentLocale === 'zh-TW' ? 'en' : 'zh-TW')
}

export function onLocaleChange(fn) {
  listeners.push(fn)
  return () => {
    const idx = listeners.indexOf(fn)
    if (idx !== -1) listeners.splice(idx, 1)
  }
}
