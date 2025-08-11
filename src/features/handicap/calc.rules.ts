export interface HandicapRule {
  min: number
  max: number
  use: number
  multiplier: number
}

export const RULES: HandicapRule[] = [
  { min: 3, max: 3, use: 1, multiplier: 0.96 },
  { min: 4, max: 4, use: 1, multiplier: 0.96 },
  { min: 5, max: 5, use: 1, multiplier: 0.96 },
  { min: 6, max: 6, use: 2, multiplier: 0.96 },
  { min: 7, max: 8, use: 2, multiplier: 0.96 },
  { min: 9, max: 10, use: 3, multiplier: 0.96 },
  { min: 11, max: 12, use: 4, multiplier: 0.96 },
  { min: 13, max: 14, use: 5, multiplier: 0.96 },
  { min: 15, max: 16, use: 6, multiplier: 0.96 },
  { min: 17, max: 17, use: 7, multiplier: 0.96 },
  { min: 18, max: 18, use: 8, multiplier: 0.96 },
  { min: 19, max: 19, use: 9, multiplier: 0.96 },
  { min: 20, max: Infinity, use: 10, multiplier: 0.96 },
]


