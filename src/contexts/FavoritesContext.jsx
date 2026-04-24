import { createContext, useContext, useReducer, useCallback } from 'react'

const FavoritesContext = createContext(null)

const initialState = {
  favorites: [],
}

function favoritesReducer(state, action) {
  switch (action.type) {
    case 'ADD_FAVORITE':
      if (state.favorites.find(f => f.id === action.payload.id)) return state
      return { ...state, favorites: [action.payload, ...state.favorites] }
    case 'REMOVE_FAVORITE':
      return { ...state, favorites: state.favorites.filter(f => f.id !== action.payload) }
    case 'CLEAR_FAVORITES':
      return { ...state, favorites: [] }
    default:
      return state
  }
}

export function FavoritesProvider({ children }) {
  const [state, dispatch] = useReducer(favoritesReducer, initialState)

  const addFavorite = useCallback((coin) => {
    dispatch({ type: 'ADD_FAVORITE', payload: coin })
  }, [])

  const removeFavorite = useCallback((coinId) => {
    dispatch({ type: 'REMOVE_FAVORITE', payload: coinId })
  }, [])

  const clearFavorites = useCallback(() => {
    dispatch({ type: 'CLEAR_FAVORITES' })
  }, [])

  const isFavorite = useCallback((coinId) => {
    return state.favorites.some(f => f.id === coinId)
  }, [state.favorites])

  return (
    <FavoritesContext.Provider value={{
      favorites: state.favorites,
      addFavorite,
      removeFavorite,
      clearFavorites,
      isFavorite,
    }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider')
  return context
}
