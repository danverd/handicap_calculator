import type { Score } from '@types/index'
import { RULES } from './calc.rules'

export interface DifferentialEntry {
  scoreId: string
  differential: number
  date: string
}

export interface CombinedDifferential {
  combinedId: string
  differential: number
  scoreIds: string[]
  dates: string[]
}

export function roundTo1(value: number): number {
  return Math.round(value * 10) / 10
}

export function computeDifferential(score: Score): number {
  const base = ((score.grossScore - score.courseRating) * 113) / score.slopeRating
  return roundTo1(base)
}

// Pair most recent unmatched 9-hole scores chronologically
export function pairNineHoleDifferentials(scores: Score[]): CombinedDifferential[] {
  const nine = scores.filter((s) => s.holes === 9).sort((a, b) => a.date.localeCompare(b.date))
  const pairs: CombinedDifferential[] = []
  for (let i = 0; i + 1 < nine.length; i += 2) {
    const a = nine[i]
    const b = nine[i + 1]
    const diff = computeDifferential(a) + computeDifferential(b)
    pairs.push({
      combinedId: `${a.id}+${b.id}`,
      differential: roundTo1(diff),
      scoreIds: [a.id, b.id],
      dates: [a.date, b.date],
    })
  }
  return pairs
}

export function buildDifferentials(scores: Score[]): DifferentialEntry[] {
  const eighteens = scores.filter((s) => s.holes === 18)
  const combined = pairNineHoleDifferentials(scores)
  const entries: DifferentialEntry[] = []
  for (const s of eighteens) {
    entries.push({ scoreId: s.id, differential: computeDifferential(s), date: s.date })
  }
  for (const c of combined) {
    entries.push({ scoreId: c.combinedId, differential: c.differential, date: c.dates[1] })
  }
  // Sort by date descending for selection logic convenience
  entries.sort((a, b) => b.date.localeCompare(a.date))
  return entries
}

export function selectUsedDifferentials(all: DifferentialEntry[]) {
  const count = all.length
  if (count < 3) {
    return {
      usedDifferentials: [],
      ruleApplied: { scoresCount: count, usedCount: 0, multiplier: 0.96 },
      average: 0,
      index: 0,
      message: 'At least 3 scores required before receiving a handicap index',
    }
  }

  // If more than 20, restrict to most recent 20 before picking lowest 10
  let pool = all
  if (count > 20) {
    pool = all.slice(0, 20)
  }
  const rule = RULES.find((r) => pool.length >= r.min && pool.length <= r.max) || RULES[RULES.length - 1]
  const sortedByDiff = [...pool].sort((a, b) => a.differential - b.differential)
  const used = sortedByDiff.slice(0, rule.use)
  const average = used.reduce((sum, d) => sum + d.differential, 0) / used.length
  const applied = Math.round(average * rule.multiplier * 10) / 10
  return {
    usedDifferentials: used,
    ruleApplied: { scoresCount: pool.length, usedCount: used.length, multiplier: rule.multiplier },
    average: roundTo1(average),
    index: applied,
  }
}


