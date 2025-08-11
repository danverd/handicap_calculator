import type { Course, Tee } from '@types/index'

export interface CourseProvider {
  searchCourses(query: string): Promise<Course[]>
  listTees(courseId: string): Promise<Tee[]>
}

// Simple mock provider for tests and local development before wiring a real API
export class MockCourseProvider implements CourseProvider {
  calls = { search: 0, tees: 0 }

  async searchCourses(query: string): Promise<Course[]> {
    this.calls.search += 1
    const q = query.toLowerCase()
    const now = new Date().toISOString()
    const all: Course[] = [
      { id: 'api-1', name: 'Green Valley', city: 'Austin', state: 'TX', country: 'US', source: 'api', tees: [], updatedAt: now },
      { id: 'api-2', name: 'Green Hills', city: 'Dallas', state: 'TX', country: 'US', source: 'api', tees: [], updatedAt: now },
      { id: 'api-3', name: 'Sea Breeze', city: 'San Diego', state: 'CA', country: 'US', source: 'api', tees: [], updatedAt: now },
    ]
    return all.filter((c) => c.name.toLowerCase().includes(q))
  }

  async listTees(courseId: string): Promise<Tee[]> {
    this.calls.tees += 1
    // Minimal mock tees
    return [
      { id: `${courseId}-blue`, courseId, name: 'Blue', courseRating: 72, slopeRating: 130, holes: 18, source: 'api' },
      { id: `${courseId}-white`, courseId, name: 'White', courseRating: 70, slopeRating: 125, holes: 18, source: 'api' },
    ]
  }
}


