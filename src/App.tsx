import { useState, FC, ReactNode, useMemo } from "react";
import { Provider, connect, ConnectedProps, useDispatch } from "react-redux";
import store from "./store";
import { add, subtract } from "./store/counter";
import { redoAction, undoAction } from "./store/middlewares/undo";
import { RootState } from "./types";
import "./App.css";

interface UpdaterProps {
  trigger: (value: number) => void;
  tip?: ReactNode;
}

const Updater: FC<UpdaterProps> = ({ trigger, tip }) => {
  const [value, setValue] = useState(1);
  return (
    <tr>
      <td>{tip}</td>
      <td>
        <input
          value={value}
          onInput={(e) => setValue(Number(e.currentTarget.value))}
        />
        <button onClick={() => trigger(value)}>确认</button>
      </td>
    </tr>
  );
};

const reduxConnector = connect((state: RootState) => ({
  value: state.counter.value,
  canUndo: state.counter["@@UNDOABLE"].canUndo,
  canRedo: state.counter["@@UNDOABLE"].canRedo,
  patchStack: state.counter["@@UNDOABLE"].patchStack,
  current: state.counter["@@UNDOABLE"].current,
}));

interface CompProps extends ConnectedProps<typeof reduxConnector> {}

const Comp: FC<CompProps> = function ({
  value,
  canUndo,
  canRedo,
  patchStack,
  current,
}) {
  const dispatch = useDispatch();
  const [Logs, setLogs] = useState<string[]>([]);
  const undo = () => {
    setLogs((last) => [...last, "撤销"]);
    dispatch(undoAction());
  };

  const redo = () => {
    setLogs((last) => [...last, "重做"]);
    dispatch(redoAction());
  };

  const addHandler = (value: number) => {
    setLogs((last) => [...last, "加" + value]);
    dispatch(add(value));
  };

  const subtractHandler = (value: number) => {
    setLogs((last) => [...last, "减" + value]);
    dispatch(subtract(value));
  };

  const Histrory = useMemo(() => {
    if (!patchStack || patchStack.length === 0) {
      return "无";
    }
    return patchStack
      .map((item, index) => {
        return `${current === index ? "🔸" : ""}<${item.actionType}:${Math.abs(
          item.nextState.value - item.state.value
        )}>`;
      })
      .join(" ➡️ ");
  }, [current, patchStack]);

  const Handler = useMemo(() => {
    return (
      <>
        <button disabled={!canUndo} onClick={undo}>
          撤销
        </button>
        <button disabled={!canRedo} onClick={redo}>
          重做
        </button>
      </>
    );
  }, [dispatch, canUndo, canRedo]);

  return (
    <table>
      <tr>
        <td>当前：</td>
        <td>{value}</td>
      </tr>
      <Updater tip="加" trigger={addHandler}></Updater>
      <Updater tip="减" trigger={subtractHandler}></Updater>
      <tr>
        <td>操作：</td>
        <td>{Handler}</td>
      </tr>
      <tr>
        <td>操作栈：</td>
        <td>{Histrory}</td>
      </tr>
      <tr>
        <td>操作流水日志：</td>
        <td>{Logs.join(" ➡️ ")}</td>
      </tr>
    </table>
  );
};

const UndoDemo = reduxConnector(Comp);

export default function App() {
  return (
    <Provider store={store}>
      <UndoDemo />
    </Provider>
  );
}
