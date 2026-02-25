export function playExplosion(ctx, width, height) {
  const particles = []
  const centerX = width / 2
  const centerY = height / 2

  for (let i = 0; i < 200; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 8
    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 2 + Math.random() * 6,
      color: `hsl(${Math.random() * 60}, 100%, ${40 + Math.random() * 30}%)`,
      life: 1.0
    })
  }

  // Flash
  ctx.fillStyle = 'rgba(255, 255, 200, 0.8)'
  ctx.fillRect(0, 0, width, height)

  function animate() {
    ctx.clearRect(0, 0, width, height)
    let alive = false

    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.1 // gravity
      p.life -= 0.012

      if (p.life > 0) {
        alive = true
        ctx.globalAlpha = p.life
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
      }
    }

    ctx.globalAlpha = 1
    if (alive) requestAnimationFrame(animate)
  }

  animate()
}

export function playChaos(ctx, width, height, onComplete) {
  // Phase 1: Screen shake
  document.body.classList.add('shaking')

  // Phase 2: Random shapes dancing on overlay
  const shapes = []
  for (let i = 0; i < 60; i++) {
    shapes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 10 + Math.random() * 50,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`,
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10
    })
  }

  let frame = 0
  const totalFrames = 120 // ~2 seconds at 60fps

  function animate() {
    ctx.clearRect(0, 0, width, height)
    frame++

    // Semi-transparent overlay
    const alpha = Math.min(frame / 30, 0.3)
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
    ctx.fillRect(0, 0, width, height)

    for (const s of shapes) {
      s.x += s.vx
      s.y += s.vy
      s.rotation += s.vr

      // Bounce off edges
      if (s.x < 0 || s.x > width) s.vx *= -1
      if (s.y < 0 || s.y > height) s.vy *= -1

      ctx.save()
      ctx.translate(s.x, s.y)
      ctx.rotate(s.rotation)
      ctx.fillStyle = s.color
      ctx.globalAlpha = 1 - frame / totalFrames
      ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size)
      ctx.restore()
    }

    ctx.globalAlpha = 1

    if (frame < totalFrames) {
      requestAnimationFrame(animate)
    } else {
      // Phase 3: Clear
      document.body.classList.remove('shaking')
      ctx.clearRect(0, 0, width, height)
      if (onComplete) onComplete()
    }
  }

  animate()
}
