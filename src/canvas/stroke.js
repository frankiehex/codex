export function createStroke({ id, userId, color, width, tool = 'pen' }) {
  return {
    id,
    userId,
    color,
    width,
    tool,
    points: [],
    timestamp: Date.now()
  }
}

export function addPoint(stroke, x, y, pressure, startTime) {
  stroke.points.push({
    x,
    y,
    p: pressure,
    t: Date.now() - startTime
  })
}

export function pressureToWidth(baseWidth, pressure) {
  return baseWidth * (0.3 + pressure * 0.7)
}

export function serializeStroke(stroke) {
  return {
    ...stroke,
    points: JSON.stringify(stroke.points)
  }
}

export function deserializeStroke(strokeMap) {
  const points = strokeMap.get('points')
  return {
    id: strokeMap.get('id'),
    userId: strokeMap.get('userId'),
    color: strokeMap.get('color'),
    width: strokeMap.get('width'),
    tool: strokeMap.get('tool'),
    points: typeof points === 'string' ? JSON.parse(points) : points,
    timestamp: strokeMap.get('timestamp')
  }
}
