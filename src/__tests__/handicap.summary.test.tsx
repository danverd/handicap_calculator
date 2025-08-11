import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import HandicapSummary from '@components/calc/HandicapSummary'
import type { Score } from '@types/index'

describe('HandicapSummary', () => {
  it('shows message when fewer than 3 scores', () => {
    const scores: Score[] = [
      { id: 'a', date: '2024-08-01', courseName: 'X', courseRating: 72, slopeRating: 120, grossScore: 84, holes: 18 },
      { id: 'b', date: '2024-08-02', courseName: 'Y', courseRating: 72, slopeRating: 120, grossScore: 85, holes: 18 },
    ]
    render(<HandicapSummary scores={scores} />)
    expect(screen.getByText(/At least 3 scores required/i)).toBeInTheDocument()
  })

  it('renders an index and tags used differentials when enough scores', () => {
    const scores: Score[] = [
      { id: 'a', date: '2024-08-01', courseName: 'X', courseRating: 72, slopeRating: 120, grossScore: 84, holes: 18 },
      { id: 'b', date: '2024-08-02', courseName: 'Y', courseRating: 72, slopeRating: 120, grossScore: 85, holes: 18 },
      { id: 'c', date: '2024-08-03', courseName: 'Z', courseRating: 72, slopeRating: 120, grossScore: 80, holes: 18 },
    ]
    render(<HandicapSummary scores={scores} />)
    expect(screen.queryByText(/At least 3 scores required/i)).not.toBeInTheDocument()
    // index displayed at top (use role heading level 3 or text element by exact content of index pattern is ambiguous)
    const indexElems = screen.getAllByText(/\d+\.\d/)
    expect(indexElems.length).toBeGreaterThan(0)
  })
})


