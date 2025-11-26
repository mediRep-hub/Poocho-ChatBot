import React from "react";
import type { Chat } from "../types";

interface ChatMessageProps {
  chat: Chat;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ chat }) => {
  if (chat.hideInChat) return null;

  const isBot = chat.role === "model";

  return (
    <div
      className={`w-full flex mb-3 ${isBot ? "justify-start" : "justify-end"}`}
    >
      {isBot ? (
        // Bot Message
        <div className="flex items-start gap-2">
          <p
            className={`px-3 py-2 text-sm max-w-[75%] rounded-[13px_13px_13px_3px] whitespace-pre-line ${
              chat.isError
                ? "text-red-500 bg-[#FDEAEA]"
                : "bg-[#F6F2FF] text-black"
            }`}
          >
            {chat.text}
          </p>
        </div>
      ) : (
        // User Message
        <p
          className={`px-3 py-2 text-sm rounded-[13px_13px_3px_13px] text-left whitespace-pre-line ${
            chat.isError
              ? "text-red-500 bg-[#FDEAEA]"
              : "bg-[#f77b30] text-white"
          }`}
        >
          {chat.text}
        </p>
      )}
    </div>
  );
};

export default ChatMessage;
