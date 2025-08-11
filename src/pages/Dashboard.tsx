import { Container, Stack, Typography, Button } from '@mui/material'
import { useEffect, useState } from 'react'
import type { Score } from '@types/index'
import { listScores } from '@features/scores/scores.db'
import HandicapSummary from '@components/calc/HandicapSummary'
import ScoreTable from '@components/score/ScoreTable'
import { useNavigate } from 'react-router-dom'
import { Link as RouterLink } from 'react-router-dom'

export default function Dashboard() {
  const [scores, setScores] = useState<Score[]>([])
  const navigate = useNavigate()
  useEffect(() => {
    listScores().then(setScores)
  }, [])
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Dashboard</Typography>
        <Button variant="contained" component={RouterLink} to="/scores/new">
          New Score
        </Button>
      </Stack>
      <HandicapSummary scores={scores} />
      <ScoreTable onEdit={(s) => navigate(`/scores/new?edit=${s.id}`)} />
    </Container>
  )
}


