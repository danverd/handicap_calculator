/* eslint-disable react-refresh/only-export-components */
import { Alert, type AlertColor, Snackbar } from '@mui/material'
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type SnackbarMessage = { message: string; severity?: AlertColor; durationMs?: number }

interface SnackbarContextValue {
  notify: (msg: SnackbarMessage) => void
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined)

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext)
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider')
  return ctx
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState<SnackbarMessage | null>(null)

  const notify = useCallback((m: SnackbarMessage) => {
    setMsg(m)
    setOpen(true)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar open={open} autoHideDuration={msg?.durationMs ?? 4000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setOpen(false)} severity={msg?.severity ?? 'info'} variant="filled" sx={{ width: '100%' }}>
          {msg?.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  )
}

export default SnackbarProvider


