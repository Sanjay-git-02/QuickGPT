import React, { useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Chatbox from "./components/Chatbox";
import Community from "./pages/Community";
import Credits from "./pages/Credits";
import { assets } from "./assets/assets";
import "./assets/prism.css";
import Loading from "./pages/Loading";
import Login from "./pages/Login";
import { UseAppContext } from "./context/Context";
import axios from "axios";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { user, userLoading } = UseAppContext();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { pathname } = useLocation();

  if (pathname === "/loading") return <Loading />;

  // Show loading screen while fetching user after login
  if (userLoading && localStorage.getItem("token")) {
    return <Loading />;
  }

  return (
    <>
      <Toaster />
      {!isMenuOpen && (
        <img
          onClick={() => setIsMenuOpen(true)}
          src={assets.menu_icon}
          alt=""
          className="h-8 w-8 not-dark:invert absolute top-3 left-3 md:hidden cursor-pointer"
        />
      )}
      {user ? (
        <div className="dark:bg-linear-to-b from-[#242124] to-[#000000] dark:text-white">
          <div className="flex h-screen w-screen">
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <Routes>
              <Route path="/" element={<Chatbox />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/community" element={<Community />} />
            </Routes>
          </div>
        </div>
      ) : (
        <div className="bg-linear-to-b from-[#242124] to-[#000000] flex items-center justify-center h-screen w-screen">
          <Login />
        </div>
      )}
    </>
  );
};

export default App;
