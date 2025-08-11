import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { SnackbarProvider } from '@app/snackbar'
import Dashboard from '@pages/Dashboard'
import NewScore from '@pages/NewScore'
import ManageCourses from '@pages/ManageCourses'

const routes = [
  { path: '/', element: <Dashboard /> },
  { path: '/scores/new', element: <NewScore /> },
  { path: '/courses', element: <ManageCourses /> },
]

function renderWithProviders(initialEntries: string[]) {
  const queryClient = new QueryClient()
  const router = createMemoryRouter(routes, { initialEntries })
  return render(
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <RouterProvider router={router} />
      </SnackbarProvider>
    </QueryClientProvider>
  )
}

describe('App routing', () => {
  it('renders Dashboard at /', () => {
    renderWithProviders(['/'])
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })

  it('renders New Score at /scores/new', () => {
    renderWithProviders(['/scores/new'])
    expect(screen.getByRole('heading', { name: /new score/i })).toBeInTheDocument()
  })

  it('renders Manage Courses at /courses', () => {
    renderWithProviders(['/courses'])
    expect(screen.getByRole('heading', { name: /manage courses/i })).toBeInTheDocument()
  })
})


