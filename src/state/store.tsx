import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { AppState, Bogen, ClassId, Lauf, SheetTypeId } from '../types'
import { klassenListenOrder } from '../config/active'
import { allDemoNumbers } from '../lib/demo'
import { cellKey } from '../lib/scoring'
import { clearState, loadState, saveState } from '../lib/storage'

function uid(prefix: string): string {
  return prefix + '_' + Math.random().toString(36).slice(2, 9)
}

/** Standard-Zusammenstellung: je ein Bogen pro Position für Klasse 3, Lauf 1. */
function defaultBoegen(): Bogen[] {
  return klassenListenOrder().map((t) => ({ id: uid('bg'), typeId: t, klasse: '3', lauf: 1 }))
}

// Lazy erzeugt (nicht als Modul-Konstante), damit die geladene Konfiguration
// berücksichtigt wird.
function defaultState(): AppState {
  return {
    eventName: '30. Möwepokal 2026',
    emptyRows: 3,
    numbers: allDemoNumbers(),
    wkr: {},
    boegen: defaultBoegen(),
    values: {},
    initialized: false,
  }
}

export type Action =
  | { type: 'SET_EVENT'; eventName: string }
  | { type: 'SET_EMPTY_ROWS'; emptyRows: number }
  | { type: 'SET_NUMBERS'; klasse: ClassId; numbers: number[] }
  | { type: 'SET_WKR'; bogenId: string; name: string }
  | { type: 'ADD_BOGEN'; typeId: SheetTypeId; klasse: ClassId; lauf: Lauf }
  | { type: 'ADD_BOEGEN_BULK'; items: { typeId: SheetTypeId; klasse: ClassId; lauf: Lauf }[] }
  | { type: 'CLEAR_BOEGEN' }
  | { type: 'UPDATE_BOGEN'; id: string; patch: Partial<Omit<Bogen, 'id'>> }
  | { type: 'REMOVE_BOGEN'; id: string }
  | { type: 'MOVE_BOGEN'; id: string; dir: -1 | 1 }
  | { type: 'SET_VALUE'; bogenId: string; cell: string; value: string }
  | { type: 'CLEAR_VALUES'; bogenId: string }
  | { type: 'MARK_INITIALIZED' }
  | { type: 'RESET_ALL' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_EVENT':
      return { ...state, eventName: action.eventName }

    case 'SET_EMPTY_ROWS':
      return { ...state, emptyRows: Math.max(0, Math.min(30, action.emptyRows)) }

    case 'SET_NUMBERS':
      return { ...state, numbers: { ...state.numbers, [action.klasse]: action.numbers } }

    case 'SET_WKR':
      return { ...state, wkr: { ...state.wkr, [action.bogenId]: action.name } }

    case 'ADD_BOGEN':
      return {
        ...state,
        boegen: state.boegen.concat({
          id: uid('bg'),
          typeId: action.typeId,
          klasse: action.klasse,
          lauf: action.lauf,
        }),
      }

    case 'ADD_BOEGEN_BULK':
      return {
        ...state,
        boegen: state.boegen.concat(
          action.items.map((it) => ({ id: uid('bg'), ...it })),
        ),
      }

    case 'CLEAR_BOEGEN':
      return { ...state, boegen: [] }

    case 'UPDATE_BOGEN':
      return {
        ...state,
        boegen: state.boegen.map((b) => (b.id === action.id ? { ...b, ...action.patch } : b)),
      }

    case 'REMOVE_BOGEN':
      return { ...state, boegen: state.boegen.filter((b) => b.id !== action.id) }

    case 'MOVE_BOGEN': {
      const i = state.boegen.findIndex((b) => b.id === action.id)
      const j = i + action.dir
      if (i < 0 || j < 0 || j >= state.boegen.length) return state
      const boegen = state.boegen.slice()
      ;[boegen[i], boegen[j]] = [boegen[j], boegen[i]]
      return { ...state, boegen }
    }

    case 'SET_VALUE': {
      const bogenValues = { ...(state.values[action.bogenId] ?? {}) }
      if (action.value === '') delete bogenValues[action.cell]
      else bogenValues[action.cell] = action.value
      return { ...state, values: { ...state.values, [action.bogenId]: bogenValues } }
    }

    case 'CLEAR_VALUES': {
      const values = { ...state.values }
      delete values[action.bogenId]
      return { ...state, values }
    }

    case 'MARK_INITIALIZED':
      return { ...state, initialized: true }

    case 'RESET_ALL':
      clearState()
      return defaultState()

    default:
      return state
  }
}

function init(): AppState {
  const loaded = loadState()
  if (loaded) return { ...defaultState(), ...loaded }
  return defaultState()
}

interface StoreContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  useEffect(() => {
    saveState(state)
  }, [state])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore muss innerhalb von StoreProvider verwendet werden')
  return ctx
}

/** Bequemer Lese-/Schreibzugriff auf eine einzelne Bogen-Zelle. */
export function useCell(bogenId: string) {
  const { state, dispatch } = useStore()
  const values = state.values[bogenId] ?? {}
  return {
    get: (nr: string, colKey: string, subIndex?: number) =>
      values[cellKey(nr, colKey, subIndex)] ?? '',
    getByKey: (key: string) => values[key] ?? '',
    set: (cell: string, value: string) => dispatch({ type: 'SET_VALUE', bogenId, cell, value }),
  }
}
