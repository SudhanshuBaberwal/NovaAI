import { signInWithPopup } from "firebase/auth";
import React, { useState } from "react";
import { auth, googleProvider } from "../../utils/firebase";
import api from "../../utils/axios";
import { FcGoogle } from "react-icons/fc";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../redux/userSlice";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import Artifact from "../components/Artifact";

const Home = () => {
  const { userData } = useSelector((state) => state.user);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async (token) => {
    try {
      const { data } = await api.post("/api/auth/login", { token });
      dispatch(setUserData(data));
    } catch (error) {
      console.log(error);
    }
  };

  const googleLogin = async () => {
    const data = await signInWithPopup(auth, googleProvider);
    const token = await data.user.getIdToken();
    await handleLogin(token);
  };

  return (
    <div className="h-screen h-dvh flex bg-black text-white overflow-hidden">
      <Sidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <ChatArea
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <Artifact />

      {!userData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-85 bg-zinc-950 border border-zinc-800 rounded-2xl p-7 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-[17px] font-semibold text-white tracking-tight">
                Welcome to NovaAI
              </h2>
              <p className="text-[13px] text-zinc-400">
                Please login to continue using the app
              </p>
            </div>
            <button
              onClick={googleLogin}
              className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-semibold
              text-black bg-white hover:bg-zinc-200 active:scale-[0.99]
              transition-all duration-150 cursor-pointer"
            >
              <FcGoogle size={16} />
              Continue with Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;