import { beforeEach, describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@lib/idb'
import { addScore, getScore, updateScore } from '@features/scores/scores.db'
import type { Score } from '@types/index'

describe('scores.db differential computation', () => {
  beforeEach(async () => {
    await db.scores.clear()
  })

  it('computes differential on insert and recomputes on update', async () => {
    const s: Score = {
      id: 'sx',
      date: '2024-08-01',
      courseName: 'Test',
      courseRating: 72,
      slopeRating: 120,
      grossScore: 84,
      holes: 18,
    }
    await addScore(s)
    const saved = await getScore('sx')
    expect(saved?.differential).toBeDefined()

    // Change gross score and ensure differential changes
    const prev = saved?.differential
    await updateScore('sx', { grossScore: 80 })
    const updated = await getScore('sx')
    expect(updated?.differential).toBeDefined()
    expect(updated?.differential).not.toBe(prev)
  })
})


