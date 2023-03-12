import { useState, FC, ReactNode, useMemo } from 'react'
import { Provider, connect, ConnectedProps, useDispatch } from 'react-redux'
import store from './store'
import { add, subtract } from './store/counter'
import { redoAction, undoAction } from './store/middlewares/undo'
import { RootState } from './types'

interface UpdaterProps {
  trigger: (value: number) => void
  tip?: ReactNode
}

const Updater: FC<UpdaterProps> = ({ trigger, tip }) => {
  const [value, setValue] = useState(1)
  return (
    <div>
      {tip}
      <input value={value} onInput={(e) => setValue(Number(e.currentTarget.value))} />
      <button onClick={() => trigger(value)}>确认</button>
    </div>
  )
}

const reduxConnector = connect((state: RootState) => ({
  value: state.counter.value,
  canUndo: state.counter['@@UNDOABLE'].canUndo,
  canRedo: state.counter['@@UNDOABLE'].canRedo,
  patchStack: state.counter['@@UNDOABLE'].patchStack,
  current: state.counter['@@UNDOABLE'].current,
}))

interface CompProps extends ConnectedProps<typeof reduxConnector> {}

const Comp: FC<CompProps> = function ({ value, canUndo, canRedo, patchStack, current }) {
  const dispatch = useDispatch()

  const Histrory = useMemo(() => {
    if (!patchStack || patchStack.length === 0) {
      return '无'
    }
    return patchStack
      .map((item, index) => {
        return `${current === index ? '🔸' : ''}<${item.actionType}>`
      })
      .join(' ➡️ ')
  }, [current, patchStack])

  const Handler = useMemo(() => {
    return (
      <>
        <button disabled={!canUndo} onClick={() => dispatch(undoAction())}>
          撤销
        </button>
        <button disabled={!canRedo} onClick={() => dispatch(redoAction())}>
          重做
        </button>
      </>
    )
  }, [dispatch, canUndo, canRedo])

  return (
    <>
      <div>当前：{value}</div>
      <Updater tip="加" trigger={(value) => dispatch(add(value))}></Updater>
      <Updater tip="减" trigger={(value) => dispatch(subtract(value))}></Updater>
      <div>操作历史：{Histrory}</div>
      <div>操作：{Handler}</div>
    </>
  )
}

const UndoDemo = reduxConnector(Comp)

export default function App() {
  return (
    <Provider store={store}>
      <UndoDemo />
    </Provider>
  )
}
