import Dexie, { Table } from 'dexie'
import type { Course, PreferenceKV, Score, Tee } from '@types/index'

export class AppDatabase extends Dexie {
  scores!: Table<Score, string>
  courses!: Table<Course, string>
  tees!: Table<Tee, string>
  preferences!: Table<PreferenceKV, string>

  constructor() {
    super('handicap_calculator_db')
    this.version(1).stores({
      scores: 'id, date',
      courses: 'id, name',
      tees: 'id, courseId',
      preferences: 'key',
    })
  }
}

export const db = new AppDatabase()


