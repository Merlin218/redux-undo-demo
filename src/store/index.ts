import { configureStore } from '@reduxjs/toolkit'
import countReducer from './counter'
import { undoable } from './middlewares/undo'

const store = configureStore({
  reducer: {
    counter: undoable(countReducer),
  },
})

export default store
