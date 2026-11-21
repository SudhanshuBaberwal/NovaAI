import { createSlice } from "@reduxjs/toolkit";

const conversationSlice = createSlice({
  name: "conversation",

  initialState: {
    conversations: [],
    selectedConversation: null,
  },

  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },

    addConversation: (state, action) => {
      state.conversations.unshift(action.payload);
    },

    setSelectedConversation: (state, action) => {
      state.selectedConversation = action.payload;
    },

    clearSelectedConversation: (state) => {
      state.selectedConversation = null;
    },
  },
});

export const {
  setConversations,
  addConversation,
  setSelectedConversation,
  clearSelectedConversation,
} = conversationSlice.actions;

export default conversationSlice.reducer;
