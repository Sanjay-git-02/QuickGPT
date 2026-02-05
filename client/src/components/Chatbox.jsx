import React, { useEffect, useRef, useState } from "react";
import { UseAppContext } from "../context/Context";
import { assets } from "../assets/assets";
import Message from "./Message";

const Chatbox = () => {
  const { selectedChat, theme } = UseAppContext();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [prompt,setPrompt] = useState("")
  const [mode,setMode] = useState('text')
  const [isPublished,setIsPublished] = useState(false)

  const containerRef = useRef(null)

  const handlesubmit = async(e)=>{
    e.preventDefault()
  }

  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  useEffect(()=>{
    if(containerRef.current){
      containerRef.current.scrollTo({
        top:containerRef.current.scrollHeight,
        behaviour:"smooth"
      })
    }
  },[messages])

  return (
    <div className="flex-1 flex flex-col justify-center m-5 md:m-10 xl:mx-30 max-md:mt-14 2xl:pr-40">
      <div ref={containerRef} className="flex-1 mb-5 overflow-y-scroll">
        {messages.length === 0 && (
          <div className="h-full flex flex-col justify-center items-center gap-2 text-primary">
            <img
              src={theme === "dark" ? assets.logo_full : assets.logo_full_dark}
              alt="logo"
              className="w-full max-w-56 sm:max-w-68"
            />
            <p className="mt-5 text-4xl sm:text-6xl text-gray-400 dark:text-white">
              Ask me anything.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
        {/* Message Loading */}
        {loading && (
          <div className="loader flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full dark:bg-white animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full dark:bg-white animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full dark:bg-white animate-bounce"></div>
          </div>
        )}

        {mode === "image" && (
          <label className="inline-flex items-center gap-2 mb-3 text-sm mx-auto">
            <p className="text-xs">Publish the Generated Image to Community</p>
            <input onChange={(e)=>setIsPublished(e.target.checked)} type="checkbox" checked={isPublished} />
          </label>
        )}

        {/*Prompt form */}
        <form onSubmit={handlesubmit} className="bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark:border-[#80609F] p-3 pl-4 flex items-center mx-auto rounded-full w-full max-w-2xl gap-4">
          <select onChange={(e)=>setMode(e.target.value)} className="text-sm pl-3 pr-2 outline-0">
            <option value="text" className="dark:bg-purple-400">Text</option>
            <option value="image" className="dark:bg-purple-400">Image</option>
          </select>
          <input onChange={(e)=>setPrompt(e.target.value)} type="text" placeholder="Enter the Prompt..." className="flex-1 w-full text-sm outline-0"/>
          <button disabled={loading}>
            <img src={loading ? assets.stop_icon : assets.send_icon} alt="" className="w-8 cursor-pointer"/>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbox;
