import { useMemo, useState } from 'react'
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Course, Score, Tee } from '@types/index'
import CourseAutocomplete from '@components/course/CourseAutocomplete'
import TeeSelect, { type TeeSelection } from '@components/course/TeeSelect'
import type { CourseProvider } from '@features/courses/courses.provider'
import { computeDifferential } from '@features/handicap/calc.engine'

const schema = z.object({
  date: z.string().min(1, 'Date is required'),
  grossScore: z
    .number({ invalid_type_error: 'Gross score is required' })
    .min(20, 'Too low')
    .max(200, 'Too high'),
  holes: z.union([z.literal(9), z.literal(18)]),
  courseName: z.string().min(1, 'Course is required'),
  courseRating: z.number().min(60).max(80),
  slopeRating: z.number().min(55).max(155),
})

export type ScoreFormValues = z.infer<typeof schema>

export interface ScoreFormProps {
  provider: CourseProvider
  defaultValues?: Partial<ScoreFormValues>
  onSubmit: (score: Score) => void
}

export default function ScoreForm({ provider, defaultValues, onSubmit }: ScoreFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ScoreFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      holes: 18,
      ...defaultValues,
    },
  })

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [teeSel, setTeeSel] = useState<TeeSelection | undefined>(undefined)

  const values = watch()
  const previewDiff = useMemo(() => {
    const valid = values.courseRating && values.slopeRating && values.grossScore
    if (!valid) return undefined
    const tempScore: Score = {
      id: 'preview',
      date: values.date,
      courseName: values.courseName ?? selectedCourse?.name ?? '',
      courseRating: values.courseRating,
      slopeRating: values.slopeRating,
      grossScore: values.grossScore,
      holes: values.holes,
    }
    return computeDifferential(tempScore)
  }, [values, selectedCourse])

  const onCourseSelect = (course: Course) => {
    setSelectedCourse(course)
    setValue('courseName', course.name)
  }

  const onTeeChange = (sel: TeeSelection) => {
    setTeeSel(sel)
    setValue('courseRating', sel.courseRating)
    setValue('slopeRating', sel.slopeRating)
  }

  const submit = (data: ScoreFormValues) => {
    const tee: Tee | undefined = teeSel?.tee
    const score: Score = {
      id: crypto.randomUUID(),
      date: data.date,
      courseId: selectedCourse?.id,
      courseName: data.courseName,
      teeId: tee?.id,
      teeName: tee?.name,
      courseRating: data.courseRating,
      slopeRating: data.slopeRating,
      grossScore: data.grossScore,
      holes: data.holes,
    }
    onSubmit(score)
  }

  return (
    <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Date of round"
            type="date"
            InputLabelProps={{ shrink: true }}
            error={!!errors.date}
            helperText={errors.date?.message}
            {...register('date')}
          />
          <TextField select label="9 or 18 holes" defaultValue={18} {...register('holes', { valueAsNumber: true })}>
            <MenuItem value={9}>9 holes</MenuItem>
            <MenuItem value={18}>18 holes</MenuItem>
          </TextField>
          <TextField
            label="Gross score"
            type="number"
            inputProps={{ min: 20, max: 200 }}
            error={!!errors.grossScore}
            helperText={errors.grossScore?.message}
            {...register('grossScore', { valueAsNumber: true })}
          />
        </Stack>

        <CourseAutocomplete provider={provider} onSelect={onCourseSelect} />
        <input type="hidden" {...register('courseName')} />

        {selectedCourse && (
          <TeeSelect
            courseId={selectedCourse.id}
            provider={provider}
            value={teeSel}
            onChange={onTeeChange}
          />
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Course rating"
            type="number"
            inputProps={{ min: 60, max: 80, step: 0.1 }}
            error={!!errors.courseRating}
            helperText={errors.courseRating?.message}
            {...register('courseRating', { valueAsNumber: true })}
          />
          <TextField
            label="Slope rating"
            type="number"
            inputProps={{ min: 55, max: 155, step: 1 }}
            error={!!errors.slopeRating}
            helperText={errors.slopeRating?.message}
            {...register('slopeRating', { valueAsNumber: true })}
          />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {previewDiff !== undefined ? `Differential preview: ${previewDiff.toFixed(1)}` : 'Enter score and ratings to see a preview'}
        </Typography>

        <Stack direction="row" spacing={2}>
          <Button type="submit" variant="contained">
            Save Score
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}


