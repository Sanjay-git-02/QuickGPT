import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { dummyChats, dummyUserData } from "../assets/assets";
import axios from "axios";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [userLoading, setUserLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const { data } = await axios.get("/api/user/data");
      if (data.success) {
        setUser(data.user);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUserLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      if (!user) return toast("Login to create a new chat");
      navigate("/");
      const { data } = await axios.post("/api/chat/create");
      if (data.success && data.chat) {
        setChats((prev) => [data.chat, ...prev]);
        setSelectedChat(data.chat);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchUserChats = async () => {
    try {
      const { data } = await axios.get("/api/chat/get");
      if (data.success) {
        setChats(data.chats);
        if (data.chats.length === 0) {
          await createNewChat();
          return fetchUserChats();
        } else {
          setSelectedChat(data.chats[0]);
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // React to token changes: set axios header, persist token, and fetch user
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);
      setUserLoading(true);
      fetchUser();
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
      setUser(null);
      setUserLoading(false);
    }
  }, [token]);

  // When we have a user, ensure their chats are loaded so selectedChat persists
  useEffect(() => {
    if (user) {
      fetchUserChats();
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
      fetchUser,
      chats,
      setChats,
      selectedChat,
      setSelectedChat,
      theme,
      setTheme,
      navigate,
      createNewChat,
      fetchUserChats,
      token,
      setToken,
      axios,
      userLoading,
    }),
    [user, chats, selectedChat, theme, navigate, token, userLoading],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const UseAppContext = () => useContext(AppContext);
