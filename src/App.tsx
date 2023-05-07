import { useState, FC, ReactNode, useMemo, useEffect, useCallback } from "react";
import { Provider, connect, ConnectedProps, useDispatch } from "react-redux";
import store from "./store";
import { 前进, 后退, 重置 } from "./store/counter";
import { redoAction, undoAction } from "./store/middlewares/undo";
import { Log, RootState } from "./types";
import "./App.css";
import { FluentEmojiFlatCowboyHatFace } from "./icons/face";

interface UpdaterProps {
  trigger: (value: number) => void;
  tip?: ReactNode;
}

const useJudge = (times: number, value: number) => useCallback((index: number) => {
  if (times === 0) {
    return false
  } else if (times < 2) {
    return index === treasurePosition
  } else {
    return index === value
  }
}, [value, times])

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

interface CompProps extends ConnectedProps<typeof reduxConnector> {
  setLogs: React.Dispatch<React.SetStateAction<Log[]>>,
}

const treasurePosition = 3;

const Comp: FC<CompProps> = function ({
  value,
  canUndo,
  canRedo,
  patchStack,
  current,
  setLogs,
}) {
  const dispatch = useDispatch();

  const undo = () => {
    dispatch(undoAction());
  };

  const redo = () => {
    dispatch(redoAction());
  };

  const addHandler = (value: number) => {
    setLogs((last) => [...last, {
      desc: "前进" + value,
      type: '前进',
      value: value
    }]);
    dispatch(前进(value));
  };

  const subtractHandler = (value: number) => {
    setLogs((last) => [...last, {
      desc: "后退" + value,
      type: '后退',
      value: value
    }]);
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

  const [times, setTimes] = useState(0);

  useEffect(() => {
    if (value === treasurePosition) {
      setTimes((last) => last + 1);
    }
  }, [value])

  const initData = () => {
    setLogs([{
      desc: "初始位置：0",
      type: '重置',
      value: { value: 0 }
    }]);
    dispatch(重置({ value: 0 }))
    setTimes(0)
  }


  const Handler = useMemo(() => {
    return (
      <>
        <button style={{
          marginRight: 20,
        }} disabled={!canUndo} onClick={undo}>
          时空回退（撤销）
        </button>
        <button style={{
          marginRight: 20,
        }} disabled={!canRedo} onClick={redo}>
          时空还原（重做）
        </button>
        <button onClick={initData}>
          重置
        </button>
      </>
    );
  }, [dispatch, canUndo, canRedo]);

  const judge = useJudge(times, value)


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
        <tbody>
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
          <Updater tip="后退" trigger={subtractHandler}></Updater>
          {/* <tr>
          <td>操作栈：</td>
          <td>{Histrory}</td>
        </tr> */}

          {/* <tr>
            <td>轨迹复盘</td>
            <td>{Handler}</td>
          </tr> */}
        </tbody>
      </table>
    </>
  );
};

const UndoDemo = reduxConnector(Comp);

export default function App() {
  const [value, setValue] = useState(0)

  const [logs, setLogs] = useState<Log[]>([{
    desc: "初始位置：0",
    type: '重置',
    value: { value: 0 }
  }]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const replay = () => {
    logs.forEach((log, index) => {
      setTimeout(() => {
        if (log.type === '重置') {
          setValue((log.value as { value: number }).value)
        } else if (log.type === '前进') {
          setValue((last) => last + 1)
        } else if (log.type === '后退') {
          setValue((last) => last - 1)
        }
        setCurrentIndex(index);
      }, index * 1000)
    })
  }

  const [showGod, setShowGod] = useState(false)


  return (
    <Provider store={store}>
      <UndoDemo setLogs={setLogs} />
      <button onClick={() => setShowGod(last => !last)}>{showGod ? '收起' : '展开'}</button>
      {
        showGod && <>
          <table>
            <tbody>
              <tr>
                <td>操作流水日志：</td>
                <td>{logs.map((item, index) => {
                  return (
                    index === currentIndex ? '🔸' + item.desc : item.desc
                  )
                }).join(" ➡️ ")}</td>
              </tr>
            </tbody>
          </table>
          <div style={{
            display: 'flex',
            justifyContent: 'space-evenly',
            width: '100%',
            marginTop: 20
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
              </div>
            ))}
          </div>
          <div>
            <button style={{
              marginTop: 20
            }} onClick={replay}>上帝回放</button>
          </div>
        </>
      }
    </Provider>
  );
}
