# 「Redux」基于Redux、Immer实现<撤销重做>功能

> 相关链接：
> - [Immer - Patches](https://immerjs.github.io/immer/zh-CN/patches)
> - [Redux - Middleware 中间件](https://cn.redux.js.org/understanding/history-and-design/middleware#understanding-middleware)
> - [命令模式](https://refactoringguru.cn/design-patterns/command)


## 场景复现

在一个项目中，有一个需求：基于之前存储的操作流水日志，来实现回放功能，需要支持播放，暂停、进度条拖动功能。

> 什么是操作流水日志？
> 比如，来看一下一个JSON数据包：「initState」代表初始数据，「logs」代表对该数据的一系列操作。
> ```json
> {
>   "initState":{
>     "value": 0
>   },
>   "logs": [
>     { "type":"add", "payload": 3 },
>     { "type":"subtract", "payload": 1 },
>     { "type":"multiply", "payload": 2 },
>     { "type":"add", "value": 3 },
>   ]
> }
> ```

然后我们对该数据实现「播放」功能，那么数据的变化就是：「0 -> 3 -> 2 -> 4 -> 7」

那么暂停功能可能就是一小段：「0 -> 3 -> 2」 或者  「2 -> 4 -> 7」

那么对于进度条拖动的话，那么就涉及到对数据的逆向操作。比如：「7 -> 4 -> 2 -> 3 -> 0」。上一步「add：3」，那么撤销上一步就是「subtract：3」。

有两种实现方式：（假设是从7到4）
- 对于最后落到的结点，都基于初始状态，重新对数据进行操作到该结点的位置。那么就需要执行4次对数据的计算。
- 存在撤销的数据，如果我们知道怎么从7撤回到4，那么只需要执行1次即可以实现目标。

对比两种方式，其实会发现，大部分情况下：

- 第一种方式消耗比较大，每次都需要进行大量数据的修改，但这种方式我们不需要编写额外的逻辑，实现起来比较简单；
- 第二种方式对于数据的修改比较轻量，但我们需要知道并存储「对数据修改的每一个反向操作」，实现难度比较大。

## 命令模式

对于第一种方式，比较简单，我们不给予示例。

对于第二种方式，我们可以用「命令模式」进行实现。


```ts
type ActionType = 'add' | 'subtract' | 'multiply'
type CommandReturn = {
  exec: () => void
  undo: () => void
}
type useCount = [number, Dispatch<SetStateAction<number>>]


// 应用action生成新state
const applyAction = (state: number, type: ActionType, payload: number) => {
  if (type === 'add') {
    return state + payload
  } else if (type === 'subtract') {
    return state - payload
  } else if (type === 'multiply') {
    return state * payload
  } else {
    return state
  }
}


// 命令生成器，生成命令对象
const Command = (reciver: useCount, type: ActionType, payload: number): CommandReturn => {
  const [value, setValue] = reciver;
  let oldValue: number = value;
  return {
    exec() {
      setValue(applyAction(oldValue, type, payload))
    },
    undo() {
      setValue(oldValue)
    }
  }
}


const demoData = {
  "initState": {
    "value": 0
  },
  "logs": [
    { "type": "add", "payload": 3 },
    { "type": "subtract", "payload": 1 },
    { "type": "multiply", "payload": 2 },
    { "type": "add", "payload": 3 },
  ]
}


const CommandDemo = function () {
  const [data] = useState(demoData);
  // 命令接收者
  const reciver = useState<number>(data.initState.value);
  // 当前命令
  const [current, setCurrent] = useState<number>(-1);
  // 命令列表
  const [commandList, setCommandList] = useState<CommandReturn[]>([]);
  // 上一步
  const prev = () => {
    commandList[current].undo();
    setCurrent(current - 1);
  }
  // 下一步
  const next = () => {
    const { type, payload } = data.logs[current + 1];
    // 不重复创建
    const commond = commandList[current + 1] || Command(reciver, type, payload);
    if (current + 1 === commandList.length) setCommandList([...commandList, commond]);
    commond.exec();
    setCurrent(current + 1);
  }


  return <>
    <div>{reciver[0]}</div>
    <div>
      <button disabled={current < 0} onClick={prev}>上一步</button>
      <button disabled={current === data.logs.length - 1} onClick={next}>下一步</button>
    </div>
  </>;
};
```

以上是一个基础的撤销重做的demo，那么当我们使用redux来进行状态的管理，效果也是一样的。

## Immer中的Patch功能

在React中，我们使用Redux来进行数据状态的管理，Redux中遵循着「不可变数据」的规则，底层使用「Immer」来帮助处理原始状态，生成新的状态，避免开发者繁琐地使用「...」等。

使用 Immer，您会将所有更改应用到临时 draft，它是 currentState 的代理。一旦你完成了所有的 mutations，Immer 将根据对 draft state 的 mutations 生成 nextState。这意味着您可以通过简单地修改数据来与数据交互，同时保留不可变数据的所有好处。

```ts
import produce from "immer"

const nextState = produce(baseState, draft => {
    draft[1].done = true
    draft.push({title: "Tweet about it"})
})
```

而在 producer 运行期间，Immer 可以记录所有的补丁来回溯 reducer造成的更改 。

> ⚠ 在版本6之后，必须在启动应用程序调用一次「 enablePatches() 」来启用对 Patches 的支持。

在我们上述的功能，Patches可以轻松的完成我们的需求。那么我们如何使用「Immer」中的Patches功能，来让我们的store具备「撤销、重做」等功能呢？

## 借助Redux中间件

Redux middleware 解决的问题与 Express 或 Koa middleware 不同，但在概念上是相似的。它在 dispatch action 的时候和 action 到达 reducer 那一刻之间提供了三方的逻辑拓展点。可以使用 Redux middleware 进行日志记录、故障监控上报、与异步 API 通信、路由等。

当你使用了中间件，它就像是一个中间人，让你能够在真正dispatch之前，dispatch之后，执行你想要完成的事情。

我们可以整理一下，如果我们想通过中间件实现「撤销、重做」功能，那么我们需要在dispatch时，可以借助「Immer」的能力，保存下该操作的「正补丁 和 逆补丁」，以便供后续的撤销重做功能提供材料。

另外，要想执行「撤销、重做」操作，本质上还是修改store的状态来实现，但触发原始的action，并不能达到我们的要求。那么我们就需要新增两个action，分别是「undo」和「redo」，当需要撤回时，dispatch(undo)，从队列中获取当前所在位置的逆补丁并且应用，即可获得新的state，实现撤销功能，重做功能也是同理，取出正补丁并应用。

## 示例代码

- 源码：见仓库
- 在线预览：[codesandbox](https://codesandbox.io/p/github/Merlin218/redux-undo-demo/main?file=%2FREADME.md&workspace=%257B%2522activeFileId%2522%253A%2522clf55aogv000jg3eneep0056x%2522%252C%2522openFiles%2522%253A%255B%2522%252FREADME.md%2522%255D%252C%2522sidebarPanel%2522%253A%2522EXPLORER%2522%252C%2522gitSidebarPanel%2522%253A%2522COMMIT%2522%252C%2522spaces%2522%253A%257B%2522clf55art700153b6iqsz681t3%2522%253A%257B%2522key%2522%253A%2522clf55art700153b6iqsz681t3%2522%252C%2522name%2522%253A%2522Default%2522%252C%2522devtools%2522%253A%255B%257B%2522key%2522%253A%2522clf55art800163b6iu2a4vlbj%2522%252C%2522type%2522%253A%2522PROJECT_SETUP%2522%252C%2522isMinimized%2522%253Atrue%257D%252C%257B%2522type%2522%253A%2522PREVIEW%2522%252C%2522taskId%2522%253A%2522dev%2522%252C%2522port%2522%253A5173%252C%2522key%2522%253A%2522clf55awb200b13b6iy7ib4335%2522%252C%2522isMinimized%2522%253Afalse%257D%252C%257B%2522type%2522%253A%2522TASK_LOG%2522%252C%2522taskId%2522%253A%2522dev%2522%252C%2522key%2522%253A%2522clf55au1m00523b6i7wnmsay4%2522%252C%2522isMinimized%2522%253Afalse%257D%255D%257D%257D%252C%2522currentSpace%2522%253A%2522clf55art700153b6iqsz681t3%2522%252C%2522spacesOrder%2522%253A%255B%2522clf55art700153b6iqsz681t3%2522%255D%252C%2522hideCodeEditor%2522%253Afalse%257D)
