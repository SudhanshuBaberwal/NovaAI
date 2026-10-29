import React, { useEffect, useState } from "react";
import {
  Coins,
  LogOut,
  MessageSquare,
  PanelLeft,
  PanelRight,
  Plus,
  User,
  X,
} from "lucide-react";
import { getConversations } from "../features/getConversation";
import { setUserData } from "../redux/userSlice";
import { useDispatch, useSelector } from "react-redux";
import {
  addConversation,
  setConversations,
  setSelectedConversation,
} from "../redux/conversationSlice";
import { createConversation } from "../features/createConversations";
import { logout } from "../features/Logout";
import { useToast } from "../utils/ToastContext";

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { showToast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dispatch = useDispatch();

  const { conversations, selectedConversation } = useSelector(
    (state) => state.conversation
  );
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    const getConv = async () => {
      try {
        const data = await getConversations();
        dispatch(setConversations(data));
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };
    getConv();
  }, [dispatch, userData?._id]);

  const handleCreateConversation = async () => {
    try {
      const data = await createConversation();
      dispatch(addConversation(data));
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const handleSelectConversation = (conv) => {
    dispatch(setSelectedConversation(conv));
    if (isMobileOpen && setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col bg-black text-zinc-100 border-r border-zinc-800 transition-all duration-300 ease-in-out shrink-0 ${
          /* Mobile Drawer Position */
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${
          /* Desktop Width Toggle */
          collapsed ? "lg:w-16" : "w-72 lg:w-64"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-3 border-b border-zinc-800 shrink-0">
          {!collapsed ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  NovaAI
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full uppercase">
                  Free
                </span>
              </div>
              <div className="flex items-center gap-1">
                {/* Desktop Collapse Toggle */}
                <button
                  onClick={() => setCollapsed(true)}
                  className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                  title="Collapse sidebar"
                >
                  <PanelLeft size={18} />
                </button>
                {/* Mobile Close Button */}
                <button
                  onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
                  className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <button
                onClick={() => setCollapsed(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                title="Expand sidebar"
              >
                <PanelRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* New Chat Action Button */}
        <div className="p-3 shrink-0">
          <button
            onClick={handleCreateConversation}
            className={`w-full flex items-center justify-center gap-2 font-medium bg-white text-black hover:bg-zinc-200 active:scale-[0.98] transition-all duration-150 rounded-lg shadow-sm ${
              collapsed ? "h-10 px-0" : "py-2.5 px-3 text-sm"
            }`}
            title="New Chat"
          >
            <Plus size={18} />
            {!collapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Section Title */}
        {!collapsed && (
          <div className="px-4 pt-2 pb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider shrink-0">
            {conversations?.length > 0 ? "Recent" : "No Recent Conversations"}
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-none">
          {conversations?.map((conv) => {
            const isActive = selectedConversation?._id === conv?._id;
            return (
              <button
                key={conv?._id || Math.random()}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left text-sm transition-all duration-150 group ${
                  isActive
                    ? "bg-zinc-800 text-white font-medium border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
                }`}
                title={conv?.title || "New Chat"}
              >
                <MessageSquare
                  size={16}
                  className={`shrink-0 ${
                    isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                  }`}
                />
                {!collapsed && (
                  <span className="truncate flex-1">
                    {conv?.title || "New Chat"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer / User Profile */}
        <div className="p-3 border-t border-zinc-800 shrink-0">
          {userData ? (
            <div
              className={`flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-zinc-900 transition-colors ${
                collapsed ? "flex-col items-center" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  {userData?.avatar && !imageError ? (
                    <img
                      className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                      src={userData?.avatar}
                      alt="User avatar"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                      <User size={16} />
                    </div>
                  )}
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-200 truncate leading-tight">
                      {userData?.name || "User"}
                    </p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      Free Plan
                    </p>
                  </div>
                )}
              </div>

              {!collapsed ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="Coins"
                  >
                    <Coins size={16} />
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      showToast("Logout Successfully", "success");
                      dispatch(setUserData(null));
                    }}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    logout();
                    showToast("Logout Successfully", "success");
                    dispatch(setUserData(null));
                  }}
                  className="p-1.5 mt-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          ) : (
            <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors">
              Login
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;