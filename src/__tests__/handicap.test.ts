import { describe, expect, it } from 'vitest'
import { buildDifferentials, computeDifferential, pairNineHoleDifferentials, selectUsedDifferentials } from '@features/handicap/calc.engine'
import type { Score } from '@types/index'

function makeScore(id: string, date: string, gross: number, rating: number, slope: number, holes: 9 | 18): Score {
  return {
    id,
    date,
    courseName: 'Test Course',
    courseRating: rating,
    slopeRating: slope,
    grossScore: gross,
    holes,
  }
}

describe('handicap engine', () => {
  it('computes differential rounded to 1 decimal', () => {
    const s = makeScore('s1', '2024-08-01', 85, 72.2, 131, 18)
    const d = computeDifferential(s)
    expect(d).toBeCloseTo(11.0, 1)
  })

  it('pairs two 9-hole scores and sums differentials rounded to 1 decimal', () => {
    const a = makeScore('a', '2024-08-01', 42, 36.0, 113, 9)
    const b = makeScore('b', '2024-08-10', 43, 36.2, 120, 9)
    const pairs = pairNineHoleDifferentials([a, b])
    expect(pairs).toHaveLength(1)
    expect(pairs[0].combinedId).toBe('a+b')
    expect(pairs[0].differential).toBeCloseTo(computeDifferential(a) + computeDifferential(b), 1)
  })

  it('selects lowest differentials per rule and applies 0.96 multiplier', () => {
    const scores: Score[] = [
      makeScore('s1', '2024-08-01', 85, 72.2, 130, 18),
      makeScore('s2', '2024-08-05', 84, 72.5, 130, 18),
      makeScore('s3', '2024-08-09', 90, 72.2, 130, 18),
    ]
    const diffs = buildDifferentials(scores)
    const result = selectUsedDifferentials(diffs)
    expect(result.usedDifferentials.length).toBe(1)
    expect(result.ruleApplied.usedCount).toBe(1)
    // Check multiplier was applied
    const lowest = Math.min(...diffs.map((d) => d.differential))
    expect(result.index).toBeCloseTo(Math.round(lowest * 0.96 * 10) / 10, 5)
  })

  it('returns message when fewer than 3 usable scores', () => {
    const scores: Score[] = [makeScore('s1', '2024-08-01', 85, 72.2, 130, 18), makeScore('s2', '2024-08-05', 84, 72.5, 130, 18)]
    const diffs = buildDifferentials(scores)
    const result = selectUsedDifferentials(diffs)
    expect(result.message).toMatch(/At least 3 scores required/i)
  })

  it('uses 20 most recent when more than 20, then chooses lowest 10', () => {
    const many: Score[] = []
    for (let i = 1; i <= 22; i++) {
      many.push(makeScore(`s${i}`, `2024-08-${i.toString().padStart(2, '0')}`, 80 + i, 72, 120, 18))
    }
    const diffs = buildDifferentials(many)
    const result = selectUsedDifferentials(diffs)
    expect(result.ruleApplied.scoresCount).toBe(20)
    expect(result.usedDifferentials.length).toBe(10)
  })
})


