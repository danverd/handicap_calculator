import { beforeEach, describe, expect, it } from 'vitest'
import { MockCourseProvider } from '@features/courses/courses.provider'
import { listTeesMerged, searchCoursesMerged } from '@features/courses/courses.service'
import { upsertCourse, listTees as listLocalTees } from '@features/courses/courses.db'
import { db } from '@lib/idb'

describe('courses service', () => {
  const provider = new MockCourseProvider()

  beforeEach(async () => {
    await db.courses.clear()
    await db.tees.clear()
  })

  it('returns saved courses first, and merges in API results without duplicates', async () => {
    await upsertCourse({ id: 'local-1', name: 'Green Valley', source: 'user', tees: [], updatedAt: new Date().toISOString() })
    const result = await searchCoursesMerged('Green', provider)
    expect(result.saved.map((c) => c.name)).toContain('Green Valley')
    const mergedNames = result.results.map((c) => c.name)
    expect(mergedNames).toContain('Green Hills')
    expect(mergedNames).not.toContain('Green Valley')
  })

  it('caches tees locally when fetched from provider', async () => {
    const tees = await listTeesMerged('api-1', provider)
    expect(tees.length).toBeGreaterThan(0)
    const fromLocal = await listLocalTees('api-1')
    expect(fromLocal.length).toBe(tees.length)
  })
})


