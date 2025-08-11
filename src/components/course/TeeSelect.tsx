import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, Switch, TextField } from '@mui/material'
import type { Tee } from '@types/index'
import type { CourseProvider } from '@features/courses/courses.provider'
import { listTeesMerged } from '@features/courses/courses.service'
import { upsertTee } from '@features/courses/courses.db'
import { useSnackbar } from '@app/snackbar'

export interface TeeSelection {
  tee?: Tee
  override: boolean
  courseRating: number
  slopeRating: number
}

export interface TeeSelectProps {
  courseId: string
  provider: CourseProvider
  value?: TeeSelection
  onChange: (selection: TeeSelection) => void
  disabled?: boolean
}

function generateId() {
  // Prefer crypto.randomUUID() if available
  // @ts-expect-error - not in all TS lib targets
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id_${Math.random().toString(36).slice(2)}_${Date.now()}`
}

export default function TeeSelect({ courseId, provider, value, onChange, disabled }: TeeSelectProps) {
  const { notify } = useSnackbar()
  const [tees, setTees] = useState<Tee[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')
  const [override, setOverride] = useState<boolean>(value?.override ?? false)
  const [courseRating, setCourseRating] = useState<number>(value?.courseRating ?? 72)
  const [slopeRating, setSlopeRating] = useState<number>(value?.slopeRating ?? 113)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTee, setEditTee] = useState<Tee | null>(null)

  useEffect(() => {
    setLoading(true)
    listTeesMerged(courseId, provider)
      .then((list) => {
        setTees(list)
        // Initialize selection if not provided
        if (!value && list.length > 0) {
          const t = list[0]
          setSelectedId(t.id)
          setCourseRating(t.courseRating)
          setSlopeRating(t.slopeRating)
          onChange({ tee: t, override: false, courseRating: t.courseRating, slopeRating: t.slopeRating })
        }
      })
      .catch(() => {
        notify({ message: 'Failed to load tees. You can add a custom tee.', severity: 'warning' })
      })
      .finally(() => setLoading(false))
  }, [courseId, provider, onChange, value, notify])

  useEffect(() => {
    if (value) {
      setSelectedId(value.tee?.id ?? '')
      setOverride(value.override)
      setCourseRating(value.courseRating)
      setSlopeRating(value.slopeRating)
    }
  }, [value])

  const selectedTee = useMemo(() => tees.find((t) => t.id === selectedId), [tees, selectedId])

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const id = e.target.value
    setSelectedId(id)
    const t = tees.find((x) => x.id === id)
    if (t) {
      setCourseRating(t.courseRating)
      setSlopeRating(t.slopeRating)
      setOverride(false)
      onChange({ tee: t, override: false, courseRating: t.courseRating, slopeRating: t.slopeRating })
    }
  }

  const handleOverrideToggle = (checked: boolean) => {
    setOverride(checked)
    onChange({ tee: selectedTee, override: checked, courseRating, slopeRating })
  }

  const handleNumeric = (setter: (n: number) => void, next: number) => {
    setter(next)
    onChange({ tee: selectedTee, override, courseRating: next === courseRating ? courseRating : next, slopeRating: next === slopeRating ? slopeRating : next })
  }

  const openAddDialog = () => {
    setEditTee({ id: '', courseId, name: '', courseRating, slopeRating, holes: 18, source: 'user' })
    setDialogOpen(true)
  }

  const openEditDialog = () => {
    if (!selectedTee) return
    setEditTee(selectedTee)
    setDialogOpen(true)
  }

  const handleDialogSave = async (tee: Tee) => {
    const id = tee.id || generateId()
    const toSave: Tee = { ...tee, id, courseId }
    await upsertTee(toSave)
    const list = await listTeesMerged(courseId, provider)
    setTees(list)
    setSelectedId(id)
    setCourseRating(toSave.courseRating)
    setSlopeRating(toSave.slopeRating)
    setOverride(false)
    onChange({ tee: toSave, override: false, courseRating: toSave.courseRating, slopeRating: toSave.slopeRating })
    setDialogOpen(false)
  }

  return (
    <Stack spacing={2} direction="column">
      <FormControl fullWidth disabled={disabled}>
        <InputLabel id="tee-select-label">Tees</InputLabel>
        <Select
          labelId="tee-select-label"
          label="Tees"
          value={selectedId}
          onChange={handleSelectChange}
          MenuProps={{ disablePortal: true }}
        >
          {tees.map((t) => (
            <MenuItem key={t.id} value={t.id} disabled={loading}>
              {t.name} ({t.holes}) — {t.courseRating}/{t.slopeRating}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack direction="row" spacing={1}>
        <Button variant="outlined" onClick={openAddDialog} disabled={disabled}>Add custom tee</Button>
        <Button variant="text" onClick={openEditDialog} disabled={!selectedTee || disabled}>Edit selected tee</Button>
      </Stack>

      <FormControlLabel
        control={<Switch checked={override} onChange={(_, c) => handleOverrideToggle(c)} />}
        label="Override rating & slope for this score"
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Course rating"
          type="number"
          inputProps={{ step: 0.1, min: 60, max: 80 }}
          value={courseRating}
          onChange={(e) => handleNumeric(setCourseRating, Number(e.target.value))}
          disabled={!override || disabled}
        />
        <TextField
          label="Slope rating"
          type="number"
          inputProps={{ step: 1, min: 55, max: 155 }}
          value={slopeRating}
          onChange={(e) => handleNumeric(setSlopeRating, Number(e.target.value))}
          disabled={!override || disabled}
        />
      </Stack>

      <TeeDialog
        open={dialogOpen}
        tee={editTee}
        onClose={() => setDialogOpen(false)}
        onSave={handleDialogSave}
      />
    </Stack>
  )
}

interface TeeDialogProps {
  open: boolean
  tee: Tee | null
  onClose: () => void
  onSave: (tee: Tee) => void | Promise<void>
}

function TeeDialog({ open, tee, onClose, onSave }: TeeDialogProps) {
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


