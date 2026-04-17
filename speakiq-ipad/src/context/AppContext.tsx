import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { Session, CoachResult, Metrics } from '../types'

interface AppState {
  sessions: Session[]
  lastResult: CoachResult | null
  isAnalyzing: boolean
  apiKey: string
  toastMessage: string | null
  toastType: 'default' | 'success' | 'error'
}

type AppAction =
  | { type: 'SET_SESSIONS'; payload: Session[] }
  | { type: 'ADD_SESSION'; payload: Session }
  | { type: 'SET_RESULT'; payload: CoachResult | null }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SHOW_TOAST'; payload: { message: string; toastType: 'default' | 'success' | 'error' } }
  | { type: 'HIDE_TOAST' }
  | { type: 'CLEAR_SESSIONS' }

const initialState: AppState = {
  sessions: [],
  lastResult: null,
  isAnalyzing: false,
  apiKey: '',
  toastMessage: null,
  toastType: 'default',
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload }
    case 'ADD_SESSION':
      return { ...state, sessions: [action.payload, ...state.sessions] }
    case 'SET_RESULT':
      return { ...state, lastResult: action.payload }
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload }
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload }
    case 'SHOW_TOAST':
      return { ...state, toastMessage: action.payload.message, toastType: action.payload.toastType }
    case 'HIDE_TOAST':
      return { ...state, toastMessage: null }
    case 'CLEAR_SESSIONS':
      return { ...state, sessions: [] }
    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
