import { useEffect, useState } from 'react'
import { Button, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import type { Score } from '@types/index'
import { deleteAllScores, deleteScore, listScores } from '@features/scores/scores.db'
import { pairNineHoleDifferentials } from '@features/handicap/calc.engine'
import ConfirmDialog from '@components/common/ConfirmDialog'

export interface ScoreTableProps {
  onEdit: (score: Score) => void
}

export default function ScoreTable({ onEdit }: ScoreTableProps) {
  const [scores, setScores] = useState<Score[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pairMap, setPairMap] = useState<Record<string, string>>({})

  const refresh = async () => {
    const list = await listScores()
    setScores(list)
    // build a pairing map for 9-hole rounds
    const pairs = pairNineHoleDifferentials(list)
    const map: Record<string, string> = {}
    for (const p of pairs) {
      map[p.scoreIds[0]] = p.dates[1]
      map[p.scoreIds[1]] = p.dates[0]
    }
    setPairMap(map)
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleDelete = async (id: string) => {
    await deleteScore(id)
    refresh()
  }

  const handleDeleteAll = async () => {
    await deleteAllScores()
    setConfirmOpen(false)
    refresh()
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Score History</Typography>
        <Button color="error" onClick={() => setConfirmOpen(true)} disabled={scores.length === 0}>
          Delete all
        </Button>
      </Stack>
      <TableContainer component={Paper}>
        <Table size="small" aria-label="scores table">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Course</TableCell>
              <TableCell align="center">Holes</TableCell>
              <TableCell align="right">Score</TableCell>
              <TableCell align="right">Differential</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scores.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell>{s.date}</TableCell>
                <TableCell>{s.courseName}</TableCell>
                <TableCell align="center">
                  {s.holes === 18 ? (
                    '18'
                  ) : pairMap[s.id] ? (
                    `9 (paired with ${pairMap[s.id]})`
                  ) : (
                    '9 (waiting)'
                  )}
                </TableCell>
                <TableCell align="right">{s.grossScore}</TableCell>
                <TableCell align="right">{s.differential?.toFixed(1)}</TableCell>
                <TableCell align="right">
                  <IconButton aria-label={`Edit ${s.date}`} onClick={() => onEdit(s)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label={`Delete ${s.date}`} onClick={() => handleDelete(s.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {scores.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No scores yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDeleteAll}
        title="Delete all scores?"
        content="This action will permanently delete all saved scores."
        confirmText="Delete all"
      />
    </Stack>
  )
}


