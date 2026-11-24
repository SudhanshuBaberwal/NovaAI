import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
  name: "message",
  initialState: {
    messages: [],
    artifacts: [],
  },
  reducers: {
    setMessages: (state, action) => {
      state.messages = Array.isArray(action.payload)
        ? action.payload
        : action.payload?.messages || action.payload?.data || [];
    },
    addMessages: (state, action) => {
      if (!Array.isArray(state.messages)) {
        state.messages = [];
      }
      state.messages.push(action.payload);
    },
    setArtifacts: (state, action) => {
      state.artifacts = Array.isArray(action.payload) ? action.payload : [];
    },
    clearMessages: (state) => {
      state.messages = [];
      state.artifacts = [];
    },
  },
});

export const { setMessages, addMessages, setArtifacts, clearMessages } =
  messageSlice.actions;
export default messageSlice.reducer;