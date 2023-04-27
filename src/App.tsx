import { useState, FC, ReactNode, useMemo, useEffect, useCallback } from "react";
import { Provider, connect, ConnectedProps, useDispatch } from "react-redux";
import store from "./store";
import { 前进, 后退 } from "./store/counter";
import { redoAction, undoAction } from "./store/middlewares/undo";
import { RootState } from "./types";
import "./App.css";
import { FluentEmojiFlatCowboyHatFace } from "./icons/face";

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
          style={{
            marginRight: 20,
            textAlign: 'left'
          }}
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

interface CompProps extends ConnectedProps<typeof reduxConnector> { }

const treasurePosition = 3;

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
    setLogs((last) => [...last, "时空回退"]);
    dispatch(undoAction());
  };

  const redo = () => {
    setLogs((last) => [...last, "时空还原"]);
    dispatch(redoAction());
  };

  const addHandler = (value: number) => {
    setLogs((last) => [...last, "前进" + value]);
    dispatch(前进(value));
  };

  const subtractHandler = (value: number) => {
    setLogs((last) => [...last, "后退" + value]);
    dispatch(后退(value));
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
        <button style={{
          marginRight: 20,
        }} disabled={!canUndo} onClick={undo}>
          时空回退（撤销）
        </button>
        <button disabled={!canRedo} onClick={redo}>
          时空还原（重做）
        </button>
      </>
    );
  }, [dispatch, canUndo, canRedo]);

  const [times, setTimes] = useState(0);
  const judge = useCallback((index: number) => {
    if (times < 2) {
      return index === treasurePosition
    } else {
      return index === value
    }
  }, [value, times])
  useEffect(() => {
    if (value === treasurePosition) {
      setTimes((last) => last + 1);
    }
  }, [value])

  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'space-evenly',
        width: '100%'
      }}>
        {Array(10).fill(0).map((_, index) => index).map((item) => (
          <div style={{
            display: 'flex',
            flexDirection: 'column'
          }} key={item}>
            <FluentEmojiFlatCowboyHatFace style={{
              visibility: item !== value ? 'hidden' : 'visible',
            }} />
            {item}
            {judge(item) && <div>💎</div>}
          </div>
        ))}
      </div>
      <table style={{
        marginTop: 30,
        width: '100%'
      }}>
        <tr>
          <th style={{
            width: 150
          }}></th>
          <th></th>
        </tr>
        <tr>
          <td>当前位置：</td>
          <td>{value}</td>
        </tr>
        <Updater tip="前进" trigger={addHandler}></Updater>
        {/* <Updater tip="后退" trigger={subtractHandler}></Updater> */}
        <tr>
          <td>操作：</td>
          <td>{Handler}</td>
        </tr>
        {/* <tr>
          <td>操作栈：</td>
          <td>{Histrory}</td>
        </tr> */}
        <tr>
          <td>操作流水日志：</td>
          <td>{Logs.join(" ➡️ ")}</td>
        </tr>
      </table>
    </>
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
