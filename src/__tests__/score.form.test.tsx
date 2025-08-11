import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ScoreForm from '@components/score/ScoreForm'
import { SnackbarProvider } from '@app/snackbar'
import { MockCourseProvider } from '@features/courses/courses.provider'

describe('ScoreForm', () => {
  it('validates required fields and shows differential preview', async () => {
    const provider = new MockCourseProvider()
    const onSubmit = vi.fn()
    render(
      <SnackbarProvider>
        <ScoreForm provider={provider} onSubmit={onSubmit} />
      </SnackbarProvider>
    )

    // enter gross score
    const gross = screen.getByLabelText(/gross score/i)
    await userEvent.clear(gross)
    await userEvent.type(gross, '85')

    // select a course
    const courseInput = screen.getAllByRole('combobox')[1]
    await userEvent.click(courseInput)
    await userEvent.type(courseInput, 'Sea')
    const option = await screen.findByText(/Sea Breeze/i)
    await userEvent.click(option)

    // tees appear; leave defaults; preview should show
    await waitFor(() => {
      expect(screen.getByText(/Differential preview:/i)).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /save score/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  })
})


