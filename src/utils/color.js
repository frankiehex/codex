const PALETTE = [
  '#FF6B6B', // red
  '#4ECDC4', // teal
  '#45B7D1', // sky blue
  '#96CEB4', // sage green
  '#FFEAA7', // yellow
  '#DDA0DD', // plum
  '#98D8C8', // mint
  '#F7DC6F', // gold
  '#BB8FCE', // lavender
  '#85C1E9', // light blue
  '#F0B27A', // peach
  '#82E0AA', // emerald
]

export function generateUserColor() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)]
}
