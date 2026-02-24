const LASER_LIFETIME = 2000

export function pruneLaserPoints(points) {
  const now = Date.now()
  return points.filter(p => now - p.t < LASER_LIFETIME)
}

export function createLaserManager(awareness, userId) {
  let interval = null

  function start() {
    // Periodically prune old laser points from awareness
    interval = setInterval(() => {
      const state = awareness.getLocalState()
      if (state && state.laser && state.laser.points.length > 0) {
        const pruned = pruneLaserPoints(state.laser.points)
        if (pruned.length !== state.laser.points.length) {
          if (pruned.length === 0) {
            awareness.setLocalStateField('laser', null)
          } else {
            awareness.setLocalStateField('laser', {
              ...state.laser,
              points: pruned
            })
          }
        }
      }
    }, 200)
  }

  function updatePoints(points, color) {
    awareness.setLocalStateField('laser', { points, color })
  }

  function destroy() {
    if (interval) clearInterval(interval)
    awareness.setLocalStateField('laser', null)
  }

  return { start, updatePoints, destroy }
}
