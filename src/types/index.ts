export type HoleCount = 9 | 18

export interface Score {
  id: string
  date: string
  courseId?: string
  courseName: string
  teeId?: string
  teeName?: string
  courseRating: number
  slopeRating: number
  grossScore: number
  holes: HoleCount
  differential?: number
}

export interface Course {
  id: string
  name: string
  city?: string
  state?: string
  country?: string
  source: 'api' | 'user'
  tees: Tee[]
  updatedAt: string
}

export interface Tee {
  id: string
  courseId: string
  name: string
  courseRating: number
  slopeRating: number
  gender?: 'M' | 'F' | 'U'
  holes: HoleCount
  source: 'api' | 'user'
}

export interface PreferenceKV<T = unknown> {
  key: string
  value: T
}


