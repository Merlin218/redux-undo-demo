import { Reducer } from 'react'
import { AnyAction } from '@reduxjs/toolkit'
import { produceWithPatches, Draft, enablePatches } from 'immer'
import { UndoActionType } from './actions'
import { createHistory, undoHistory, redoHistory, addRecord, handleReturnState } from './utils'

enablePatches()

export const undoable = <S extends Object, A extends AnyAction>(reducer: Reducer<S, A>) => {
  let initState = reducer(undefined as any, {} as any)
  const history = createHistory(initState)
  return (state: S = initState, action: A) => {
    const { type } = action
    switch (type) {
      case UndoActionType['@UNDO']:
        undoHistory(history)
        break
      case UndoActionType['@REDO']:
        redoHistory(history)
        break
      default:
        const [nextState, patches, inversePatches] = produceWithPatches(state, (draft: Draft<any>) => reducer(draft, action))
        // 如果有产生补丁，才创建记录
        if (patches.length > 0 && inversePatches.length > 0) {
          addRecord(history, nextState, {
            actionType: type,
            patches,
            inversePatches,
          })
        }
    }
    return handleReturnState(history)
  }
}

export * from './actions'
