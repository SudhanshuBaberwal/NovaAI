import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
  name: "message",
  initialState: {
    messages: [],
  },
  reducers: {
    setMessages: (state, action) => {
      state.messages = Array.isArray(action.payload)
        ? action.payload
        : action.payload?.messages || [];
    },
    addMessages: (state, action) => {
      if (!Array.isArray(state.messages)) {
        state.messages = [];
      }
      state.messages.push(action.payload);
    },
  },
});

export const { setMessages, addMessages } = messageSlice.actions;
export default messageSlice.reducer;