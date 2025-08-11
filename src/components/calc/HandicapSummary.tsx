import { Accordion, AccordionDetails, AccordionSummary, Chip, Stack, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { Score } from '@types/index'
import { buildDifferentials, selectUsedDifferentials } from '@features/handicap/calc.engine'

export interface HandicapSummaryProps {
  scores: Score[]
}

export default function HandicapSummary({ scores }: HandicapSummaryProps) {
  const diffs = buildDifferentials(scores)
  const breakdown = selectUsedDifferentials(diffs)

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Current Handicap Index</Typography>
      {breakdown.message ? (
        <Typography color="text.secondary">{breakdown.message}</Typography>
      ) : (
        <Typography variant="h3" component="div">{breakdown.index.toFixed(1)}</Typography>
      )}

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Calculation details</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            {breakdown.message ? (
              <Typography color="text.secondary">No calculation until minimum scores are entered.</Typography>
            ) : (
              <>
                <Typography variant="body2">
                  Used {breakdown.ruleApplied.usedCount} of {breakdown.ruleApplied.scoresCount} differentials ×{' '}
                  {breakdown.ruleApplied.multiplier?.toFixed(2)}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {diffs.map((d) => {
                    const used = breakdown.usedDifferentials.some((u) => u.scoreId === d.scoreId && u.differential === d.differential)
                    return (
                      <Chip
                        key={`${d.scoreId}-${d.date}`}
                        label={`${d.differential.toFixed(1)} (${d.date})`}
                        color={used ? 'primary' : 'default'}
                        variant={used ? 'filled' : 'outlined'}
                      />
                    )
                  })}
                </Stack>
              </>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  )
}


