import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface State {
  value: number;
}

const initialState: State = {
  value: 0,
};
const counterSlice = createSlice({
  name: "人",
  initialState,
  reducers: {
    前进: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
    后退: (state, action: PayloadAction<number>) => {
      state.value -= action.payload;
    },
    multiple: (state, action: PayloadAction<number>) => {
      state.value *= action.payload;
    },
  },
});

export const { 前进, 后退, multiple } = counterSlice.actions;
export default counterSlice.reducer;
