import type { Course, Tee } from '@types/index'
import { listCourses, searchCoursesByName, upsertCourse, listTees as listLocalTees, upsertTee } from './courses.db'
import type { CourseProvider } from './courses.provider'

export interface SearchResult {
  saved: Course[]
  results: Course[]
}

function normalizeKey(c: Pick<Course, 'name' | 'city' | 'state' | 'country'>): string {
  return [c.name, c.city, c.state, c.country].filter(Boolean).join('|').toLowerCase()
}

export async function searchCoursesMerged(query: string, provider: CourseProvider): Promise<SearchResult> {
  const q = query.trim()
  const savedMatches = q ? await searchCoursesByName(q) : await listCourses()
  const savedKeys = new Set(savedMatches.map((c) => normalizeKey(c)))
  const savedNames = new Set(savedMatches.map((c) => c.name.toLowerCase()))

  // Fetch from provider
  const apiCourses = q ? await provider.searchCourses(q) : []

  // Merge, prefer saved/local items (including user edits)
  const merged: Course[] = []
  for (const c of apiCourses) {
    const key = normalizeKey(c)
    if (!savedKeys.has(key) && !savedNames.has(c.name.toLowerCase())) {
      // cache the API result locally for speed (with updatedAt)
      const cached: Course = { ...c, updatedAt: new Date().toISOString() }
      merged.push(cached)
      await upsertCourse(cached)
    }
  }

  return {
    saved: savedMatches,
    results: merged,
  }
}

export async function listTeesMerged(courseId: string, provider: CourseProvider): Promise<Tee[]> {
  const local = await listLocalTees(courseId)
  if (local.length > 0) return local
  const fromApi = await provider.listTees(courseId)
  for (const tee of fromApi) {
    await upsertTee(tee)
  }
  return fromApi
}


