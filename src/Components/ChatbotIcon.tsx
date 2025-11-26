import React from "react";
import BotIcon from "../assets/chatbotlogo.svg"; // 🔸 apni SVG file ka path sahi rakho

const ChatbotIcon: React.FC = () => {
  return (
    <div className="w-8 h-8 bg-[#f77b30] rounded-full flex items-center justify-center">
      <img
        src={BotIcon}
        alt="Chatbot Icon"
        className="w-5 h-5 text-white invert brightness-0"
      />
    </div>
  );
};

export default ChatbotIcon;
