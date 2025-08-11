import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TeeSelect from '@components/course/TeeSelect'
import { SnackbarProvider } from '@app/snackbar'
import { MockCourseProvider } from '@features/courses/courses.provider'

describe('TeeSelect', () => {
  it('loads tees, allows override, and supports add/edit tee', async () => {
    const provider = new MockCourseProvider()
    const onChange = vi.fn()
    render(
      <SnackbarProvider>
        <TeeSelect courseId="api-1" provider={provider} onChange={onChange} />
      </SnackbarProvider>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/tees/i)).toBeInTheDocument()
    })

    // Enable override and change numbers
    const toggle = screen.getByRole('switch', { name: /override rating/i })
    await userEvent.click(toggle)
    const rating = screen.getByLabelText(/course rating/i)
    await userEvent.clear(rating)
    await userEvent.type(rating, '71.5')
    expect(onChange).toHaveBeenCalled()

    // Add custom tee
    await userEvent.click(screen.getByRole('button', { name: /add custom tee/i }))
    const teeNameInput = await screen.findByLabelText(/tee name/i)
    await userEvent.type(teeNameInput, 'Blue Custom')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText(/blue custom/i)).toBeInTheDocument()
  })
})


