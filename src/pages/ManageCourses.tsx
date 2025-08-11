import { Container, Typography, Stack, Paper, List, ListItem, ListItemText, IconButton, Button, Collapse } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useEffect, useState } from 'react'
import type { Course, Tee } from '@types/index'
import { deleteCourse, listCourses, upsertCourse, upsertTee } from '@features/courses/courses.db'
import { MockCourseProvider } from '@features/courses/courses.provider'
import CourseAutocomplete from '@components/course/CourseAutocomplete'
import TeeDialog from '@components/course/TeeDialog'

export default function ManageCourses() {
  const provider = new MockCourseProvider()
  const [courses, setCourses] = useState<Course[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [teeDialogOpen, setTeeDialogOpen] = useState(false)
  const [teeEditing, setTeeEditing] = useState<Tee | null>(null)
  // Keep selectedCourseId for potential extended interactions; currently unused after save triggers refresh
  // const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const refresh = async () => {
    const list = await listCourses()
    setCourses(list)
  }

  useEffect(() => {
    refresh()
  }, [])

  const onAddCourse = async (name: string) => {
    const id = crypto.randomUUID()
    const course: Course = { id, name, source: 'user', tees: [], updatedAt: new Date().toISOString() }
    await upsertCourse(course)
    refresh()
  }

  const onSelectCourse = async (course: Course) => {
    await upsertCourse({ ...course, source: 'api', updatedAt: new Date().toISOString() })
    refresh()
  }

  const toggleExpand = async (courseId: string) => {
    setExpanded((prev) => ({ ...prev, [courseId]: !prev[courseId] }))
  }

  const onEditTee = (_courseId: string, tee: Tee) => {
    setTeeEditing(tee)
    setTeeDialogOpen(true)
  }

  const onAddTee = (courseId: string) => {
    setTeeEditing({ id: '', courseId, name: '', courseRating: 72, slopeRating: 113, holes: 18, source: 'user' })
    setTeeDialogOpen(true)
  }

  const onSaveTee = async (tee: Tee) => {
    const id = tee.id || crypto.randomUUID()
    await upsertTee({ ...tee, id })
    setTeeDialogOpen(false)
    // Refresh courses list to reflect tees in expanded rows
    refresh()
  }

  const onDeleteCourse = async (id: string) => {
    await deleteCourse(id)
    refresh()
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h5" gutterBottom>
        Manage Courses
      </Typography>
      <Stack spacing={2} mb={3}>
        <CourseAutocomplete provider={provider} onSelect={onSelectCourse} onAddCourse={onAddCourse} />
      </Stack>
      <Paper>
        <List>
          {courses.map((c) => (
            <>
              <ListItem
                key={c.id}
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <IconButton aria-label="toggle" onClick={() => toggleExpand(c.id)}>
                      {expanded[c.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <IconButton aria-label="delete" onClick={() => onDeleteCourse(c.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemText primary={c.name} secondary={[c.city, c.state].filter(Boolean).join(', ')} />
              </ListItem>
              <Collapse in={!!expanded[c.id]} timeout="auto" unmountOnExit>
                <Stack spacing={1} sx={{ px: 2, pb: 2 }}>
                  <Button variant="outlined" size="small" onClick={() => onAddTee(c.id)}>
                    Add tee
                  </Button>
                  <List dense>
                    {c.tees.length === 0 ? (
                      <ListItem>
                        <ListItemText primary="No tees cached yet" />
                      </ListItem>
                    ) : (
                      c.tees.map((t) => (
                        <ListItem
                          key={t.id}
                          secondaryAction={
                            <IconButton aria-label="edit tee" onClick={() => onEditTee(c.id, t)}>
                              <EditIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText primary={`${t.name} — ${t.courseRating}/${t.slopeRating}`} />
                        </ListItem>
                      ))
                    )}
                  </List>
                </Stack>
              </Collapse>
            </>
          ))}
        </List>
      </Paper>

      <TeeDialog open={teeDialogOpen} tee={teeEditing} onClose={() => setTeeDialogOpen(false)} onSave={onSaveTee} />
    </Container>
  )
}


