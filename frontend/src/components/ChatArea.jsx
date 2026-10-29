import React, { useEffect } from 'react';
import Nav from './Nav';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { useDispatch, useSelector } from 'react-redux';
import getMessages from "../features/getMessages"
import {setMessages} from "../redux/messageSlice"

const ChatArea = ({ isMobileOpen, setIsMobileOpen }) => {

  const {selectedConversation} = useSelector((state)=> state.conversation)
  const dispatch = useDispatch()

  useEffect(() => {
    const getMesg = async () => {
      if (selectedConversation) {
        const data = await getMessages(selectedConversation._id)
        dispatch(setMessages(data))
      }
    }
  },[selectedConversation])
  
  return (
    <div className="flex-1 flex flex-col h-screen h-dvh bg-black text-zinc-100 min-w-0 overflow-hidden relative">
      {/* Top Navbar */}
      <Nav isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Conversation Scroll View */}
      <div className="flex-1 overflow-y-auto relative flex flex-col">
        <MessageList />
      </div>

      {/* Bottom Sticky Input Section */}
      <ChatInput />
    </div>
  );
};

export default ChatArea;