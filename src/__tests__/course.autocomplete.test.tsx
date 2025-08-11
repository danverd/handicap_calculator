import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CourseAutocomplete from '@components/course/CourseAutocomplete'
import { SnackbarProvider } from '@app/snackbar'
import { MockCourseProvider } from '@features/courses/courses.provider'

describe('CourseAutocomplete', () => {
  it('prioritizes saved/suggested groups and supports add course action', async () => {
    const provider = new MockCourseProvider()
    const onSelect = vi.fn()
    const onAddCourse = vi.fn()
    render(
      <SnackbarProvider>
        <CourseAutocomplete provider={provider} onSelect={onSelect} onAddCourse={onAddCourse} />
      </SnackbarProvider>
    )

    const input = screen.getByRole('combobox')
    await userEvent.click(input)
    await userEvent.type(input, 'Green')

    await waitFor(() => {
      // Saved or Results group labels appear (MUI renders them as headings)
      expect(screen.getAllByText(/Results|Saved/).length).toBeGreaterThan(0)
    })

    // Select from results
    const option = await screen.findByText('Green Hills')
    await userEvent.click(option)
    expect(onSelect).toHaveBeenCalled()

    // Trigger add action when no results
    await userEvent.clear(input)
    await userEvent.type(input, 'Nonexistent Course')
    const add = await screen.findByText(/Add "Nonexistent Course"/)
    await userEvent.click(add)
    expect(onAddCourse).toHaveBeenCalledWith('Nonexistent Course')
  })
})


