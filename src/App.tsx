import { useReducer, type ReactNode } from 'react'
import styles from './App.module.css'

// ─── State ────────────────────────────────────────────────────────────────────

export type View = 'editor' | 'rsvp'

export interface AppState {
  view: View
  text: string
  words: string[]
  currentIndex: number
  wpm: number
}

type AppAction =
  | { type: 'SET_VIEW'; view: View }
  | { type: 'SET_TEXT'; text: string; words: string[] }
  | { type: 'SET_CURRENT_INDEX'; index: number }
  | { type: 'SET_WPM'; wpm: number }
  | { type: 'CLEAR' }

const initialState: AppState = {
  view: 'editor',
  text: '',
  words: [],
  currentIndex: 0,
  wpm: 300,
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.view }
    case 'SET_TEXT':
      return { ...state, text: action.text, words: action.words, currentIndex: 0 }
    case 'SET_CURRENT_INDEX':
      return { ...state, currentIndex: action.index }
    case 'SET_WPM':
      return { ...state, wpm: action.wpm }
    case 'CLEAR':
      return { ...initialState }
    default:
      return state
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────

export function App(): ReactNode {
  const [state, dispatch] = useReducer(reducer, initialState)

  const handleSetView = (view: View) => dispatch({ type: 'SET_VIEW', view })

  return (
    <div className={styles.root}>
      {state.view === 'editor' ? (
        <EditorViewShell state={state} dispatch={dispatch} onSetView={handleSetView} />
      ) : (
        <RSVPViewShell state={state} dispatch={dispatch} onSetView={handleSetView} />
      )}
    </div>
  )
}

// ─── Placeholder shells (implementados en fases posteriores) ─────────────────

import { EditorView } from './components/EditorView/EditorView'
import { RSVPView } from './components/RSVPView/RSVPView'

function EditorViewShell({
  state,
  dispatch,
  onSetView,
}: {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  onSetView: (view: View) => void
}) {
  return (
    <EditorView
      text={state.text}
      words={state.words}
      currentIndex={state.currentIndex}
      wpm={state.wpm}
      _onTextChange={(text, words) => dispatch({ type: 'SET_TEXT', text, words })}
      onWpmChange={(wpm) => dispatch({ type: 'SET_WPM', wpm })}
      onRead={() => onSetView('rsvp')}
      onClear={() => dispatch({ type: 'CLEAR' })}
    />
  )
}

function RSVPViewShell({
  state,
  dispatch,
  onSetView,
}: {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  onSetView: (view: View) => void
}) {
  return (
    <RSVPView
      words={state.words}
      currentIndex={state.currentIndex}
      wpm={state.wpm}
      _onIndexChange={(index) => dispatch({ type: 'SET_CURRENT_INDEX', index })}
      _onWpmChange={(wpm) => dispatch({ type: 'SET_WPM', wpm })}
      onExit={() => onSetView('editor')}
    />
  )
}