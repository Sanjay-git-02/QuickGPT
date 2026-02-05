import React, { useState } from "react";
import { assets } from "../assets/assets";
import { UseAppContext } from "../context/Context";
import moment from "moment";

const Sidebar = ({ isMenuOpen, setIsMenuOpen }) => {
  const { chats, setChats, setSelectedChat, theme, setTheme, user, navigate, selectedChat } = UseAppContext();
  const [search, setSearch] = useState("");



  return (
    <div
      className={`flex flex-col h-screen min-w-72 p-5 dark:bg-linear-to-b from-[#242124] to-[#000000] border-r border-[#80609F]/30 backdrop-blur-3xl transition-all duration-500 max-md:absolute left-0 z-10 ${
        !isMenuOpen && "max-md:-translate-x-full"
      }`}
    >
      {/* Logo */}
      <img
        src={theme === "dark" ? assets.logo_full : assets.logo_full_dark}
        alt="logo"
        className="w-full max-w-48"
      />

      {/* New Chat */}
      <button
        className="flex justify-center items-center w-full py-2 mt-10 text-white bg-linear-to-r from-[#A456F7] to-[#3D81F6] rounded-md text-sm cursor-pointer"
        onClick={() => {
          // Add new chat logic here if needed
        }}
      >
        <span className="mr-2 text-3xl">+</span>New Chat
      </button>

      {/* Search */}
      <div className="flex items-center mt-5 gap-2 border border-gray-400 p-3 dark:border-white/20 rounded-md">
        <img src={assets.search_icon} alt="search" className="w-4 not-dark:invert" />
        <input
          onChange={(e) => setSearch(e.target.value)}
          value={search}
          type="text"
          placeholder="Search Conversations"
          className="text-sm outline-0 placeholder:text-gray-400 w-full"
        />
      </div>

      {/* Recent Chats */}
      {chats.length > 0 && <p className="mt-4 text-sm">Recent Chats</p>}
      <div className="flex-1 overflow-y-scroll mt-3 text-sm space-y-3">
        {chats
          .filter((chat) =>
            chat.messages?.[0]
              ? chat.messages[0].content.toLowerCase().includes(search.toLowerCase())
              : chat.name.toLowerCase().includes(search.toLowerCase())
          )
          .map((chat) => (
            <div
              key={chat._id}
              onClick={() => {
                navigate("/");
                setSelectedChat(chat);
                setIsMenuOpen(false);
              }}
              className={`p-2 px-4 dark:bg-[#57317C]/10 border border-gray-300 dark:border-[#80609F]/15 rounded-md cursor-pointer flex justify-between group ${
                selectedChat?._id === chat._id ? "bg-gray-200 dark:bg-[#57317C]/30" : ""
              }`}
            >
              <div>
                <p className="truncate w-full">
                  {chat.messages?.[0]?.content.slice(0, 32) || chat.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-[#B1A6C0]">
                  {moment(chat.updatedAt).fromNow()}
                </p>
              </div>

              {/* Delete Chat */}
              <img
                src={assets.bin_icon}
                alt="delete chat"
                className="hidden group-hover:block w-4 cursor-pointer not-dark:invert"
                onClick={(e) => {
                  e.stopPropagation(); // prevent selecting chat
                  setChats((prevChats) => prevChats.filter((c) => c._id !== chat._id));
                  if (selectedChat?._id === chat._id) {
                    setSelectedChat(null);
                  }
                }}
              />
            </div>
          ))}
      </div>

      {/* Community Images */}
      <div
        onClick={() => {
          navigate("/community");
          setIsMenuOpen(false);
        }}
        className="flex items-center gap-2 p-3 mt-6 border border-gray-300 rounded-md cursor-pointer dark:border-white/15 hover:scale-105 transition-all"
      >
        <img src={assets.gallery_icon} alt="gallery" className="w-4.5 not-dark:invert" />
        <div className="flex flex-col text-sm">
          <p>Community Images</p>
        </div>
      </div>

      {/* Credits */}
      <div
        onClick={() => {
          navigate("/credits");
          setIsMenuOpen(false);
        }}
        className="flex items-center gap-2 p-3 mt-4 border border-gray-300 rounded-md cursor-pointer dark:border-white/15 hover:scale-105 transition-all"
      >
        <img src={assets.diamond_icon} alt="credits" className="w-4.5 dark:invert" />
        <div className="flex flex-col text-sm">
          <p>Credits: {user?.credits}</p>
          <p className="text-xs text-gray-400">Purchase credits to use QuickGPT</p>
        </div>
      </div>

      {/* Dark Mode Toggle */}
      <div className="flex items-center justify-between gap-2 p-3 mt-4 border border-gray-300 rounded-md cursor-pointer dark:border-white/15">
        <div className="flex text-sm gap-2 items-center">
          <img src={assets.theme_icon} alt="theme" className="w-4 not-dark:invert" />
          <p>Dark Mode</p>
        </div>
        <label className="relative inline-flex cursor-pointer">
          <input
            onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
            type="checkbox"
            className="sr-only peer"
            checked={theme === "dark"}
          />
          <div className="w-9 h-5 bg-gray-400 rounded-full peer-checked:bg-purple-600 transition-all"></div>
          <span className="absolute left-1 top-1 w-3 h-3 rounded-full bg-white transition-transform peer-checked:translate-x-4"></span>
        </label>
      </div>

      {/* User Section */}
      <div
        onClick={() => navigate("/login")}
        className="flex items-center justify-between gap-2 p-3 mt-4 border border-gray-300 rounded-md cursor-pointer dark:border-white/15 group"
      >
        <div className="flex items-center gap-2">
          <img src={assets.user_icon} alt="user" className="w-4.5 not-dark:invert" />
          <p className="text-sm flex dark:text-primary truncate">
            {user ? user.name : "Login your Account"}
          </p>
        </div>

        {user && (
          <img
            src={assets.logout_icon}
            alt="logout"
            className="h-5 cursor-pointer hidden not-dark:invert group-hover:block"
            onClick={(e) => {
              e.stopPropagation();
              setChats([]);
              setSelectedChat(null);
              navigate("/login");
            }}
          />
        )}
      </div>

      {/* Close Button (Mobile) */}
      <img
        onClick={() => setIsMenuOpen(false)}
        src={assets.close_icon}
        alt="close"
        className="w-5 h-5 top-3 right-3 absolute not-dark:invert md:hidden cursor-pointer"
      />
    </div>
  );
};

export default Sidebar;