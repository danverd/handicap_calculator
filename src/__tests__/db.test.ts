import { beforeEach, describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@lib/idb'
import { addScore, deleteAllScores, getScore, listScores, updateScore } from '@features/scores/scores.db'
import { type Score } from '@types/index'
import { upsertCourse, listCourses, upsertTee, listTees } from '@features/courses/courses.db'
import { getPreference, setPreference } from '@features/preferences/preferences.db'

describe('Dexie DB basic CRUD', () => {
  beforeEach(async () => {
    await db.scores.clear()
    await db.courses.clear()
    await db.tees.clear()
    await db.preferences.clear()
  })

  it('scores: add, list sorted desc by date, update, delete all', async () => {
    const s1: Score = {
      id: 's1',
      date: '2024-07-01',
      courseName: 'Sample Course',
      courseRating: 72.1,
      slopeRating: 130,
      grossScore: 85,
      holes: 18,
    }
    const s2: Score = { ...s1, id: 's2', date: '2024-08-01', grossScore: 83 }
    await addScore(s1)
    await addScore(s2)

    const listed = await listScores()
    expect(listed.map((s) => s.id)).toEqual(['s2', 's1'])

    await updateScore('s2', { grossScore: 80 })
    const updated = await getScore('s2')
    expect(updated?.grossScore).toBe(80)

    await deleteAllScores()
    const empty = await listScores()
    expect(empty.length).toBe(0)
  })

  it('courses & tees: upsert and list', async () => {
    await upsertCourse({ id: 'c1', name: 'Alpha', source: 'user', tees: [], updatedAt: new Date().toISOString() })
    await upsertCourse({ id: 'c2', name: 'Beta', source: 'user', tees: [], updatedAt: new Date().toISOString() })
    const courses = await listCourses()
    expect(courses.map((c) => c.name)).toEqual(['Alpha', 'Beta'])

    await upsertTee({ id: 't1', courseId: 'c1', name: 'Blue', courseRating: 72, slopeRating: 130, holes: 18, source: 'user' })
    const tees = await listTees('c1')
    expect(tees.length).toBe(1)
    expect(tees[0].name).toBe('Blue')
  })

  it('preferences: set and get', async () => {
    await setPreference('theme', 'dark')
    const theme = await getPreference<string>('theme')
    expect(theme).toBe('dark')
  })
})


