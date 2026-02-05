import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { dummyChats, dummyUserData } from "../assets/assets";

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    setUser(dummyUserData);
  }, []);

  useEffect(() => {
    if (user) {
      if (dummyChats.length > 0) {
        setChats(dummyChats);
        setSelectedChat(dummyChats[0]);
      }
    } else {
      setChats([]);
      setSelectedChat(null);
    }
  }, [user]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      chats,
      setChats,
      selectedChat,
      setSelectedChat,
      theme,
      setTheme,
      navigate,
    }),
    [user, chats, selectedChat, theme, navigate]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const UseAppContext = () => useContext(AppContext);