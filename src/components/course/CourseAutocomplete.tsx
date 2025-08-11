import { useEffect, useMemo, useRef, useState } from 'react'
import { Autocomplete, CircularProgress, TextField } from '@mui/material'
import type { Course } from '@types/index'
import type { CourseProvider } from '@features/courses/courses.provider'
import { searchCoursesMerged } from '@features/courses/courses.service'
import { useSnackbar } from '@app/snackbar'

type Section = 'Saved' | 'Results'

type CourseOption = {
  key: string
  label: string
  section: Section
  course: Course
  optionType: 'course'
}

type AddOption = {
  key: string
  label: string
  section: Section
  optionType: 'add'
  query: string
}

type Option = CourseOption | AddOption

export interface CourseAutocompleteProps {
  label?: string
  provider: CourseProvider
  onSelect: (course: Course) => void
  onAddCourse?: (name: string) => void
  autoFocus?: boolean
  disabled?: boolean
}

export default function CourseAutocomplete({ label = 'Course', provider, onSelect, onAddCourse, autoFocus, disabled }: CourseAutocompleteProps) {
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<Option[]>([])
  const debounceRef = useRef<number | null>(null)
  const { notify } = useSnackbar()

  const groupedOptions = useMemo(() => options, [options])

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    setLoading(true)
    debounceRef.current = window.setTimeout(async () => {
      try {
        const { saved, results } = await searchCoursesMerged(inputValue, provider)
        const next: Option[] = [
          ...saved.map<Option>((c) => ({ key: `saved-${c.id}`, label: c.name, section: 'Saved', course: c, optionType: 'course' })),
          ...results.map<Option>((c) => ({ key: `res-${c.id}`, label: c.name, section: 'Results', course: c, optionType: 'course' })),
        ]
        if (next.length === 0 && onAddCourse && inputValue.trim().length > 0) {
          next.push({ key: 'add', label: `Add "${inputValue}"`, section: 'Results', optionType: 'add', query: inputValue })
        }
        setOptions(next)
      } catch {
        notify({ message: 'Failed to search courses. You can add a course manually.', severity: 'warning' })
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [inputValue, provider, onAddCourse, notify])

  return (
    <Autocomplete
      options={groupedOptions}
      groupBy={(opt) => opt.section}
      getOptionLabel={(opt) => opt.label}
      loading={loading}
      filterOptions={(x) => x}
      onChange={(_, value) => {
        if (!value) return
        if (value.optionType === 'add' && onAddCourse) {
          onAddCourse(value.query)
          return
        }
        if (value.optionType === 'course') {
          onSelect(value.course)
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={(event) => setInputValue(event.target.value)}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      isOptionEqualToValue={(a, b) => a.key === b.key}
    />
  )
}


