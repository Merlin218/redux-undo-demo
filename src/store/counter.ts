import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface State {
  value: number;
}

const initialState: State = {
  value: 0,
};
const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    add: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
    subtract: (state, action: PayloadAction<number>) => {
      state.value -= action.payload;
    },
    multiple: (state, action: PayloadAction<number>) => {
      state.value *= action.payload;
    },
  },
});

export const { add, subtract, multiple } = counterSlice.actions;
export default counterSlice.reducer;
