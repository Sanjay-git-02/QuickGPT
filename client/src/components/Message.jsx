import React, { useEffect } from "react";
import { assets } from "../assets/assets";
import moment from "moment";
import Markdown from 'react-markdown'
import Prism from 'prismjs'

const Message = ({ message }) => {

  useEffect(()=>{
    Prism.highlightAll()
  },[message.content])
    
  return (
    <div>
      {message.role === "user" ? (
        <div className="flex flex-start justify-end my-4 gap-2">
          <div className="flex flex-col gap-2 p-2 px-4 bg-slate-50 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md max-w-2xl">
            <p className="text-sm dark:text-primary"><Markdown>{message.content}</Markdown></p>
            <span className="text-gray-400 dark:text-[#B1A6C0] text-xs">
              {moment(message.timestamp).fromNow()}
            </span>
          </div>
          <img
            src={assets.user_icon}
            alt="User"
            className="w-8 h-8 rounded-full"
          />
        </div>
      ) : (

        <div className="inline-flex flex-col gap-2 p-2 px-4 max-w-2xl bg-primary/20 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md my-4">
          {message.isImage ? (
            <img
              src={message.content}
              alt="Generated content"
              className="w-full max-w-md mt-4 rounded-md"
            />
          ) : (
            <p className="text-sm dark:text-primary reset-tw">
              <Markdown>{message.content}</Markdown>
            </p>
          )}
          <span className="text-gray-400 dark:text-[#B1A6C0] text-xs">
            {moment(message.timestamp).fromNow()}
          </span>
        </div>
      )}
    </div>
  );
};

export default Message;
