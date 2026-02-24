let bgImage = null
let bgImageUrl = null

export function loadBackgroundImage(url) {
  return new Promise((resolve, reject) => {
    if (url === bgImageUrl && bgImage) {
      resolve(bgImage)
      return
    }
    const img = new Image()
    img.onload = () => {
      bgImage = img
      bgImageUrl = url
      resolve(img)
    }
    img.onerror = reject
    img.src = url
  })
}

export function drawBackground(ctx, bgConfig, width, height) {
  if (!bgConfig || bgConfig.type === 'color') {
    ctx.fillStyle = (bgConfig && bgConfig.value) || '#ffffff'
    ctx.fillRect(0, 0, width, height)
  } else if (bgConfig.type === 'image' && bgImage && bgImageUrl === bgConfig.value) {
    ctx.drawImage(bgImage, 0, 0, width, height)
  } else {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }
}

export function clearBackground() {
  bgImage = null
  bgImageUrl = null
}
