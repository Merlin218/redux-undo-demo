import store from '../store'

export type RootState = ReturnType<typeof store.getState>

export interface Log {
  desc: string
  type: string
  value: number | { value: number }
}
