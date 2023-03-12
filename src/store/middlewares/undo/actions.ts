export const enum UndoActionType {
  '@UNDO' = '@UNDO',
  '@REDO' = '@REDO',
}

export const undoAction = () => ({
  type: UndoActionType['@UNDO'],
})

export const redoAction = () => ({
  type: UndoActionType['@REDO'],
})
