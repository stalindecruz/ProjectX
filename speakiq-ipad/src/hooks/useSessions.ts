import { useEffect, useCallback } from 'react'
import { useAppContext } from '../context/AppContext'
import { getSessions, saveSession, clearSessions } from '../services/storageService'
import { Session } from '../types'

export function useSessions() {
  const { state, dispatch } = useAppContext()

  useEffect(() => {
    getSessions().then(sessions => dispatch({ type: 'SET_SESSIONS', payload: sessions }))
  }, [])

  const addSession = useCallback(async (session: Session) => {
    await saveSession(session)
    dispatch({ type: 'ADD_SESSION', payload: session })
  }, [dispatch])

  const deleteAllSessions = useCallback(async () => {
    await clearSessions()
    dispatch({ type: 'CLEAR_SESSIONS' })
  }, [dispatch])

  return {
    sessions: state.sessions,
    addSession,
    deleteAllSessions,
  }
}
