import { db } from '@lib/idb'
import type { Course, Tee } from '@types/index'

export async function upsertCourse(course: Course): Promise<void> {
  await db.courses.put(course)
}

export async function getCourse(id: string): Promise<Course | undefined> {
  return db.courses.get(id)
}

export async function searchCoursesByName(name: string): Promise<Course[]> {
  const q = name.toLowerCase()
  return db.courses
    .filter((c) => c.name.toLowerCase().includes(q))
    .limit(20)
    .toArray()
}

export async function listCourses(): Promise<Course[]> {
  return db.courses.orderBy('name').toArray()
}

export async function deleteCourse(id: string): Promise<void> {
  await db.courses.delete(id)
  await db.tees.where('courseId').equals(id).delete()
}

export async function upsertTee(tee: Tee): Promise<void> {
  await db.tees.put(tee)
}

export async function listTees(courseId: string): Promise<Tee[]> {
  return db.tees.where('courseId').equals(courseId).toArray()
}

export async function deleteTee(id: string): Promise<void> {
  await db.tees.delete(id)
}


