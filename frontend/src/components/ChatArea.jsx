import React, { useEffect } from "react";
import Nav from "./Nav";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useDispatch, useSelector } from "react-redux";
import getMessages from "../features/getMessages";
import { setMessages } from "../redux/messageSlice";

const ChatArea = ({ isMobileOpen, setIsMobileOpen }) => {
  const { selectedConversation } = useSelector((state) => state.conversation);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation?._id) {
        dispatch(setMessages([]));
        return;
      }

      try {
        const data = await getMessages(selectedConversation._id);
        dispatch(setMessages(data));
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        dispatch(setMessages([]));
      }
    };

    fetchMessages();
  }, [selectedConversation?._id, dispatch]);

  return (
    <div className="flex-1 flex flex-col h-screen h-dvh bg-black text-zinc-100 min-w-0 overflow-hidden relative">
      <Nav isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Conversation Scroll View */}
      <div className="flex-1 overflow-y-auto relative flex flex-col scrollbar-none">
        <MessageList />
      </div>

      <ChatInput />
    </div>
  );
};

export default ChatArea;