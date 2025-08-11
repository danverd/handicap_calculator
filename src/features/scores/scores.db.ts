import { db } from '@lib/idb'
import type { Score } from '@types/index'
import { computeDifferential } from '@features/handicap/calc.engine'

function withComputedDifferential(score: Score): Score {
  try {
    const differential = computeDifferential(score)
    return { ...score, differential }
  } catch {
    return { ...score }
  }
}

export async function addScore(score: Score): Promise<void> {
  const toSave = withComputedDifferential(score)
  await db.scores.add(toSave)
}

export async function getScore(id: string): Promise<Score | undefined> {
  return db.scores.get(id)
}

export async function listScores(): Promise<Score[]> {
  return db.scores.orderBy('date').reverse().toArray()
}

export async function updateScore(id: string, changes: Partial<Score>): Promise<void> {
  // If any relevant fields changed, recompute differential
  const current = await db.scores.get(id)
  if (!current) return
  const next: Score = { ...current, ...changes }
  const toSave = withComputedDifferential(next)
  await db.scores.put(toSave)
}

export async function deleteScore(id: string): Promise<void> {
  await db.scores.delete(id)
}

export async function deleteAllScores(): Promise<void> {
  await db.scores.clear()
}


