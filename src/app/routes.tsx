import { createBrowserRouter } from 'react-router-dom'
import Dashboard from '@pages/Dashboard'
import NewScore from '@pages/NewScore'
import ManageCourses from '@pages/ManageCourses'

export const router = createBrowserRouter([
  { path: '/', element: <Dashboard /> },
  { path: '/scores/new', element: <NewScore /> },
  { path: '/courses', element: <ManageCourses /> },
])


