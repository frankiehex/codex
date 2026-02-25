import * as Y from 'yjs'
import { generateId } from '../utils/id.js'

export function initDocument(ydoc) {
  const meta = ydoc.getMap('meta')
  const pages = ydoc.getMap('pages')

  // Check if document is already initialized (by another peer)
  if (pages.get('pageOrder') && pages.get('pageOrder').length > 0) {
    // Document already initialized, ensure meta defaults exist
    if (!meta.get('explosionTrigger')) meta.set('explosionTrigger', 0)
    if (!meta.get('chaosTrigger')) meta.set('chaosTrigger', 0)
    return
  }

  ydoc.transact(() => {
    if (!meta.get('createdAt')) {
      meta.set('createdAt', Date.now())
      meta.set('explosionTrigger', 0)
      meta.set('chaosTrigger', 0)
    }

    if (!pages.get('pageOrder')) {
      const pageOrder = new Y.Array()
      pages.set('pageOrder', pageOrder)
      // Create first page
      const pageId = 'p1'
      pageOrder.push([pageId])
      ensurePage(ydoc, pageId)
    }
  })
}

// Safely ensure a page exists without overwriting
export function ensurePage(ydoc, pageId) {
  const pageMap = ydoc.getMap(`page:${pageId}`)
  if (!pageMap.get('strokes')) {
    pageMap.set('strokes', new Y.Array())
  }
  if (!pageMap.get('background')) {
    const bg = new Y.Map()
    bg.set('type', 'color')
    bg.set('value', '#ffffff')
    pageMap.set('background', bg)
  }
}

export function getPageOrder(ydoc) {
  return ydoc.getMap('pages').get('pageOrder')
}

export function getPageIds(ydoc) {
  const order = getPageOrder(ydoc)
  if (!order) return ['p1']
  return order.toArray()
}

export function createPage(ydoc) {
  const pageId = 'p' + generateId(6)
  const pages = ydoc.getMap('pages')
  const order = pages.get('pageOrder')

  ydoc.transact(() => {
    order.push([pageId])
    const pageMap = ydoc.getMap(`page:${pageId}`)
    pageMap.set('strokes', new Y.Array())
    const bg = new Y.Map()
    bg.set('type', 'color')
    bg.set('value', '#ffffff')
    pageMap.set('background', bg)
  })

  return pageId
}

export function getPageStrokes(ydoc, pageId) {
  return ydoc.getMap(`page:${pageId}`).get('strokes')
}

export function getPageBackground(ydoc, pageId) {
  return ydoc.getMap(`page:${pageId}`).get('background')
}

export function addStroke(ydoc, pageId, strokeData) {
  const strokes = getPageStrokes(ydoc, pageId)
  if (!strokes) return

  const strokeMap = new Y.Map()
  ydoc.transact(() => {
    strokeMap.set('id', strokeData.id)
    strokeMap.set('userId', strokeData.userId)
    strokeMap.set('color', strokeData.color)
    strokeMap.set('width', strokeData.width)
    strokeMap.set('tool', strokeData.tool)
    strokeMap.set('points', JSON.stringify(strokeData.points))
    strokeMap.set('timestamp', strokeData.timestamp)
    strokes.push([strokeMap])
  })
}

export function clearPageStrokes(ydoc, pageId) {
  const strokes = getPageStrokes(ydoc, pageId)
  if (!strokes) return

  ydoc.transact(() => {
    strokes.delete(0, strokes.length)
  })
}

export function setPageBackground(ydoc, pageId, type, value) {
  const bg = getPageBackground(ydoc, pageId)
  if (!bg) return

  ydoc.transact(() => {
    bg.set('type', type)
    bg.set('value', value)
  })
}

export function triggerExplosion(ydoc) {
  const meta = ydoc.getMap('meta')
  const current = meta.get('explosionTrigger') || 0
  meta.set('explosionTrigger', current + 1)
}

export function triggerChaos(ydoc) {
  const meta = ydoc.getMap('meta')
  const current = meta.get('chaosTrigger') || 0
  meta.set('chaosTrigger', current + 1)
}

export function getMeta(ydoc) {
  return ydoc.getMap('meta')
}
