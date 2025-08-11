import { Container, Typography } from '@mui/material'
import ScoreForm from '@components/score/ScoreForm'
import { MockCourseProvider } from '@features/courses/courses.provider'
import type { Score } from '@types/index'
import { addScore } from '@features/scores/scores.db'
import { useSnackbar } from '@app/snackbar'

export default function NewScore() {
  const provider = new MockCourseProvider()
  const { notify } = useSnackbar()
  const handleSubmit = async (score: Score) => {
    try {
      await addScore(score)
      notify({ message: 'Score saved', severity: 'success' })
    } catch {
      notify({ message: 'Failed to save score', severity: 'error' })
    }
  }
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h5" gutterBottom>
        New Score
      </Typography>
      <ScoreForm provider={provider} onSubmit={handleSubmit} />
    </Container>
  )
}


