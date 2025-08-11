import { useEffect, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'
import type { Tee } from '@types/index'

export interface TeeDialogProps {
  open: boolean
  tee: Tee | null
  onClose: () => void
  onSave: (tee: Tee) => void | Promise<void>
}

export default function TeeDialog({ open, tee, onClose, onSave }: TeeDialogProps) {
  const [name, setName] = useState(tee?.name ?? '')
  const [rating, setRating] = useState(tee?.courseRating ?? 72)
  const [slope, setSlope] = useState(tee?.slopeRating ?? 113)
  const [holes] = useState(tee?.holes ?? 18)

  useEffect(() => {
    setName(tee?.name ?? '')
    setRating(tee?.courseRating ?? 72)
    setSlope(tee?.slopeRating ?? 113)
  }, [tee])

  const handleSave = async () => {
    if (!tee) return
    await onSave({ ...tee, name, courseRating: Number(rating), slopeRating: Number(slope), holes })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{tee?.id ? 'Edit tee' : 'Add tee'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField label="Tee name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <Box display="flex" gap={2}>
            <TextField label="Course rating" type="number" inputProps={{ step: 0.1, min: 60, max: 80 }} value={rating} onChange={(e) => setRating(Number(e.target.value))} />
            <TextField label="Slope rating" type="number" inputProps={{ step: 1, min: 55, max: 155 }} value={slope} onChange={(e) => setSlope(Number(e.target.value))} />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!name.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}


