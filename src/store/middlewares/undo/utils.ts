import { applyPatches, Patch } from "immer";

declare interface PatchRecord<S> {
  actionType: string;
  patches: Patch[];
  state: S;
  nextState: S;
  inversePatches: Patch[];
}

declare interface History<S = any> {
  present: S;
  current: number;
  patchStack: Array<PatchRecord<S>>;
}

/**
 * 创建上下文对象
 * @param initState 初始状态
 * @returns 上下文对象
 */
export const createHistory = <T>(initState: T): History<T> => ({
  present: initState,
  current: -1,
  patchStack: [],
});

/**
 * 新增补丁记录
 * @param history 新增记录
 * @param state 最新状态
 * @param record 补丁内容
 */
export const addRecord = <S>(
  history: History<S>,
  state: S,
  record: PatchRecord<S>
) => {
  history.present = state;
  // 如果存在遗留的记录，移除
  // old: [1,2,3,4]
  // current: 2
  // new: 5
  // should remove: 3,4
  // add: 5
  // now: [1,2,5]
  if (history.current < history.patchStack.length) {
    history.patchStack = history.patchStack.slice(0, history.current + 1);
  }
  history.current += 1;
  history.patchStack.push(record);
};

/**
 * 回退历史
 * @param history 上下文对象
 * @returns void
 */
export const undoHistory = <S extends Object>(history: History<S>) => {
  const { patchStack, current, present } = history;
  if (current < 0) return;
  const { inversePatches } = patchStack[current];
  const nextState = applyPatches(present, inversePatches);
  history.present = nextState;
  history.current -= 1;
};

/**
 * 重做历史
 * @param history 上下文对象
 * @returns void
 */
export const redoHistory = <S extends Object>(history: History<S>) => {
  const { patchStack, current, present } = history;
  if (current >= patchStack.length - 1) return;
  const { patches } = patchStack[current + 1];
  const nextState = applyPatches<S>(present, patches);
  history.present = nextState;
  history.current += 1;
};

/**
 * 处理返回值
 * @param history 上下文对象
 * @returns 包含补丁信息的state
 */
export const handleReturnState = <S extends Object>(
  history: History<S>
): S & {
  "@@UNDOABLE": {
    current: number;
    patchStack: PatchRecord<S>[];
    canUndo: boolean;
    canRedo: boolean;
  };
} => {
  const { patchStack, current, present } = history;
  return {
    ...present,
    "@@UNDOABLE": {
      current,
      patchStack,
      canUndo: current >= 0 && current < patchStack.length,
      canRedo: current >= -1 && current < patchStack.length - 1,
    },
  };
};
