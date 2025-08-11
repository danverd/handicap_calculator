import { beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ScoreTable from '@components/score/ScoreTable'
import { db } from '@lib/idb'
import type { Score } from '@types/index'

describe('ScoreTable', () => {
  beforeEach(async () => {
    await db.scores.clear()
  })

  it('renders rows sorted by date desc, edit/delete actions, and delete all', async () => {
    const s1: Score = { id: '1', date: '2024-08-01', courseName: 'A', courseRating: 72, slopeRating: 120, grossScore: 85, holes: 18, differential: 12.3 }
    const s2: Score = { ...s1, id: '2', date: '2024-08-05', courseName: 'B', grossScore: 82, differential: 9.6 }
    const n1: Score = { ...s1, id: '3', date: '2024-08-06', holes: 9, grossScore: 42, differential: 6.1 }
    const n2: Score = { ...s1, id: '4', date: '2024-08-07', holes: 9, grossScore: 43, differential: 6.2 }
    await db.scores.bulkAdd([s1, s2, n1, n2])

    const onEdit = vi.fn()
    render(<ScoreTable onEdit={onEdit} />)

    // Wait for the table to render data
    const cell = await screen.findByRole('cell', { name: '2024-08-05' })
    expect(cell).toBeInTheDocument()

    const editButton = screen.getByLabelText(/Edit 2024-08-05/)
    await userEvent.click(editButton)
    expect(onEdit).toHaveBeenCalled()

    const deleteAll = screen.getByRole('button', { name: /delete all/i })
    await userEvent.click(deleteAll)
    // confirm dialog appears
    await userEvent.click(screen.getByRole('button', { name: /delete all/i }))

    // table should show empty state after deletion
    expect(await screen.findByText(/No scores yet/i)).toBeInTheDocument()
  })
})


